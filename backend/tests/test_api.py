import hashlib
import os
import subprocess
import sys
import tempfile
import time
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

from joserfc import jwt
from joserfc.jwk import RSAKey
from sqlalchemy import create_engine, inspect, select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from api.auth import oauth
from app import app
from database import make_database_url
from database.models import Base, User, UserSession


class ApiTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://", poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        engine_patch = patch("database.engine", self.engine)
        engine_patch.start()
        self.addCleanup(engine_patch.stop)
        self.addCleanup(self.engine.dispose)
        self.client = app.test_client()
        previous_secret = app.secret_key
        app.secret_key = "test-secret"
        self.addCleanup(setattr, app, "secret_key", previous_secret)

    def test_health(self):
        self.assertEqual(self.client.get("/api/health").get_json(), {"status": "ok"})
        self.assertEqual(self.client.get("/api/db-health").get_json(), {"status": "ok"})

    def test_database_unavailable(self):
        with patch.object(self.engine, "connect", side_effect=SQLAlchemyError("unavailable")):
            response = self.client.get("/api/db-health")
        self.assertEqual(response.status_code, 503)

    def test_init_db_creates_model_tables(self):
        Base.metadata.drop_all(self.engine)
        result = app.test_cli_runner().invoke(args=["init-db"])
        self.assertEqual(result.exit_code, 0, result.output)
        self.assertEqual(
            set(inspect(self.engine).get_table_names()),
            {
                "users", "user_sessions", "courses", "lessons", "activities",
                "activity_videos", "user_course_enrollments", "user_activity_progress",
                "user_simulation_progress",
            },
        )

    def test_callback_rejects_missing_oauth_state(self):
        with patch.object(oauth.google, "fetch_access_token") as fetch:
            response = self.client.get("/api/auth/google/callback?code=test&state=wrong")
        self.assertEqual(response.status_code, 400)
        fetch.assert_not_called()

    def test_login_redirect_uses_state_and_pkce(self):
        google = oauth.google
        metadata = {"authorization_endpoint": "https://accounts.google.com/o/oauth2/v2/auth"}
        with patch.object(google, "client_id", "client-id"), \
                patch.object(google, "client_secret", "client-secret"), \
                patch.object(google, "load_server_metadata", return_value=metadata):
            response = self.client.get("/api/auth/google")
        self.assertEqual(response.status_code, 302)
        params = parse_qs(urlparse(response.location).query)
        self.assertTrue(params["state"][0])
        self.assertTrue(params["nonce"][0])
        self.assertEqual(params["code_challenge_method"], ["S256"])
        self.assertTrue(params["code_challenge"][0])

    def test_callback_rejects_unverified_email(self):
        with patch.object(oauth.google, "authorize_access_token", return_value={
            "userinfo": {"sub": "google-id", "email": "test@example.com", "email_verified": False}
        }):
            response = self.client.get("/api/auth/google/callback")
        self.assertEqual(response.status_code, 400)
        with Session(self.engine) as db:
            self.assertIsNone(db.scalar(select(User)))

    def test_callback_rejects_id_token_with_wrong_nonce(self):
        google = oauth.google
        key = RSAKey.generate_key(parameters={"kid": "test"})
        metadata = {
            "authorization_endpoint": "https://accounts.google.com/o/oauth2/v2/auth",
            "issuer": "https://accounts.google.com",
            "id_token_signing_alg_values_supported": ["RS256"],
            "jwks": {"keys": [key.as_dict()]},
        }
        now = int(time.time())
        id_token = jwt.encode({"alg": "RS256", "kid": "test"}, {
            "iss": metadata["issuer"], "sub": "google-id", "aud": "client-id",
            "iat": now, "exp": now + 300, "nonce": "wrong",
            "email": "test@example.com", "email_verified": True,
        }, key)
        with patch.object(google, "client_id", "client-id"), \
                patch.object(google, "client_secret", "client-secret"), \
                patch.object(google, "load_server_metadata", return_value=metadata), \
                patch.object(google, "fetch_access_token", return_value={"access_token": "test", "id_token": id_token}):
            login = self.client.get("/api/auth/google")
            state = parse_qs(urlparse(login.location).query)["state"][0]
            response = self.client.get(f"/api/auth/google/callback?code=test&state={state}")
        self.assertEqual(response.status_code, 400)

    def test_google_login_updates_existing_user_and_logout_revokes_session(self):
        info = {"sub": "google-id", "email": "test@example.com", "email_verified": True, "name": "Test"}
        with patch.object(oauth.google, "authorize_access_token", return_value={"userinfo": info}):
            response = self.client.get("/api/auth/google/callback")
            self.assertEqual(response.status_code, 302)
            self.assertIn("HttpOnly", response.headers["Set-Cookie"])
            self.assertIn("SameSite=Lax", response.headers["Set-Cookie"])
            first_id = self.client.get("/api/auth/me").get_json()["user"]["id"]
            info["name"] = "Changed"
            self.assertEqual(self.client.get("/api/auth/google/callback").status_code, 302)

        user = self.client.get("/api/auth/me").get_json()["user"]
        self.assertEqual((user["id"], user["name"]), (first_id, "Changed"))
        token = self.client.get_cookie("auth_session").value
        self.assertEqual(self.client.post("/api/auth/logout").status_code, 403)
        response = self.client.post("/api/auth/logout", headers={"X-Requested-With": "XMLHttpRequest"})
        self.assertEqual(response.status_code, 200)
        self.client.set_cookie("auth_session", token)
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)
        with Session(self.engine) as db:
            self.assertEqual(len(db.scalars(select(User)).all()), 1)
            self.assertIsNone(db.get(UserSession, hashlib.sha256(token.encode()).hexdigest()))

    def test_session_revocation_failure_is_not_reported_as_logout(self):
        self.client.set_cookie("auth_session", "session-token")
        with patch("api.auth.database", side_effect=SQLAlchemyError("unavailable")):
            response = self.client.post("/api/auth/logout", headers={"X-Requested-With": "XMLHttpRequest"})
        self.assertEqual(response.status_code, 503)
        self.assertIsNotNone(self.client.get_cookie("auth_session"))

    def test_mock_login_is_disabled_by_default(self):
        response = self.client.post("/api/auth/mock", headers={"X-Requested-With": "XMLHttpRequest"})
        self.assertEqual(response.status_code, 404)

    def test_mock_login_and_logout_without_google_credentials(self):
        headers = {"X-Requested-With": "XMLHttpRequest"}
        with patch.dict(app.config, {"AUTH_MODE": "mock", "SECRET_KEY": None}):
            self.assertEqual(self.client.post("/api/auth/mock").status_code, 403)
            self.assertEqual(self.client.get("/api/auth/google").status_code, 404)
            self.assertEqual(self.client.get("/api/auth/google/callback").status_code, 404)
            response = self.client.post("/api/auth/mock", headers=headers)
            self.assertEqual(response.status_code, 200)
            self.assertIn("HttpOnly", response.headers["Set-Cookie"])
            self.assertEqual(self.client.get("/api/auth/me").get_json()["user"]["email"], "demo@example.invalid")
            self.assertEqual(self.client.post("/api/auth/logout", headers=headers).status_code, 200)
            self.assertEqual(self.client.get("/api/auth/me").status_code, 401)

    def test_session_cookie_uses_deployment_cookie_settings(self):
        headers = {"X-Requested-With": "XMLHttpRequest"}
        with patch.dict(app.config, {
            "AUTH_MODE": "mock",
            "SESSION_COOKIE_SECURE": True,
            "SESSION_COOKIE_SAMESITE": "None",
        }):
            login = self.client.post("/api/auth/mock", headers=headers)
            logout = self.client.post("/api/auth/logout", headers=headers)
        self.assertIn("Secure", login.headers["Set-Cookie"])
        self.assertIn("SameSite=None", login.headers["Set-Cookie"])
        self.assertIn("SameSite=None", logout.headers["Set-Cookie"])

    def test_google_mode_rejects_real_mock_session(self):
        with patch.dict(app.config, {"AUTH_MODE": "mock"}):
            self.client.post("/api/auth/mock", headers={"X-Requested-With": "XMLHttpRequest"})
            self.assertEqual(self.client.get("/api/auth/me").status_code, 200)
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)

    def test_expired_session_is_rejected(self):
        token = "expired-token"
        with Session(self.engine) as db, db.begin():
            user_id = User.upsert(db, {"sub": "google-id", "email": "test@example.com"})
            db.add(UserSession(token_hash=hashlib.sha256(token.encode()).hexdigest(), user_id=user_id,
                               expires_at=datetime.now(timezone.utc) - timedelta(days=1)))
        self.client.set_cookie("auth_session", token)
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)

    def test_user_creation_rolls_back_if_session_creation_fails(self):
        with patch.dict(app.config, {"AUTH_MODE": "mock"}), \
                patch.object(Session, "add", side_effect=SQLAlchemyError("unavailable")):
            response = self.client.post("/api/auth/mock", headers={"X-Requested-With": "XMLHttpRequest"})
        self.assertEqual(response.status_code, 503)
        self.assertIsNone(self.client.get_cookie("auth_session"))
        with Session(self.engine) as db:
            self.assertIsNone(db.scalar(select(User)))

    def test_auth_mode_flag_sets_mock_mode(self):
        code = (
            "import runpy, sys; from unittest.mock import patch; "
            "sys.argv = ['app.py', '--auth-mode', 'mock']; "
            "p = patch('flask.Flask.run'); p.start(); "
            "namespace = runpy.run_path('app.py', run_name='__main__'); "
            "assert namespace['app'].config['AUTH_MODE'] == 'mock'"
        )
        result = subprocess.run(
            [sys.executable, "-c", code], cwd=Path(__file__).resolve().parent.parent,
            capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_env_is_loaded_before_database_and_oauth_configuration(self):
        code = '''
import os
from pathlib import Path
from unittest.mock import patch
from dotenv import load_dotenv

def load_test_env(path):
    assert Path(path).name == ".env"
    return load_dotenv(os.environ["TEST_ENV_FILE"])

with patch("dotenv.load_dotenv", side_effect=load_test_env):
    import app
    import database
    from api.auth import oauth
    assert app.app.secret_key == "environment-key"
    assert database.engine.url.username == "env_user"
    assert oauth.google.client_id == "env-client"
'''
        with tempfile.TemporaryDirectory() as directory:
            env_file = Path(directory) / ".env"
            env_file.write_text(
                "SECRET_KEY=file-key\n"
                "DATABASE_URL=postgresql://env_user:password@localhost:5432/test\n"
                "GOOGLE_CLIENT_ID=env-client\n"
            )
            env = os.environ.copy()
            env.update(TEST_ENV_FILE=str(env_file), SECRET_KEY="environment-key")
            env.pop("DATABASE_URL", None)
            env.pop("GOOGLE_CLIENT_ID", None)
            result = subprocess.run(
                [sys.executable, "-c", code], cwd=Path(__file__).resolve().parent.parent,
                env=env, capture_output=True, text=True,
            )
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_cloud_run_socket_database_url(self):
        url = make_database_url({
            "INSTANCE_UNIX_SOCKET": "/cloudsql/project:region:instance",
            "DB_USER": "postgres",
            "DB_PASSWORD": "unsafe/password",
            "DB_NAME": "postgres",
        })
        self.assertEqual(url.drivername, "postgresql+psycopg")
        self.assertEqual(url.username, "postgres")
        self.assertEqual(url.password, "unsafe/password")
        self.assertEqual(url.database, "postgres")
        self.assertEqual(url.query["host"], "/cloudsql/project:region:instance")

    def test_allows_only_configured_frontend_origin(self):
        origin = "https://app.example.com"
        with patch.dict(os.environ, {"FRONTEND_ORIGIN": origin}):
            response = self.client.options("/api/auth/logout", headers={"Origin": origin})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["Access-Control-Allow-Origin"], origin)
        self.assertEqual(response.headers["Access-Control-Allow-Credentials"], "true")
        self.assertIn("Origin", response.headers["Vary"])

        response = self.client.options("/api/auth/logout", headers={"Origin": "https://other.example"})
        self.assertNotIn("Access-Control-Allow-Origin", response.headers)

    def test_auth_config_reports_mode_and_roles(self):
        self.assertEqual(self.client.get("/api/auth/config").get_json(), {
            "mode": "google", "roles": ["user", "creator", "partner"],
        })
        with patch.dict(app.config, {"AUTH_MODE": "mock"}):
            self.assertEqual(self.client.get("/api/auth/config").get_json()["mode"], "mock")

    def test_guest_has_no_user(self):
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)

    def test_mock_login_for_each_role(self):
        headers = {"X-Requested-With": "XMLHttpRequest"}
        with patch.dict(app.config, {"AUTH_MODE": "mock"}):
            self.assertEqual(self.client.post("/api/auth/mock", headers=headers).status_code, 200)
            self.assertEqual(self.client.get("/api/auth/me").get_json()["user"]["role"], "user")
            for role in ("creator", "partner", "user"):
                response = self.client.post("/api/auth/mock", headers=headers, json={"role": role})
                self.assertEqual(response.status_code, 200)
                self.assertEqual(self.client.get("/api/auth/me").get_json()["user"]["role"], role)
            response = self.client.post("/api/auth/mock", headers=headers, json={"role": "admin"})
            self.assertEqual(response.status_code, 400)
        with Session(self.engine) as db:
            self.assertEqual(len(db.scalars(select(User)).all()), 3)

    def test_shop_purchase_deducts_coins_and_rejects_insufficient_balance(self):
        headers = {"X-Requested-With": "XMLHttpRequest"}
        with patch.dict(app.config, {"AUTH_MODE": "mock"}):
            self.client.post("/api/auth/mock", headers=headers)
            purchase = self.client.post(
                "/api/auth/shop-purchase",
                headers=headers,
                json={"item_id": "hat-4"},
            )
            self.assertEqual(purchase.status_code, 200)
            self.assertEqual(purchase.get_json(), {"shark_coins": 2500, "cost": 500})
            self.assertEqual(
                self.client.get("/api/auth/me").get_json()["user"]["shark_coins"],
                2500,
            )

            user_id = self.client.get("/api/auth/me").get_json()["user"]["id"]
            with Session(self.engine) as db, db.begin():
                db.get(User, user_id).shark_coins = 200

            insufficient = self.client.post(
                "/api/auth/shop-purchase",
                headers=headers,
                json={"item_id": "hat-4"},
            )
            self.assertEqual(insufficient.status_code, 409)
            self.assertEqual(
                self.client.get("/api/auth/me").get_json()["user"]["shark_coins"],
                200,
            )

    def test_shop_purchase_requires_ajax_header_and_known_item(self):
        headers = {"X-Requested-With": "XMLHttpRequest"}
        self.assertEqual(
            self.client.post("/api/auth/shop-purchase", json={"item_id": "hat-4"}).status_code,
            403,
        )
        with patch.dict(app.config, {"AUTH_MODE": "mock"}):
            self.client.post("/api/auth/mock", headers=headers)
            invalid_item = self.client.post(
                "/api/auth/shop-purchase",
                headers=headers,
                json={"item_id": "hat-5"},
            )
        self.assertEqual(invalid_item.status_code, 400)

    def test_shop_purchase_deducts_other_item_price(self):
        headers = {"X-Requested-With": "XMLHttpRequest"}
        with patch.dict(app.config, {"AUTH_MODE": "mock"}):
            self.client.post("/api/auth/mock", headers=headers)
            user_id = self.client.get("/api/auth/me").get_json()["user"]["id"]
            with Session(self.engine) as db, db.begin():
                db.get(User, user_id).shark_coins = 10000

            purchase = self.client.post(
                "/api/auth/shop-purchase",
                headers=headers,
                json={"item_id": "advice-discount"},
            )

        self.assertEqual(purchase.status_code, 200)
        self.assertEqual(purchase.get_json(), {"shark_coins": 2500, "cost": 7500})

    def test_google_mode_rejects_every_mock_role_session(self):
        headers = {"X-Requested-With": "XMLHttpRequest"}
        with patch.dict(app.config, {"AUTH_MODE": "mock"}):
            self.client.post("/api/auth/mock", headers=headers, json={"role": "partner"})
            self.assertEqual(self.client.get("/api/auth/me").status_code, 200)
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)

    def test_google_login_creates_regular_user_and_keeps_assigned_role(self):
        info = {"sub": "google-id", "email": "test@example.com", "email_verified": True, "name": "Test"}
        with patch.object(oauth.google, "authorize_access_token", return_value={"userinfo": info}):
            self.assertEqual(self.client.get("/api/auth/google/callback").status_code, 302)
            self.assertEqual(self.client.get("/api/auth/me").get_json()["user"]["role"], "user")
            with Session(self.engine) as db, db.begin():
                db.scalar(select(User)).role = "creator"
            self.assertEqual(self.client.get("/api/auth/google/callback").status_code, 302)
        self.assertEqual(self.client.get("/api/auth/me").get_json()["user"]["role"], "creator")

    def test_init_db_adds_role_to_existing_users(self):
        Base.metadata.drop_all(self.engine)
        with self.engine.begin() as connection:
            connection.execute(text(
                "CREATE TABLE users (id INTEGER PRIMARY KEY, google_sub TEXT NOT NULL UNIQUE, "
                "email TEXT, name TEXT, picture TEXT, preferred_language VARCHAR(2) NOT NULL DEFAULT 'pl', "
                "shark_coins INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMP, updated_at TIMESTAMP)"
            ))
            connection.execute(text("INSERT INTO users (google_sub, email) VALUES ('google-id', 'a@example.com')"))
        result = app.test_cli_runner().invoke(args=["init-db"])
        self.assertEqual(result.exit_code, 0, result.output)
        with Session(self.engine) as db:
            self.assertEqual(db.scalar(select(User)).role, "user")


if __name__ == "__main__":
    unittest.main()

import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone

from authlib.integrations.base_client import OAuthError
from authlib.integrations.flask_client import OAuth
from flask import Blueprint, current_app, jsonify, redirect, request, session
from flask.views import MethodView
from joserfc.errors import JoseError
from requests import RequestException
from sqlalchemy import delete, func, select
from sqlalchemy.exc import SQLAlchemyError

from database import database
from database.models import User, UserSession


auth = Blueprint("auth", __name__)
oauth = OAuth()
oauth.register(
    name="google",
    client_id=os.environ.get("GOOGLE_CLIENT_ID"),
    client_secret=os.environ.get("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile", "code_challenge_method": "S256"},
)

MOCK_SUB = "mock:demo"


class LoginSession:
    @staticmethod
    def create(userinfo, response, clear_oauth_session=False):
        session_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(session_token.encode()).hexdigest()
        try:
            with database() as db, db.begin():
                user_id = User.upsert(db, userinfo)
                db.add(UserSession(
                    token_hash=token_hash, user_id=user_id,
                    expires_at=datetime.now(timezone.utc) + timedelta(days=7),
                ))
        except SQLAlchemyError:
            current_app.logger.exception("Could not create user session")
            return jsonify(error="Database unavailable"), 503

        if clear_oauth_session:
            session.clear()
        response.set_cookie(
            "auth_session", session_token, max_age=timedelta(days=7), httponly=True,
            secure=current_app.config["SESSION_COOKIE_SECURE"],
            samesite=current_app.config["SESSION_COOKIE_SAMESITE"],
        )
        return response


class GoogleLogin(MethodView):
    def get(self):
        if current_app.config["AUTH_MODE"] != "google":
            return jsonify(error="Google login is disabled"), 404
        if not current_app.secret_key or not oauth.google.client_id or not oauth.google.client_secret:
            return jsonify(error="Google login is not configured"), 503
        callback = os.environ.get(
            "GOOGLE_REDIRECT_URI", "http://localhost:5000/api/auth/google/callback"
        )
        return oauth.google.authorize_redirect(callback)


class GoogleCallback(MethodView):
    def get(self):
        if current_app.config["AUTH_MODE"] != "google":
            return jsonify(error="Google login is disabled"), 404
        if not current_app.secret_key:
            return jsonify(error="Google login is not configured"), 503
        try:
            token = oauth.google.authorize_access_token()
            userinfo = token.get("userinfo")
            if (
                not userinfo or not userinfo.get("sub") or not userinfo.get("email")
                or userinfo.get("email_verified") is not True
            ):
                return jsonify(error="Google identity could not be verified"), 400
        except (OAuthError, JoseError, RequestException, ValueError):
            current_app.logger.warning("Google authentication failed", exc_info=True)
            return jsonify(error="Google authentication failed"), 400

        response = redirect(os.environ.get("FRONTEND_URL", "/api/auth/me"))
        return LoginSession.create(userinfo, response, clear_oauth_session=True)


class MockLogin(MethodView):
    def post(self):
        if current_app.config["AUTH_MODE"] != "mock":
            return jsonify(error="Mock login is disabled"), 404
        if request.headers.get("X-Requested-With") != "XMLHttpRequest":
            return jsonify(error="Missing X-Requested-With header"), 403
        userinfo = {"sub": MOCK_SUB, "email": "demo@example.invalid", "name": "Demo"}
        return LoginSession.create(userinfo, jsonify(status="ok"))


def get_authenticated_user(db):
    token = request.cookies.get("auth_session")
    if not token:
        return None
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    statement = (
        select(User).join(UserSession, UserSession.user_id == User.id)
        .where(
            UserSession.token_hash == token_hash,
            UserSession.expires_at > func.now(),
        )
    )
    if current_app.config.get("AUTH_MODE") != "mock":
        statement = statement.where(User.google_sub != MOCK_SUB)
    return db.execute(statement).scalar_one_or_none()


class CurrentUser(MethodView):
    def get(self):
        token = request.cookies.get("auth_session")
        if not token:
            return jsonify(error="Not authenticated"), 401
        try:
            with database() as db:
                user = get_authenticated_user(db)
                if not user:
                    return jsonify(error="Not authenticated"), 401
                return jsonify(user=user.to_dict())
        except SQLAlchemyError:
            current_app.logger.exception("Could not load user")
            return jsonify(error="Database unavailable"), 503


class Logout(MethodView):
    def post(self):
        # A cross-origin browser request cannot set this header without CORS permission.
        if request.headers.get("X-Requested-With") != "XMLHttpRequest":
            return jsonify(error="Missing X-Requested-With header"), 403
        token = request.cookies.get("auth_session")
        if token:
            try:
                with database() as db, db.begin():
                    db.execute(delete(UserSession).where(
                        UserSession.token_hash == hashlib.sha256(token.encode()).hexdigest()
                    ))
            except SQLAlchemyError:
                current_app.logger.exception("Could not revoke user session")
                return jsonify(error="Database unavailable"), 503
        response = jsonify(status="ok")
        response.delete_cookie(
            "auth_session",
            httponly=True,
            secure=current_app.config["SESSION_COOKIE_SECURE"],
            samesite=current_app.config["SESSION_COOKIE_SAMESITE"],
        )
        return response


auth.add_url_rule("/api/auth/google", view_func=GoogleLogin.as_view("google_login"))
auth.add_url_rule("/api/auth/google/callback", view_func=GoogleCallback.as_view("google_callback"))
auth.add_url_rule("/api/auth/mock", view_func=MockLogin.as_view("mock_login"))
auth.add_url_rule("/api/auth/me", view_func=CurrentUser.as_view("current_user"))
auth.add_url_rule("/api/auth/logout", view_func=Logout.as_view("logout"))

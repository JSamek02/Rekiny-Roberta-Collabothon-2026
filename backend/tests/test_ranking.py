import hashlib
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app import app
from database.models import Base, User, UserSession


class RankingApiTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://", poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        engine_patch = patch("database.engine", self.engine)
        engine_patch.start()
        self.addCleanup(engine_patch.stop)
        self.addCleanup(self.engine.dispose)
        self.client = app.test_client()

        users = [
            ("google:anna", "Anna", "https://example.com/anna.png", 120),
            ("google:bartek", "Bartek", None, 300),
            ("google:celina", "Celina", None, 120),
            ("google:darek", None, None, 0),
            ("mock:demo", "Demo", None, 999),
        ]
        with Session(self.engine) as db, db.begin():
            for sub, name, picture, xp in users:
                db.add(User(
                    google_sub=sub, name=name, picture=picture,
                    email=f"{sub}@example.com", experience_points=xp,
                ))
        with Session(self.engine) as db:
            self.ids = {u.google_sub: u.id for u in db.query(User).all()}

    def login(self, sub):
        token = f"token-{sub}"
        with Session(self.engine) as db, db.begin():
            db.add(UserSession(
                token_hash=hashlib.sha256(token.encode()).hexdigest(), user_id=self.ids[sub],
                expires_at=datetime.now(timezone.utc) + timedelta(days=1),
            ))
        self.client.set_cookie("auth_session", token)

    def test_ranking_is_sorted_by_experience_with_shared_places(self):
        data = self.client.get("/api/ranking").get_json()
        self.assertEqual(
            [(e["rank"], e["name"], e["experience_points"]) for e in data["ranking"]],
            [(1, "Bartek", 300), (2, "Anna", 120), (2, "Celina", 120), (4, None, 0)],
        )
        self.assertEqual(data["total_users"], 4)
        self.assertIsNone(data["current_user"])

    def test_ranking_exposes_only_public_fields(self):
        entry = self.client.get("/api/ranking").get_json()["ranking"][1]
        self.assertEqual(entry, {
            "rank": 2, "user_id": self.ids["google:anna"], "name": "Anna",
            "picture": "https://example.com/anna.png", "experience_points": 120,
        })

    def test_demo_accounts_are_hidden_outside_mock_mode(self):
        names = [e["name"] for e in self.client.get("/api/ranking").get_json()["ranking"]]
        self.assertNotIn("Demo", names)
        with patch.dict(app.config, {"AUTH_MODE": "mock"}):
            first = self.client.get("/api/ranking").get_json()["ranking"][0]
        self.assertEqual((first["rank"], first["name"]), (1, "Demo"))

    def test_limit_and_current_user_position(self):
        self.login("google:darek")
        data = self.client.get("/api/ranking?limit=2").get_json()
        self.assertEqual(len(data["ranking"]), 2)
        self.assertEqual(data["current_user"]["user_id"], self.ids["google:darek"])
        self.assertEqual(data["current_user"]["rank"], 4)

    def test_invalid_limit_falls_back_to_bounds(self):
        self.assertEqual(len(self.client.get("/api/ranking?limit=abc").get_json()["ranking"]), 4)
        self.assertEqual(len(self.client.get("/api/ranking?limit=0").get_json()["ranking"]), 1)

    def test_database_unavailable(self):
        with patch("api.ranking.database", side_effect=SQLAlchemyError("unavailable")):
            response = self.client.get("/api/ranking")
        self.assertEqual(response.status_code, 503)


if __name__ == "__main__":
    unittest.main()

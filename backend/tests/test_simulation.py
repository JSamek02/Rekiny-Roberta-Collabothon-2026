"""
backend/tests/test_simulation.py
Testy jednostkowe silnika symulacji rynkowej, endpointów REST API,
obsługi trybu gościa (local storage) oraz trwałego zapisu w bazie danych dla zalogowanych użytkowników.
"""

import hashlib
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app import app
from database.models import Base, User, UserSession, UserSimulationProgress
from services.simulation_data import SIMULATION_EVENTS, get_event_by_id
from services.simulation_engine import (
    advance_quarter,
    initialize_event_session,
    normalize_allocations,
    set_initial_investment,
)


class SimulationEngineTest(unittest.TestCase):
    def test_normalize_allocations_default_to_cash(self):
        alloc = normalize_allocations({})
        self.assertEqual(alloc["cash"], 1.0)
        self.assertEqual(alloc["stocks"], 0.0)

    def test_normalize_allocations_scales_to_one(self):
        alloc = normalize_allocations({"stocks": 60, "bonds": 40})
        self.assertAlmostEqual(alloc["stocks"], 0.6, places=2)
        self.assertAlmostEqual(alloc["bonds"], 0.4, places=2)
        self.assertEqual(alloc["cash"], 0.0)

    def test_initial_session_has_pure_cash(self):
        session = initialize_event_session("covid_2020", initial_capital=10000.0)
        self.assertEqual(session["status"], "awaiting_initial_investment")
        self.assertEqual(session["current_capital"], 10000.0)
        self.assertEqual(session["allocations"]["cash"], 1.0)
        self.assertEqual(session["allocations"]["stocks"], 0.0)
        self.assertEqual(session["current_quarter_index"], 0)

    def test_set_initial_investment(self):
        session = initialize_event_session("covid_2020", initial_capital=10000.0)
        session = set_initial_investment(session, {"stocks": 0.7, "bonds": 0.3})
        self.assertEqual(session["status"], "in_progress")
        self.assertEqual(session["allocations"]["stocks"], 0.7)
        self.assertEqual(session["allocations"]["bonds"], 0.3)

    def test_advance_quarter_covid_calculation(self):
        session = initialize_event_session("covid_2020", initial_capital=10000.0)
        set_initial_investment(session, {"stocks": 1.0})

        res = advance_quarter(session)
        q_data = res["quarter_data"]
        self.assertEqual(q_data["quarter"], "2020-Q1")
        self.assertEqual(q_data["quarter_return_pct"], -19.6)
        self.assertAlmostEqual(session["current_capital"], 8040.0, places=1)
        self.assertEqual(session["max_drawdown_pct"], -19.6)

        res2 = advance_quarter(session, new_allocations={"stocks": 0.5, "bonds": 0.5})
        self.assertEqual(session["rebalances_count"], 1)
        self.assertEqual(session["current_quarter_index"], 2)


class SimulationApiTest(unittest.TestCase):
    def setUp(self):
        # Konfiguracja bazy SQLite w pamięci na potrzeby testów integracyjnych
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

        # Użytkownik testowy
        with Session(self.engine) as db:
            self.user = User(
                google_sub="test:sim_investor",
                email="rekin@collabothon.pl",
                name="Robert Biznesu",
                shark_coins=100,
            )
            db.add(self.user)
            db.commit()
            db.refresh(self.user)
            self.user_id = self.user.id

            self.raw_token = "valid-simulation-test-token"
            token_hash = hashlib.sha256(self.raw_token.encode()).hexdigest()
            session = UserSession(
                token_hash=token_hash,
                user_id=self.user_id,
                expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            )
            db.add(session)
            db.commit()

    def _login(self):
        self.client.set_cookie("auth_session", self.raw_token)

    def test_get_events_list_unauthenticated(self):
        res = self.client.get("/api/simulation/events")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("events", data)
        self.assertEqual(len(data["events"]), 3)
        self.assertEqual(data["events"][0]["id"], "gfc_2008")
        self.assertEqual(data["events"][1]["id"], "covid_2020")
        self.assertEqual(data["events"][2]["id"], "inflation_2022")
        self.assertIsNone(data["events"][0]["user_progress"])

    def test_guest_lifecycle_not_persisted(self):
        # Gość z nagłówkiem sesji symulacji (local storage)
        session_header = {"X-Simulation-Session-Id": "guest_local_storage_123"}

        # 1. Start eventu COVID-19 z kapitałem 10 000 zł
        start_res = self.client.post(
            "/api/simulation/events/covid_2020/start",
            headers=session_header,
            json={"initial_capital": 10000.0},
        )
        self.assertEqual(start_res.status_code, 200)
        start_data = start_res.get_json()
        self.assertFalse(start_data["persisted"])
        self.assertEqual(start_data["session"]["status"], "awaiting_initial_investment")

        # 2. Inwestycja
        inv_res = self.client.post(
            "/api/simulation/events/covid_2020/invest",
            headers=session_header,
            json={"allocations": {"stocks": 0.6, "bonds": 0.4}},
        )
        self.assertEqual(inv_res.status_code, 200)
        self.assertFalse(inv_res.get_json()["persisted"])

        # 3. Krok kwartalny
        step_res = self.client.post(
            "/api/simulation/events/covid_2020/step-quarter",
            headers=session_header,
            json={},
        )
        self.assertEqual(step_res.status_code, 200)
        self.assertFalse(step_res.get_json()["persisted"])

    def test_authenticated_user_lifecycle_persisted_to_database(self):
        self._login()

        # 1. Start eventu COVID-19 jako zalogowany użytkownik
        start_res = self.client.post(
            "/api/simulation/events/covid_2020/start",
            json={"initial_capital": 10000.0},
        )
        self.assertEqual(start_res.status_code, 200)
        self.assertTrue(start_res.get_json()["persisted"])

        # Weryfikacja bezpośrednio w bazie danych
        with Session(self.engine) as db:
            record = db.scalar(
                select(UserSimulationProgress).where(
                    UserSimulationProgress.user_id == self.user_id,
                    UserSimulationProgress.event_id == "covid_2020",
                )
            )
            self.assertIsNotNone(record)
            self.assertEqual(record.status, "awaiting_initial_investment")
            self.assertEqual(record.current_capital, 10000.0)

        # 2. Gracz wybiera pierwszą alokację (np. 70% akcje, 30% obligacje)
        inv_res = self.client.post(
            "/api/simulation/events/covid_2020/invest",
            json={"allocations": {"stocks": 0.7, "bonds": 0.3}},
        )
        self.assertEqual(inv_res.status_code, 200)
        self.assertTrue(inv_res.get_json()["persisted"])

        with Session(self.engine) as db:
            record = db.scalar(
                select(UserSimulationProgress).where(
                    UserSimulationProgress.user_id == self.user_id,
                    UserSimulationProgress.event_id == "covid_2020",
                )
            )
            self.assertEqual(record.status, "in_progress")
            self.assertEqual(record.allocations["stocks"], 0.7)

        # 3. Przejście przez wszystkie kwartały (8 kwartałów pandemii)
        for _ in range(8):
            step_res = self.client.post(
                "/api/simulation/events/covid_2020/step-quarter",
                json={},
            )
            self.assertEqual(step_res.status_code, 200)
            self.assertTrue(step_res.get_json()["persisted"])

        final_data = step_res.get_json()
        self.assertTrue(final_data["result"]["is_finished"])

        # Weryfikacja ukończenia w bazie oraz nagrody Shark Coins
        with Session(self.engine) as db:
            record = db.scalar(
                select(UserSimulationProgress).where(
                    UserSimulationProgress.user_id == self.user_id,
                    UserSimulationProgress.event_id == "covid_2020",
                )
            )
            self.assertEqual(record.status, "completed")
            self.assertIsNotNone(record.completed_at)
            self.assertIsNotNone(record.debrief)
            self.assertGreater(record.coins_earned, 0)

            user = db.scalar(select(User).where(User.id == self.user_id))
            # Początkowo miał 100, otrzymał dodatkowe monety z eventu
            self.assertGreater(user.shark_coins, 100)

        # 4. Sprawdzenie, czy lista eventów pokazuje status ukończenia
        events_res = self.client.get("/api/simulation/events")
        self.assertEqual(events_res.status_code, 200)
        ev_list = events_res.get_json()["events"]
        covid_ev = next(e for e in ev_list if e["id"] == "covid_2020")
        self.assertIsNotNone(covid_ev["user_progress"])
        self.assertTrue(covid_ev["user_progress"]["is_completed"])

    def test_sync_from_local_storage_to_database(self):
        self._login()

        # Symulacja danych z Local Storage gracza
        mock_local_session = {
            "event_id": "inflation_2022",
            "status": "in_progress",
            "current_quarter_index": 2,
            "total_quarters": 4,
            "initial_capital": 10000.0,
            "current_capital": 9150.0,
            "peak_capital": 10000.0,
            "max_drawdown_pct": -8.5,
            "cumulative_inflation_factor": 1.053,
            "allocations": {"stocks": 0.5, "bonds": 0.5},
            "rebalances_count": 1,
            "history": [],
            "debrief": None,
        }

        sync_res = self.client.post(
            "/api/simulation/sync",
            json={"sessions": [mock_local_session]},
        )
        self.assertEqual(sync_res.status_code, 200)
        self.assertEqual(sync_res.get_json()["synced_count"], 1)

        # Weryfikacja, że trafiło do bazy danych
        with Session(self.engine) as db:
            record = db.scalar(
                select(UserSimulationProgress).where(
                    UserSimulationProgress.user_id == self.user_id,
                    UserSimulationProgress.event_id == "inflation_2022",
                )
            )
            self.assertIsNotNone(record)
            self.assertEqual(record.status, "in_progress")
            self.assertEqual(record.current_capital, 9150.0)


if __name__ == "__main__":
    unittest.main()

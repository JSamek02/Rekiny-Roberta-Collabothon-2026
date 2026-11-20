"""
backend/tests/test_simulation.py
Testy jednostkowe silnika symulacji rynkowej oraz endpointów REST API.
"""

import unittest
from app import app
from services.simulation_data import SIMULATION_EVENTS, get_event_by_id
from services.simulation_engine import (
    advance_quarter,
    initialize_event_session,
    normalize_allocations,
    set_initial_investment,
)


class SimulationEngineTest(unittest.TestCase):
    def test_normalize_allocations_default_to_cash(self):
        # Gdy gracz nic nie wpisze, 100% zostaje w gotówce
        alloc = normalize_allocations({})
        self.assertEqual(alloc["cash"], 1.0)
        self.assertEqual(alloc["stocks"], 0.0)

    def test_normalize_allocations_scales_to_one(self):
        # Gdy gracz wpisze np. 60 i 40 (lub 6000 i 4000 zł)
        alloc = normalize_allocations({"stocks": 60, "bonds": 40})
        self.assertAlmostEqual(alloc["stocks"], 0.6, places=2)
        self.assertAlmostEqual(alloc["bonds"], 0.4, places=2)
        self.assertEqual(alloc["cash"], 0.0)

    def test_initial_session_has_pure_cash(self):
        session = initialize_event_session("covid_2020", initial_capital=10000.0)
        self.assertEqual(session["status"], "awaiting_initial_investment")
        self.assertEqual(session["current_capital"], 10000.0)
        # Na samym początku gracz ma 100% gotówki i zero inwestycji
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
        # Portfel 100% w akcjach S&P 500
        set_initial_investment(session, {"stocks": 1.0})

        # Krok 1: 2020-Q1 (Wybuch pandemii, S&P 500: -19.6%)
        res = advance_quarter(session)
        q_data = res["quarter_data"]
        self.assertEqual(q_data["quarter"], "2020-Q1")
        self.assertEqual(q_data["quarter_return_pct"], -19.6)
        self.assertAlmostEqual(session["current_capital"], 8040.0, places=1)
        self.assertEqual(session["max_drawdown_pct"], -19.6)

        # Krok 2: Gracz decyduje się dokonać rebalancingu i dodać obligacje
        res2 = advance_quarter(session, new_allocations={"stocks": 0.5, "bonds": 0.5})
        self.assertEqual(session["rebalances_count"], 1)
        self.assertEqual(session["current_quarter_index"], 2)


class SimulationApiTest(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_get_events_list(self):
        res = self.client.get("/api/simulation/events")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("events", data)
        self.assertEqual(len(data["events"]), 3)
        # Weryfikacja chronologii
        self.assertEqual(data["events"][0]["id"], "gfc_2008")
        self.assertEqual(data["events"][1]["id"], "covid_2020")
        self.assertEqual(data["events"][2]["id"], "inflation_2022")
        self.assertIn("data_sources", data)

    def test_full_lifecycle_start_invest_and_step(self):
        session_header = {"X-Simulation-Session-Id": "test_user_collabothon"}

        # 1. Start eventu COVID-19 z kapitałem 10 000 zł
        start_res = self.client.post(
            "/api/simulation/events/covid_2020/start",
            headers=session_header,
            json={"initial_capital": 10000.0},
        )
        self.assertEqual(start_res.status_code, 200)
        start_data = start_res.get_json()
        self.assertEqual(start_data["session"]["status"], "awaiting_initial_investment")
        self.assertEqual(start_data["session"]["allocations"]["cash"], 1.0)

        # 2. Próba przejścia do kwartału bez inwestycji powinna zwrócić błąd 400
        step_err = self.client.post(
            "/api/simulation/events/covid_2020/step-quarter",
            headers=session_header,
            json={},
        )
        self.assertEqual(step_err.status_code, 400)

        # 3. Gracz wybiera inwestycje: 60% Akcje, 30% Obligacje, 10% Złoto
        invest_res = self.client.post(
            "/api/simulation/events/covid_2020/invest",
            headers=session_header,
            json={"allocations": {"stocks": 0.6, "bonds": 0.3, "gold": 0.1, "cash": 0.0}},
        )
        self.assertEqual(invest_res.status_code, 200)
        self.assertEqual(invest_res.get_json()["session"]["status"], "in_progress")

        # 4. Przeskok o 1 kwartał (Q1 2020 - Krach)
        step_res = self.client.post(
            "/api/simulation/events/covid_2020/step-quarter",
            headers=session_header,
            json={},
        )
        self.assertEqual(step_res.status_code, 200)
        step_data = step_res.get_json()
        self.assertEqual(step_data["result"]["quarter_data"]["quarter"], "2020-Q1")
        self.assertFalse(step_data["result"]["is_finished"])

        # 5. Przeskakujemy pozostałe 7 kwartałów do końca eventu
        for _ in range(7):
            final_step = self.client.post(
                "/api/simulation/events/covid_2020/step-quarter",
                headers=session_header,
                json={},
            )

        final_data = final_step.get_json()
        self.assertTrue(final_data["result"]["is_finished"])
        self.assertIn("debrief", final_data["result"])
        debrief = final_data["result"]["debrief"]
        self.assertIn("robert_verdict", debrief)
        self.assertIn("badges_earned", debrief)
        self.assertIn("educational_takeaways", debrief)
        self.assertGreater(debrief["xp_awarded"], 0)


if __name__ == "__main__":
    unittest.main()

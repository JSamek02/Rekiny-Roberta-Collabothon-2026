"""
backend/api/simulation.py
Flask Blueprint obsługujący chronologiczną symulację inwestycyjną z podziałem na kwartały.
Użytkownik rozpoczyna z gotówką, sam wybiera alokację i przeskakuje kwartał po kwartale.
"""

from typing import Any, Dict
from flask import Blueprint, jsonify, request
from flask.views import MethodView

from services.simulation_data import DATA_SOURCES_METADATA, SIMULATION_EVENTS, get_event_by_id
from services.simulation_engine import (
    advance_quarter,
    initialize_event_session,
    set_initial_investment,
)

simulation = Blueprint("simulation", __name__)

# Pamięć sesji symulacji (wielowątkowa / per użytkownik / per token)
_SIM_SESSIONS: Dict[str, Dict[str, Any]] = {}


def _get_session_key(event_id: str) -> str:
    # Obsługa sesji zalogowanego użytkownika lub gościa przez nagłówek / parametr
    session_id = request.headers.get("X-Simulation-Session-Id") or request.args.get("session_id") or "default_user"
    return f"{session_id}_{event_id}"


class SimulationEventsListView(MethodView):
    def get(self):
        """Zwraca listę wszystkich 3 historycznych eventów ułożonych chronologicznie."""
        events_summary = []
        for ev in SIMULATION_EVENTS:
            events_summary.append({
                "id": ev["id"],
                "order_index": ev["order_index"],
                "title": ev["title"],
                "period": ev["period"],
                "total_quarters": ev["total_quarters"],
                "starting_capital": ev["starting_capital"],
                "initial_context": ev["initial_context"],
            })
        return jsonify(
            events=events_summary,
            data_sources=DATA_SOURCES_METADATA,
        )


class SimulationEventDetailView(MethodView):
    def get(self, event_id: str):
        """Zwraca szczegóły danego eventu wraz z kontekstem początkowym."""
        ev = get_event_by_id(event_id)
        if not ev:
            return jsonify(error="Event nie istnieje"), 404

        key = _get_session_key(event_id)
        current_session = _SIM_SESSIONS.get(key)

        return jsonify(
            event={
                "id": ev["id"],
                "order_index": ev["order_index"],
                "title": ev["title"],
                "period": ev["period"],
                "total_quarters": ev["total_quarters"],
                "starting_capital": ev["starting_capital"],
                "initial_context": ev["initial_context"],
                "data_sources": DATA_SOURCES_METADATA,
            },
            active_session=current_session,
        )


class SimulationStartEventView(MethodView):
    def post(self, event_id: str):
        """
        Inicjalizuje event.
        Na początku gracz ma wyłącznie gotówkę (100% cash) i zero inwestycji.
        Może od razu przekazać 'allocations' lub zrobić to w osobnym kroku.
        """
        ev = get_event_by_id(event_id)
        if not ev:
            return jsonify(error="Event nie istnieje"), 404

        payload = request.get_json(silent=True) or {}
        capital = payload.get("initial_capital", ev["starting_capital"])

        key = _get_session_key(event_id)
        session = initialize_event_session(event_id, capital)

        # Jeśli użytkownik od razu przekazał alokację w wywołaniu startowym
        initial_alloc = payload.get("allocations")
        if initial_alloc:
            session = set_initial_investment(session, initial_alloc)

        _SIM_SESSIONS[key] = session

        return jsonify(
            status="ok",
            session=session,
            message="Sesja zainicjalizowana. Na starcie gracz posiada czysty kapitał gotówkowy.",
        )


class SimulationInvestView(MethodView):
    def post(self, event_id: str):
        """Gracz zatwierdza swój wybór inwestycyjny na starcie eventu (rozdysponowanie gotówki)."""
        key = _get_session_key(event_id)
        session = _SIM_SESSIONS.get(key)
        if not session:
            return jsonify(error="Sesja nie została zainicjalizowana. Wywołaj najpierw /start"), 400

        payload = request.get_json(silent=True) or {}
        allocations = payload.get("allocations")
        if not allocations:
            return jsonify(error="Brak pola 'allocations' w zapytaniu"), 400

        try:
            session = set_initial_investment(session, allocations)
            _SIM_SESSIONS[key] = session
            return jsonify(status="ok", session=session)
        except ValueError as err:
            return jsonify(error=str(err)), 400


class SimulationStepQuarterView(MethodView):
    def post(self, event_id: str):
        """
        Przeskakuje o 1 kwartał do przodu:
        - Może przyjąć opcjonalny 'new_allocations' (rebalancing przed nowym kwartałem)
        - Przelicza realne stopy zwrotu
        - Zwraca wynik kwartału, aktualny portfel oraz kontekst historyczny
        """
        key = _get_session_key(event_id)
        session = _SIM_SESSIONS.get(key)
        if not session:
            return jsonify(error="Sesja nie istnieje. Rozpocznij event przez /start"), 400

        if session["status"] == "awaiting_initial_investment":
            return jsonify(
                error="Przed przejściem do I kwartału musisz zatwierdzić pierwszą inwestycję (/invest lub przekazać alokację w /start)."
            ), 400

        if session["status"] == "completed":
            return jsonify(
                status="completed",
                message="Ten event został już zakończony.",
                session=session,
            ), 200

        payload = request.get_json(silent=True) or {}
        new_alloc = payload.get("new_allocations")

        try:
            step_result = advance_quarter(session, new_allocations=new_alloc)
            _SIM_SESSIONS[key] = session
            return jsonify(status="ok", result=step_result, full_session=session)
        except ValueError as err:
            return jsonify(error=str(err)), 400


class SimulationResetView(MethodView):
    def post(self, event_id: str):
        """Resetuje sesję danego eventu do stanu początkowego."""
        key = _get_session_key(event_id)
        if key in _SIM_SESSIONS:
            del _SIM_SESSIONS[key]
        return jsonify(status="ok", message=f"Zresetowano sesję dla eventu {event_id}")


simulation.add_url_rule("/api/simulation/events", view_func=SimulationEventsListView.as_view("sim_events_list"))
simulation.add_url_rule("/api/simulation/events/<event_id>", view_func=SimulationEventDetailView.as_view("sim_event_detail"))
simulation.add_url_rule("/api/simulation/events/<event_id>/start", view_func=SimulationStartEventView.as_view("sim_start"))
simulation.add_url_rule("/api/simulation/events/<event_id>/invest", view_func=SimulationInvestView.as_view("sim_invest"))
simulation.add_url_rule("/api/simulation/events/<event_id>/step-quarter", view_func=SimulationStepQuarterView.as_view("sim_step"))
simulation.add_url_rule("/api/simulation/events/<event_id>/reset", view_func=SimulationResetView.as_view("sim_reset"))

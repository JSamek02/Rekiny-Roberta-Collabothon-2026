"""
backend/api/simulation.py
Flask Blueprint obsługujący chronologiczną symulację inwestycyjną z podziałem na kwartały.
Obsługuje:
- Tryb gościa / local storage (persisted=False)
- Zapis i odczyt postępu w bazie danych PostgreSQL dla zalogowanego użytkownika (persisted=True)
- Synchronizację postępu z local storage po zalogowaniu (/api/simulation/sync)
- Automatyczne nagradzanie Shark Coins i EXP po ukończeniu eventu
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from flask import Blueprint, current_app, jsonify, request
from flask.views import MethodView
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError

from api.auth import get_authenticated_user
from database import database
from database.models import User, UserSimulationProgress
from services.simulation_data import DATA_SOURCES_METADATA, SIMULATION_EVENTS, get_event_by_id
from services.simulation_engine import (
    advance_quarter,
    initialize_event_session,
    set_initial_investment,
)

simulation = Blueprint("simulation", __name__)

# Pamięć podręczna sesji symulacji (dla gości / fallback)
_SIM_SESSIONS: Dict[str, Dict[str, Any]] = {}


def _get_session_key(event_id: str, user_id: Optional[int] = None) -> str:
    if user_id:
        return f"user_{user_id}_{event_id}"
    session_id = request.headers.get("X-Simulation-Session-Id") or request.args.get("session_id") or "default_user"
    return f"{session_id}_{event_id}"


def _load_session_state(db, user, event_id: str) -> Optional[Dict[str, Any]]:
    """Ładuje stan sesji: z bazy danych jeśli użytkownik jest zalogowany, lub z pamięci."""
    if user:
        record = db.scalar(
            select(UserSimulationProgress).where(
                UserSimulationProgress.user_id == user.id,
                UserSimulationProgress.event_id == event_id,
            )
        )
        if record:
            s_dict = record.to_session_dict()
            _SIM_SESSIONS[_get_session_key(event_id, user.id)] = s_dict
            return s_dict

    key = _get_session_key(event_id, user.id if user else None)
    return _SIM_SESSIONS.get(key)


def _persist_session_state(db, user, event_id: str, session_dict: Dict[str, Any]) -> None:
    """Zapisuje stan sesji do bazy danych PostgreSQL jeśli użytkownik jest zalogowany."""
    if not user:
        session_dict["persisted"] = False
        return

    now = datetime.now(timezone.utc)
    record = db.scalar(
        select(UserSimulationProgress).where(
            UserSimulationProgress.user_id == user.id,
            UserSimulationProgress.event_id == event_id,
        )
    )

    is_completed = session_dict["status"] == "completed"
    # Nagroda należy się tylko przy przejściu do stanu "completed", nie przy każdym zapisie
    # ukończonej sesji (np. ponownej synchronizacji z Local Storage).
    newly_completed = is_completed and (record is None or record.status != "completed")
    debrief = session_dict.get("debrief")
    xp_earned = debrief.get("xp_awarded", 0) if debrief else 0
    coins_earned = debrief.get("sharcoins_awarded", 0) if debrief else 0

    if not record:
        record = UserSimulationProgress(
            user_id=user.id,
            event_id=event_id,
            status=session_dict["status"],
            current_quarter_index=session_dict["current_quarter_index"],
            total_quarters=session_dict["total_quarters"],
            initial_capital=session_dict["initial_capital"],
            current_capital=session_dict["current_capital"],
            peak_capital=session_dict["peak_capital"],
            max_drawdown_pct=session_dict["max_drawdown_pct"],
            cumulative_inflation_factor=session_dict["cumulative_inflation_factor"],
            allocations=session_dict["allocations"],
            rebalances_count=session_dict["rebalances_count"],
            history=session_dict["history"],
            debrief=debrief,
            xp_earned=xp_earned,
            coins_earned=coins_earned,
            completed_at=now if is_completed else None,
        )
        db.add(record)
    else:
        record.status = session_dict["status"]
        record.current_quarter_index = session_dict["current_quarter_index"]
        record.total_quarters = session_dict["total_quarters"]
        record.initial_capital = session_dict["initial_capital"]
        record.current_capital = session_dict["current_capital"]
        record.peak_capital = session_dict["peak_capital"]
        record.max_drawdown_pct = session_dict["max_drawdown_pct"]
        record.cumulative_inflation_factor = session_dict["cumulative_inflation_factor"]
        record.allocations = session_dict["allocations"]
        record.rebalances_count = session_dict["rebalances_count"]
        record.history = session_dict["history"]
        record.debrief = debrief
        if is_completed:
            record.xp_earned = xp_earned
            record.coins_earned = coins_earned
            if not record.completed_at:
                record.completed_at = now
        record.updated_at = now

    # Nagradzanie Shark Coins i EXP na koncie użytkownika
    if newly_completed and (coins_earned > 0 or xp_earned > 0):
        db_user = db.scalar(select(User).where(User.id == user.id))
        if db_user:
            db_user.shark_coins = (db_user.shark_coins or 0) + coins_earned
            db_user.experience_points = (db_user.experience_points or 0) + xp_earned

    db.commit()
    session_dict["persisted"] = True


class SimulationEventsListView(MethodView):
    def get(self):
        """Zwraca listę wszystkich 3 historycznych eventów z ewentualnym statusem użytkownika z bazy."""
        try:
            with database() as db:
                user = get_authenticated_user(db)
                user_progress_map = {}
                if user:
                    records = db.scalars(
                        select(UserSimulationProgress).where(UserSimulationProgress.user_id == user.id)
                    ).all()
                    for r in records:
                        user_progress_map[r.event_id] = r

                events_summary = []
                for ev in SIMULATION_EVENTS:
                    ev_data = {
                        "id": ev["id"],
                        "order_index": ev["order_index"],
                        "title": ev["title"],
                        "period": ev["period"],
                        "total_quarters": ev["total_quarters"],
                        "starting_capital": ev["starting_capital"],
                        "initial_context": ev["initial_context"],
                    }
                    if user and ev["id"] in user_progress_map:
                        rec = user_progress_map[ev["id"]]
                        ev_data["user_progress"] = {
                            "status": rec.status,
                            "current_quarter": rec.current_quarter_index,
                            "total_quarters": rec.total_quarters,
                            "is_completed": rec.status == "completed",
                            "final_capital": rec.current_capital if rec.status == "completed" else None,
                            "completed_at": rec.completed_at.isoformat() if rec.completed_at else None,
                        }
                    elif not user:
                        key = _get_session_key(ev["id"], None)
                        sim = _SIM_SESSIONS.get(key)
                        if sim:
                            ev_data["user_progress"] = {
                                "status": sim.get("status", "in_progress"),
                                "current_quarter": sim.get("current_quarter_index", 0),
                                "total_quarters": sim.get("total_quarters", ev["total_quarters"]),
                                "is_completed": sim.get("status") == "completed",
                                "final_capital": sim.get("current_capital") if sim.get("status") == "completed" else None,
                                "completed_at": None,
                            }
                        else:
                            ev_data["user_progress"] = None
                    else:
                        ev_data["user_progress"] = None
                    events_summary.append(ev_data)

                return jsonify(
                    events=events_summary,
                    data_sources=DATA_SOURCES_METADATA,
                )
        except SQLAlchemyError:
            current_app.logger.exception("Could not load simulation events")
            return jsonify(error="Database unavailable"), 503


class SimulationEventDetailView(MethodView):
    def get(self, event_id: str):
        """Zwraca szczegóły danego eventu wraz z aktywną sesją z bazy danych lub pamięci."""
        ev = get_event_by_id(event_id)
        if not ev:
            return jsonify(error="Event nie istnieje"), 404

        try:
            with database() as db:
                user = get_authenticated_user(db)
                session = _load_session_state(db, user, event_id)

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
                    active_session=session,
                    persisted=bool(user and session and session.get("persisted", False)),
                )
        except SQLAlchemyError:
            current_app.logger.exception("Could not load simulation event detail")
            return jsonify(error="Database unavailable"), 503


class SimulationStartEventView(MethodView):
    def post(self, event_id: str):
        """Inicjalizuje event z czystą gotówką (100% Cash) i zapisuje w DB dla zalogowanego."""
        ev = get_event_by_id(event_id)
        if not ev:
            return jsonify(error="Event nie istnieje"), 404

        payload = request.get_json(silent=True) or {}
        capital = payload.get("initial_capital", ev["starting_capital"])
        session = initialize_event_session(event_id, capital)

        initial_alloc = payload.get("allocations")
        if initial_alloc:
            session = set_initial_investment(session, initial_alloc)

        try:
            with database() as db:
                user = get_authenticated_user(db)
                key = _get_session_key(event_id, user.id if user else None)
                _SIM_SESSIONS[key] = session
                _persist_session_state(db, user, event_id, session)

            return jsonify(
                status="ok",
                session=session,
                persisted=bool(user),
                message="Sesja zainicjalizowana. Na starcie gracz posiada czysty kapitał gotówkowy.",
            )
        except SQLAlchemyError:
            current_app.logger.exception("Could not start simulation event")
            return jsonify(error="Database unavailable"), 503


class SimulationInvestView(MethodView):
    def post(self, event_id: str):
        """Gracz zatwierdza swój wybór inwestycyjny na starcie eventu (rozdysponowanie gotówki)."""
        payload = request.get_json(silent=True) or {}
        allocations = payload.get("allocations")
        if not allocations:
            return jsonify(error="Brak pola 'allocations' w zapytaniu"), 400

        try:
            with database() as db:
                user = get_authenticated_user(db)
                session = _load_session_state(db, user, event_id)
                if not session:
                    return jsonify(error="Sesja nie została zainicjalizowana. Wywołaj najpierw /start"), 400

                session = set_initial_investment(session, allocations)
                key = _get_session_key(event_id, user.id if user else None)
                _SIM_SESSIONS[key] = session
                _persist_session_state(db, user, event_id, session)

                return jsonify(status="ok", session=session, persisted=bool(user))
        except ValueError as err:
            return jsonify(error=str(err)), 400
        except SQLAlchemyError:
            current_app.logger.exception("Could not save initial investment")
            return jsonify(error="Database unavailable"), 503


class SimulationStepQuarterView(MethodView):
    def post(self, event_id: str):
        """Przeskakuje o 1 kwartał do przodu i zapisuje stan w bazie danych."""
        try:
            with database() as db:
                user = get_authenticated_user(db)
                session = _load_session_state(db, user, event_id)
                if not session:
                    return jsonify(error="Sesja nie istnieje. Rozpocznij event przez /start"), 400

                if session["status"] == "awaiting_initial_investment":
                    return jsonify(
                        error="Przed przejściem do I kwartału musisz zatwierdzić pierwszą inwestycję (/invest)."
                    ), 400

                if session["status"] == "completed":
                    return jsonify(
                        status="completed",
                        message="Ten event został już zakończony.",
                        session=session,
                        persisted=bool(user),
                    ), 200

                payload = request.get_json(silent=True) or {}
                new_alloc = payload.get("new_allocations")

                step_result = advance_quarter(session, new_allocations=new_alloc)
                key = _get_session_key(event_id, user.id if user else None)
                _SIM_SESSIONS[key] = session
                _persist_session_state(db, user, event_id, session)

                return jsonify(
                    status="ok",
                    result=step_result,
                    full_session=session,
                    persisted=bool(user),
                )
        except ValueError as err:
            return jsonify(error=str(err)), 400
        except SQLAlchemyError:
            current_app.logger.exception("Could not advance simulation quarter")
            return jsonify(error="Database unavailable"), 503


class SimulationSyncView(MethodView):
    def post(self):
        """
        Synchronizuje postęp symulacji z Local Storage do bazy danych po zalogowaniu użytkownika.
        Oczekuje: { "sessions": [ session_dict_1, session_dict_2, ... ] }
        """
        try:
            with database() as db:
                user = get_authenticated_user(db)
                if not user:
                    payload = request.get_json(silent=True) or {}
                    sessions_to_sync = payload.get("sessions", [])
                    synced_count = 0
                    for s in sessions_to_sync:
                        ev_id = s.get("event_id")
                        if not ev_id or not get_event_by_id(ev_id):
                            continue
                        key = _get_session_key(ev_id, None)
                        _SIM_SESSIONS[key] = s
                        synced_count += 1
                    return jsonify(
                        status="ok",
                        synced_count=synced_count,
                        persisted=False,
                    )

                payload = request.get_json(silent=True) or {}
                sessions_to_sync = payload.get("sessions", [])
                synced_count = 0

                for s in sessions_to_sync:
                    ev_id = s.get("event_id")
                    if not ev_id or not get_event_by_id(ev_id):
                        continue
                    _persist_session_state(db, user, ev_id, s)
                    synced_count += 1

                db_user = db.scalar(select(User).where(User.id == user.id))
                user_shark_coins = db_user.shark_coins if db_user else None

                return jsonify(
                    status="ok",
                    synced_count=synced_count,
                    persisted=True,
                    user_shark_coins=user_shark_coins,
                )
        except SQLAlchemyError:
            current_app.logger.exception("Could not sync simulation progress")
            return jsonify(error="Database unavailable"), 503


class SimulationResetView(MethodView):
    def post(self, event_id: str):
        """Resetuje sesję danego eventu zarówno w bazie danych, jak i w pamięci podręcznej."""
        try:
            with database() as db:
                user = get_authenticated_user(db)
                if user:
                    record = db.scalar(
                        select(UserSimulationProgress).where(
                            UserSimulationProgress.user_id == user.id,
                            UserSimulationProgress.event_id == event_id,
                        )
                    )
                    if record:
                        db.delete(record)
                        db.commit()

                key = _get_session_key(event_id, user.id if user else None)
                if key in _SIM_SESSIONS:
                    del _SIM_SESSIONS[key]

                return jsonify(status="ok", message=f"Zresetowano sesję dla eventu {event_id}", persisted=bool(user))
        except SQLAlchemyError:
            current_app.logger.exception("Could not reset simulation session")
            return jsonify(error="Database unavailable"), 503


simulation.add_url_rule("/api/simulation/events", view_func=SimulationEventsListView.as_view("sim_events_list"))
simulation.add_url_rule("/api/simulation/events/<event_id>", view_func=SimulationEventDetailView.as_view("sim_event_detail"))
simulation.add_url_rule("/api/simulation/events/<event_id>/start", view_func=SimulationStartEventView.as_view("sim_start"))
simulation.add_url_rule("/api/simulation/events/<event_id>/invest", view_func=SimulationInvestView.as_view("sim_invest"))
simulation.add_url_rule("/api/simulation/events/<event_id>/step-quarter", view_func=SimulationStepQuarterView.as_view("sim_step"))
simulation.add_url_rule("/api/simulation/sync", view_func=SimulationSyncView.as_view("sim_sync"))
simulation.add_url_rule("/api/simulation/events/<event_id>/reset", view_func=SimulationResetView.as_view("sim_reset"))

"""
backend/services/simulation_engine.py
Silnik obliczeniowy symulatora rynku kwartał po kwartale.
Odpowiada za:
- Weryfikację i normalizację alokacji
- Przeliczanie wartości portfela w kolejnych kwartałach na podstawie realnych danych
- Obliczanie zysku nominalnego, realnego (po inflacji) oraz maksymalnego obsunięcia (Max Drawdown)
- Generowanie spersonalizowanych porad merytorycznych i podsumowań Roberta Biznesu
"""

from typing import Any, Dict, List, Optional
from services.simulation_data import SIMULATION_EVENTS, get_event_by_id

VALID_ASSETS = ("stocks", "bonds", "gold", "cash")


def normalize_allocations(allocations: Dict[str, float]) -> Dict[str, float]:
    """Weryfikuje i normalizuje wagi aktywów tak, aby sumowały się dokładnie do 1.0."""
    cleaned = {k: max(0.0, float(allocations.get(k, 0.0))) for k in VALID_ASSETS}
    total = sum(cleaned.values())
    if total <= 0:
        # Jeśli gracz nie wybrał niczego, 100% zostaje w bezpiecznej gotówce
        return {"stocks": 0.0, "bonds": 0.0, "gold": 0.0, "cash": 1.0}
    return {k: round(v / total, 4) for k, v in cleaned.items()}


def initialize_event_session(event_id: str, initial_capital: Optional[float] = None) -> Dict[str, Any]:
    """Inicjalizuje sesję eventu. Na samym początku gracz ma wyłącznie gotówkę (100% cash) i zero inwestycji."""
    event = get_event_by_id(event_id)
    if not event:
        raise ValueError(f"Nieznany event: {event_id}")

    capital = float(initial_capital if (initial_capital is not None and initial_capital > 0) else event.get("starting_capital", 3000.0))
    initial_allocations = {"stocks": 0.0, "bonds": 0.0, "gold": 0.0, "cash": 1.0}

    return {
        "event_id": event["id"],
        "event_title": event["title"],
        "status": "awaiting_initial_investment",
        "current_quarter_index": 0,
        "total_quarters": event["total_quarters"],
        "initial_capital": capital,
        "current_capital": capital,
        "peak_capital": capital,
        "max_drawdown_pct": 0.0,
        "cumulative_inflation_factor": 1.0,
        "allocations": initial_allocations,
        "rebalances_count": 0,
        "history": [
            {
                "quarter": "Start",
                "portfolio_value": capital,
                "nominal_return_pct": 0.0,
                "real_value": capital,
                "headline": event["initial_context"]["headline"],
                "allocations": initial_allocations,
            }
        ],
    }


def set_initial_investment(session: Dict[str, Any], allocations: Dict[str, float]) -> Dict[str, Any]:
    """Użytkownik decyduje, jak rozdysponować swój początkowy kapitał przed wejściem w I kwartał."""
    if session["status"] != "awaiting_initial_investment":
        raise ValueError("Inwestycja początkowa została już zatwierdzona.")

    norm_alloc = normalize_allocations(allocations)
    session["allocations"] = norm_alloc
    session["status"] = "in_progress"
    session["history"][0]["allocations"] = norm_alloc
    return session


def advance_quarter(
    session: Dict[str, Any],
    new_allocations: Optional[Dict[str, float]] = None,
) -> Dict[str, Any]:
    """
    Wykonuje krok o jeden kwartał do przodu:
    - Opcjonalnie aktualizuje alokację przed rozpoczęciem kwartału (rebalancing)
    - Pobiera rzeczywiste stopy zwrotu z tego kwartału
    - Przelicza wartość portfela, zysk nominalny, realny i obsunięcie
    """
    if session["status"] != "in_progress":
        raise ValueError("Symulacja nie jest w stanie 'in_progress'.")

    event = get_event_by_id(session["event_id"])
    if not event:
        raise ValueError("Event nie istnieje.")

    q_idx = session["current_quarter_index"]
    quarters = event["quarters"]

    if q_idx >= len(quarters):
        session["status"] = "completed"
        return session

    # Rebalancing jeśli gracz zmienił decyzję
    if new_allocations is not None:
        session["allocations"] = normalize_allocations(new_allocations)
        session["rebalances_count"] += 1

    quarter_data = quarters[q_idx]
    returns = quarter_data["returns"]
    cpi = quarter_data["cpi"]

    # Obliczenie ważonej stopy zwrotu za ten kwartał
    quarter_return = sum(session["allocations"][asset] * returns.get(asset, 0.0) for asset in VALID_ASSETS)

    old_capital = session["current_capital"]
    new_capital = round(old_capital * (1.0 + quarter_return), 2)
    session["current_capital"] = new_capital

    # Aktualizacja szczytu i Max Drawdown
    if new_capital > session["peak_capital"]:
        session["peak_capital"] = new_capital
    current_dd = (
        round(((new_capital - session["peak_capital"]) / session["peak_capital"]) * 100, 2)
        if session["peak_capital"] > 0
        else 0.0
    )
    if current_dd < session["max_drawdown_pct"]:
        session["max_drawdown_pct"] = current_dd

    # Inflacja i wartość realna
    session["cumulative_inflation_factor"] *= (1.0 + cpi)
    real_value = round(new_capital / session["cumulative_inflation_factor"], 2)

    total_nominal_return_pct = round(
        ((new_capital - session["initial_capital"]) / session["initial_capital"]) * 100, 2
    )
    total_real_return_pct = round(
        ((real_value - session["initial_capital"]) / session["initial_capital"]) * 100, 2
    )

    history_entry = {
        "quarter": quarter_data["quarter"],
        "portfolio_value": new_capital,
        "real_value": real_value,
        "quarter_return_pct": round(quarter_return * 100, 2),
        "total_nominal_return_pct": total_nominal_return_pct,
        "total_real_return_pct": total_real_return_pct,
        "drawdown_pct": current_dd,
        "headline": quarter_data["headline"],
        "context": quarter_data["context"],
        "lesson": quarter_data["lesson"],
        "benchmark_returns": {k: round(v * 100, 2) for k, v in returns.items()},
        "quarter_cpi_pct": round(cpi * 100, 2),
        "allocations": dict(session["allocations"]),
    }
    session["history"].append(history_entry)

    session["current_quarter_index"] += 1
    is_finished = session["current_quarter_index"] >= len(quarters)

    result_payload = {
        "quarter_data": history_entry,
        "is_finished": is_finished,
        "current_capital": new_capital,
        "allocations": session["allocations"],
        "quarters_completed": session["current_quarter_index"],
        "total_quarters": session["total_quarters"],
    }

    if is_finished:
        session["status"] = "completed"
        summary = generate_event_debrief(session)
        session["debrief"] = summary
        result_payload["debrief"] = summary

    return result_payload


def generate_event_debrief(session: Dict[str, Any]) -> Dict[str, Any]:
    """Generuje merytoryczne podsumowanie całego eventu z poradami inwestycyjnymi."""
    initial = session["initial_capital"]
    final = session["current_capital"]
    real = round(final / session["cumulative_inflation_factor"], 2)
    nom_pct = round(((final - initial) / initial) * 100, 2)
    real_pct = round(((real - initial) / initial) * 100, 2)
    max_dd = session["max_drawdown_pct"]
    event_id = session["event_id"]

    # Generowanie spersonalizowanych wniosków
    takeaways: List[str] = []
    badges: List[str] = []

    if max_dd > -15.0:
        badges.append("Tarcza Bezpieczeństwa")
        takeaways.append(
            f"Znakomita ochrona kapitału! Twój maksymalny spadek wyniósł zaledwie {abs(max_dd)}%. "
            "Dzięki odpowiedniej dywersyfikacji uniknąłeś paniki, która dotyka większość inwestorów."
        )
    else:
        takeaways.append(
            f"Doświadczyłeś głębokiego obsunięcia kapitału ({abs(max_dd)}%). "
            "Na rynkach akcji takie spadki zdarzają się regularnie – kluczem do przetrwania jest horyzont czasowy i poduszka bezpieczeństwa."
        )

    if real_pct > 0:
        badges.append("Pogromca Inflacji")
        takeaways.append(
            f"Pobiłeś inflację! Twój realny zysk wyniósł +{real_pct}%. "
            "Oznacza to, że Twoje pieniądze nie tylko urosły w liczbach, ale realnie możesz za nie kupić więcej dóbr."
        )
    else:
        takeaways.append(
            "Inflacja nadszarpnęła siłę nabywczą portfela. Zwróć uwagę, że trzymanie zbyt dużej ilości gotówki "
            "gwarantuje powolną, lecz nieuchronną stratę realnej wartości."
        )

    if session["rebalances_count"] == 0:
        badges.append("Diamentowe Płetwy")
        takeaways.append(
            "Żelazna dyscyplina: nie dokonałeś ani jednej panicznej zmiany w trakcie kryzysu. "
            "Zgodnie ze statystykami rynkowymi, brak nerwowych ruchów to jedna z najbardziej zyskownych cech inwestora."
        )
    else:
        takeaways.append(
            f"W trakcie cyklu dokonałeś {session['rebalances_count']} zmian w portfelu. "
            "Świadomy rebalancing pozwala dokupować przecenione aktywa, ale pamiętaj, by nie gonić rynku pod wpływem nagłówków prasowych."
        )

    # Robert Biznesu mood
    if nom_pct >= 20:
        mood = "sunglasses_and_suit"
        message = (
            "Kapitalna robota, Szefie! Przetrwałeś ten historyczny sztorm z klasą i wysokim zyskiem. "
            "Pokazałeś, że rozumiesz mechanizmy rynkowe!"
        )
    elif nom_pct >= 0:
        mood = "happy"
        message = (
            "Dobra robota! Zakończyłeś na plusie, mimo że rynki przeżywały potężne turbulencje. "
            "Najważniejsza lekcja: rynki zawsze odrabiają straty, jeśli dasz im czas."
        )
    else:
        mood = "supportive_with_lifejacket"
        message = (
            "Nie przejmuj się chwilowym minusem – na giełdzie straty są realne dopiero wtedy, gdy sprzedasz w dołku! "
            "Wyciągnij wnioski z tego cyklu i zobacz, jak przygotować się na kolejny etap."
        )

    nominal_profit = round(final - initial, 2)
    real_profit = round(real - initial, 2)
    # Zysk z inwestycji dodaje się do SharkCoinów już PO INFLACJI (zysk realny).
    # Np. kapitał początkowy 10 000 zł, wartość realna po inflacji 10 783,67 zł -> zysk 783,67 zł -> 784 SharkCoinów.
    # Jeśli użytkownik stracił realnie (real_profit <= 0), nic się nie dzieje (0 monet).
    profit_coins = max(0, int(round(real_profit))) if real_profit > 0 else 0

    return {
        "initial_capital": initial,
        "final_capital": final,
        "nominal_profit": nominal_profit,
        "real_profit": real_profit,
        "nominal_return_pct": nom_pct,
        "real_capital": real,
        "real_return_pct": real_pct,
        "max_drawdown_pct": max_dd,
        "rebalances_count": session["rebalances_count"],
        "robert_verdict": {
            "mood": mood,
            "message": message,
        },
        "educational_takeaways": takeaways,
        "badges_earned": badges,
        "xp_awarded": 300,
        "sharcoins_awarded": profit_coins,
    }

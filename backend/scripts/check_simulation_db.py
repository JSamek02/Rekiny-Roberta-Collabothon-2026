"""
backend/scripts/check_simulation_db.py
Skrypt sprawdzający zawartość tabeli user_simulation_progress w bazie danych.
Wyświetla zapisane postępy graczy w symulacji, ich portfele, stany kwartałów i przyznane nagrody.

Uruchomienie:
    cd backend
    python scripts/check_simulation_db.py

Test demonstracyjny (gdy Docker/Postgres nie jest jeszcze włączony):
    python scripts/check_simulation_db.py --demo
"""

import argparse
import os
import sys
from pathlib import Path

# Upewniamy się, że katalog 'backend' jest w PYTHONPATH
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
load_dotenv(backend_dir / ".env")

from sqlalchemy import create_engine, inspect, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from database import database
from database.models import Base, User, UserSimulationProgress


def print_records(db, records):
    if not records:
        print("ℹ️ Tabela jest obecnie PUSTA.")
        print("   Oznacza to, że żaden zalogowany użytkownik nie zapisał jeszcze postępu symulacji.")
        print("   (Upewnij się, że gracz był zalogowany podczas klikania w symulatorze).")
        return

    print(f"📊 Znaleziono {len(records)} zapisanych sesji symulacji:\n")

    for idx, r in enumerate(records, start=1):
        user = db.scalar(select(User).where(User.id == r.user_id))
        user_label = f"{user.name} ({user.email})" if user else f"User ID: {r.user_id}"
        user_coins = user.shark_coins if user else 0

        print(f"[{idx}] UŻYTKOWNIK: {user_label} | Aktualne Shark Coins: {user_coins}")
        print(f"    ├─ Event: {r.event_id} ({r.current_quarter_index}/{r.total_quarters} kwartałów)")
        print(f"    ├─ Status: {r.status.upper()}")
        print(f"    ├─ Kapitał: Start={r.initial_capital:,.2f} zł ➔ Aktualny={r.current_capital:,.2f} zł (Szczyt={r.peak_capital:,.2f} zł)")
        print(f"    ├─ Max Drawdown: {r.max_drawdown_pct:.1f}%")
        print(f"    ├─ Liczba rebalancingów: {r.rebalances_count}")
        
        alloc = r.allocations or {}
        alloc_str = ", ".join(f"{k.capitalize()}: {v*100:.1f}%" for k, v in alloc.items())
        print(f"    ├─ Aktualna alokacja: {alloc_str or 'Brak'}")
        
        if r.status == "completed":
            debrief = r.debrief or {}
            badges = debrief.get("badges_earned", [])
            badges_str = ", ".join(badges) if badges else "Brak"
            print(f"    ├─ Ukończono: {r.completed_at}")
            print(f"    ├─ Zdobyte nagrody: +{r.xp_earned} XP, +{r.coins_earned} Shark Coins")
            print(f"    └─ Odznaki: {badges_str}")
        else:
            print(f"    └─ Ostatnia aktualizacja: {r.updated_at}")
        print("-" * 70)


def run_demo():
    print("=" * 70)
    print("🧪 TRYB DEMO: Sprawdzanie zapisu i odczytu bazy w pamięci (SQLite)")
    print("=" * 70)
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)

    with Session(engine) as db:
        user = User(
            google_sub="demo_user",
            name="Robert Biznesu",
            email="rekin@collabothon.pl",
            shark_coins=250,
        )
        db.add(user)
        db.commit()

        progress = UserSimulationProgress(
            user_id=user.id,
            event_id="covid_2020",
            status="completed",
            current_quarter_index=8,
            total_quarters=8,
            initial_capital=10000.0,
            current_capital=13240.50,
            peak_capital=13240.50,
            max_drawdown_pct=-14.2,
            allocations={"stocks": 0.6, "bonds": 0.3, "gold": 0.1, "cash": 0.0},
            rebalances_count=1,
            history=[],
            debrief={
                "badges_earned": ["Tarcza Bezpieczeństwa", "Pogromca Inflacji"],
                "xp_awarded": 300,
                "sharcoins_awarded": 150,
            },
            xp_earned=300,
            coins_earned=150,
        )
        db.add(progress)
        db.commit()

        records = db.scalars(select(UserSimulationProgress)).all()
        print_records(db, records)


def check_simulation_progress():
    print("=" * 70)
    print("🔍 SPRAWDZANIE ZAPISANYCH DANYCH SYMULACJI W BAZIE DANYCH POSTGRESQL")
    print("=" * 70)

    try:
        with database() as db:
            inspector = inspect(db.bind)
            tables = inspector.get_table_names()
            
            if "user_simulation_progress" not in tables:
                print("❌ Tabela 'user_simulation_progress' NIE istnieje w bazie!")
                print("   Uruchom najpierw inicjalizację bazy: flask init-db")
                return

            print("✅ Połączono pomyślnie z bazą danych.")
            print("✅ Tabela 'user_simulation_progress' istnieje w bazie.\n")

            stmt = select(UserSimulationProgress).order_by(UserSimulationProgress.updated_at.desc())
            records = db.scalars(stmt).all()
            print_records(db, records)

    except SQLAlchemyError as err:
        print("\n❌ BŁĄD POŁĄCZENIA Z BAZĄ DANYCH:")
        print(f"   {err}")
        print("\n💡 Podpowiedź:")
        print("   1. Jeśli baza działa przez Docker: uruchom 'docker compose up -d' w folderze backend.")
        print("   2. Jeśli chcesz zobaczyć jak dane wyglądają bez włączonego Dockera, wpisz:")
        print("      python scripts/check_simulation_db.py --demo")
    except Exception as e:
        print(f"\n❌ Wystąpił błąd: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sprawdź zapisane dane symulacji")
    parser.add_argument("--demo", action="store_true", help="Uruchom demonstracyjny test zapisu")
    args = parser.parse_args()

    if args.demo:
        run_demo()
    else:
        check_simulation_progress()

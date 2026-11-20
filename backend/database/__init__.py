import os

import click
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

from database.models import Base


url = make_url(os.environ.get(
    "DATABASE_URL", "postgresql://UZYTKOWNIK:HASLO@127.0.0.1:5433/NAZWA_BAZY"
))
if url.drivername in ("postgres", "postgresql"):
    url = url.set(drivername="postgresql+psycopg")

engine = create_engine(url, pool_pre_ping=True, connect_args={"connect_timeout": 3})


def database():
    return Session(engine)


@click.command("init-db")
def init_db():
    Base.metadata.create_all(engine)
    print("Baza danych jest gotowa.")

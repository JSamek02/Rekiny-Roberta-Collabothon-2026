import os

import click
from sqlalchemy import create_engine
from sqlalchemy.engine import URL, make_url
from sqlalchemy.orm import Session

from database.models import Base


def make_database_url(environment=None):
    environment = environment or os.environ
    database_url = environment.get("DATABASE_URL")
    if database_url:
        return make_url(database_url)

    unix_socket = environment.get("INSTANCE_UNIX_SOCKET")
    if unix_socket:
        return URL.create(
            "postgresql+psycopg",
            username=environment["DB_USER"],
            password=environment["DB_PASSWORD"],
            database=environment["DB_NAME"],
            query={"host": unix_socket},
        )

    return make_url("postgresql://app:app@localhost:5432/app")


url = make_database_url()
if url.drivername in ("postgres", "postgresql"):
    url = url.set(drivername="postgresql+psycopg")

engine = create_engine(url, pool_pre_ping=True, connect_args={"connect_timeout": 3})


def database():
    return Session(engine)


@click.command("init-db")
def init_db():
    Base.metadata.create_all(engine)
    print("Baza danych jest gotowa.")

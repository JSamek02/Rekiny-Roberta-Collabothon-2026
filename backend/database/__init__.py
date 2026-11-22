import os

import click
from sqlalchemy import create_engine, inspect, text
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


def upgrade_user_profile_columns():
    """Add profile fields to databases created before language, coin and role support."""
    with engine.begin() as connection:
        columns = {column["name"] for column in inspect(connection).get_columns("users")}

        if "preferred_language" not in columns:
            connection.execute(text(
                "ALTER TABLE users ADD COLUMN preferred_language VARCHAR(2) NOT NULL DEFAULT 'pl'"
            ))

        if "shark_coins" not in columns:
            connection.execute(text(
                "ALTER TABLE users ADD COLUMN shark_coins INTEGER NOT NULL DEFAULT 3000"
            ))
            connection.execute(text("""
                UPDATE users
                SET shark_coins = COALESCE(
                    (SELECT SUM(coins_earned)
                     FROM user_activity_progress
                     WHERE user_activity_progress.user_id = users.id),
                    0
                )
            """))

        if "role" not in columns:
            # Existing accounts become regular signed-in users.
            connection.execute(text(
                "ALTER TABLE users ADD COLUMN role VARCHAR(16) NOT NULL DEFAULT 'user'"
            ))
            if connection.dialect.name == "postgresql":
                connection.execute(text(
                    "ALTER TABLE users ADD CONSTRAINT ck_users_role "
                    "CHECK (role IN ('user', 'creator', 'partner'))"
                ))

        if "experience_points" not in columns:
            connection.execute(text(
                "ALTER TABLE users ADD COLUMN experience_points INTEGER NOT NULL DEFAULT 0"
            ))
            connection.execute(text("""
                UPDATE users
                SET experience_points = COALESCE(
                    (SELECT SUM(xp_earned)
                     FROM user_activity_progress
                     WHERE user_activity_progress.user_id = users.id),
                    0
                )
            """))


def upgrade_content_translation_columns():
    """Add translation containers for courses, lessons, and activities."""
    column_type = "JSONB" if engine.dialect.name == "postgresql" else "JSON"
    default_value = "'{}'::jsonb" if engine.dialect.name == "postgresql" else "'{}'"

    with engine.begin() as connection:
        for table in ("courses", "lessons", "activities"):
            columns = {column["name"] for column in inspect(connection).get_columns(table)}
            if "translations" not in columns:
                connection.execute(text(
                    f"ALTER TABLE {table} ADD COLUMN translations "
                    f"{column_type} NOT NULL DEFAULT {default_value}"
                ))


def upgrade_activity_type_constraint():
    """Allow the guided frame activity in PostgreSQL databases created earlier."""
    if engine.dialect.name != "postgresql":
        return

    with engine.begin() as connection:
        constraints = inspect(connection).get_check_constraints("activities")
        activity_type_constraint = next(
            (constraint for constraint in constraints
             if constraint.get("name") == "ck_activities_activity_type"),
            None,
        )
        constraint_sql = activity_type_constraint.get("sqltext") if activity_type_constraint else ""
        if "guided_flow" in (constraint_sql or ""):
            return

        connection.execute(text(
            "ALTER TABLE activities DROP CONSTRAINT IF EXISTS ck_activities_activity_type"
        ))
        connection.execute(text(
            "ALTER TABLE activities ADD CONSTRAINT ck_activities_activity_type "
            "CHECK (activity_type IN ('article', 'quiz', 'video', 'guided_flow'))"
        ))


def ensure_model_indexes():
    """Create indexes declared by the ORM for databases created before them."""
    statements = (
        "CREATE INDEX IF NOT EXISTS ix_user_sessions_user_id ON user_sessions(user_id)",
        "CREATE INDEX IF NOT EXISTS ix_courses_slug ON courses(slug)",
        "CREATE INDEX IF NOT EXISTS ix_lessons_course_id ON lessons(course_id)",
        "CREATE INDEX IF NOT EXISTS ix_activities_lesson_id ON activities(lesson_id)",
        "CREATE INDEX IF NOT EXISTS ix_activity_videos_activity_id ON activity_videos(activity_id)",
        "CREATE INDEX IF NOT EXISTS ix_user_course_enrollments_user_id "
        "ON user_course_enrollments(user_id)",
        "CREATE INDEX IF NOT EXISTS ix_user_course_enrollments_course_id "
        "ON user_course_enrollments(course_id)",
        "CREATE INDEX IF NOT EXISTS ix_user_activity_progress_user_id "
        "ON user_activity_progress(user_id)",
        "CREATE INDEX IF NOT EXISTS ix_user_activity_progress_activity_id "
        "ON user_activity_progress(activity_id)",
    )
    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


@click.command("init-db")
def init_db():
    Base.metadata.create_all(engine)
    upgrade_user_profile_columns()
    upgrade_content_translation_columns()
    upgrade_activity_type_constraint()
    ensure_model_indexes()
    print("Baza danych jest gotowa.")

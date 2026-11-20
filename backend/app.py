import os

import psycopg
from flask import Flask, jsonify


app = Flask(__name__)


@app.get("/api/health")
def health():
    return jsonify(status="ok")


@app.get("/api/db-health")
def db_health():
    database_url = os.environ.get(
        "DATABASE_URL", "postgresql://app:app@localhost:5432/app"
    )
    try:
        with psycopg.connect(database_url, connect_timeout=3) as connection:
            connection.execute("SELECT 1")
    except psycopg.Error:
        app.logger.exception("Database health check failed")
        return jsonify(status="error"), 503
    return jsonify(status="ok")

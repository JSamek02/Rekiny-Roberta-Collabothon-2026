from flask import Blueprint, current_app, jsonify
from flask.views import MethodView
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

import database


health = Blueprint("health", __name__)


class HealthCheck(MethodView):
    """GET /api/health — liveness probe with no dependencies.

    Accepts no parameters and always responds ``200 {\"status\": \"ok\"}`` while
    the Flask application is running.
    """

    def get(self):
        return jsonify(status="ok")


class DatabaseHealthCheck(MethodView):
    """GET /api/db-health — verifies the database connection.

    Accepts no parameters. It executes ``SELECT 1`` and returns
    ``200 {\"status\": \"ok\"}`` on success or ``503 {\"status\": \"error\"}``
    when SQLAlchemy cannot connect.
    """

    def get(self):
        try:
            with database.engine.connect() as connection:
                connection.execute(text("SELECT 1"))
        except SQLAlchemyError:
            current_app.logger.exception("Database health check failed")
            return jsonify(status="error"), 503
        return jsonify(status="ok")


health.add_url_rule("/api/health", view_func=HealthCheck.as_view("health_check"))
health.add_url_rule("/api/db-health", view_func=DatabaseHealthCheck.as_view("db_health"))

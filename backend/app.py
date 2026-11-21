import argparse
import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, request

load_dotenv(Path(__file__).with_name(".env"))

from api.auth import auth, oauth
from api.chat import chat
from api.courses import courses
from api.health import health
from api.simulation import simulation
from database import init_db


def positive_integer_from_environment(name, default):
    try:
        value = int(os.environ.get(name, default))
    except ValueError:
        return default
    return value if value > 0 else default


app = Flask(__name__)
app.config.update(
    AUTH_MODE="google",
    SECRET_KEY=os.environ.get("SECRET_KEY"),
    CONTENT_ADMIN_TOKEN=os.environ.get("CONTENT_ADMIN_TOKEN"),
    MAX_VIDEO_UPLOAD_BYTES=positive_integer_from_environment(
        "MAX_VIDEO_UPLOAD_BYTES", 100 * 1024 * 1024
    ),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE=os.environ.get("COOKIE_SAMESITE", "Lax"),
    SESSION_COOKIE_SECURE=os.environ.get("COOKIE_SECURE", "false").lower() == "true",
)

oauth.init_app(app)
app.register_blueprint(health)
app.register_blueprint(auth)
app.register_blueprint(courses)
app.register_blueprint(chat)
app.register_blueprint(simulation)
app.cli.add_command(init_db)


@app.after_request
def allow_frontend_origin(response):
    origin = request.headers.get("Origin")
    if origin and origin == os.environ.get("FRONTEND_ORIGIN"):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Headers"] = (
            "Content-Type, X-Requested-With, X-Content-Admin-Token"
        )
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.vary.add("Origin")
    if request.path.startswith((
        "/api/courses", "/api/lessons", "/api/activities", "/api/user/progress", "/api/auth/*",
    )):
        response.vary.add("Accept-Language")
    return response


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Uruchom backend API")
    parser.add_argument("--auth-mode", choices=("google", "mock"), default="google")
    parser.add_argument("--debug", action="store_true")
    args = parser.parse_args()
    app.config["AUTH_MODE"] = args.auth_mode
    app.run(debug=args.debug)

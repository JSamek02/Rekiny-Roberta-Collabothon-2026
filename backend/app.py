import argparse
import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, request

load_dotenv(Path(__file__).with_name(".env"))

from api.auth import auth, oauth
from api.courses import courses
from api.health import health
from database import init_db


app = Flask(__name__)
app.config.update(
    AUTH_MODE="google",
    SECRET_KEY=os.environ.get("SECRET_KEY"),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE=os.environ.get("COOKIE_SAMESITE", "Lax"),
    SESSION_COOKIE_SECURE=os.environ.get("COOKIE_SECURE", "false").lower() == "true",
)

oauth.init_app(app)
app.register_blueprint(health)
app.register_blueprint(auth)
app.register_blueprint(courses)
app.cli.add_command(init_db)


@app.after_request
def allow_frontend_origin(response):
    origin = request.headers.get("Origin")
    if origin and origin == os.environ.get("FRONTEND_ORIGIN"):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-Requested-With"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.vary.add("Origin")
    return response


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Uruchom backend API")
    parser.add_argument("--auth-mode", choices=("google", "mock"), default="google")
    parser.add_argument("--debug", action="store_true")
    args = parser.parse_args()
    app.config["AUTH_MODE"] = args.auth_mode
    app.run(debug=args.debug)

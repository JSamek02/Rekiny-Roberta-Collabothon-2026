import argparse
import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask

load_dotenv(Path(__file__).with_name(".env"))

from api.auth import auth, oauth
from api.courses import courses
from api.health import health
from api.simulation import simulation
from database import init_db


app = Flask(__name__)
app.config.update(
    AUTH_MODE="google",
    SECRET_KEY=os.environ.get("SECRET_KEY"),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.environ.get("COOKIE_SECURE", "false").lower() == "true",
)

oauth.init_app(app)
app.register_blueprint(health)
app.register_blueprint(auth)
app.register_blueprint(courses)
app.register_blueprint(simulation)
app.cli.add_command(init_db)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Uruchom backend API")
    parser.add_argument("--auth-mode", choices=("google", "mock"), default="google")
    parser.add_argument("--debug", action="store_true")
    args = parser.parse_args()
    app.config["AUTH_MODE"] = args.auth_mode
    app.run(debug=args.debug)

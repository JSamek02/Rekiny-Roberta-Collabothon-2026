from flask import Blueprint, current_app, jsonify, request
from flask.views import MethodView
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError

from api.auth import MOCK_SUB_PREFIX, get_authenticated_user
from database import database
from database.models import User


ranking = Blueprint("ranking", __name__)

DEFAULT_LIMIT = 50
MAX_LIMIT = 100


def parse_limit(value):
    try:
        limit = int(value)
    except (TypeError, ValueError):
        return DEFAULT_LIMIT
    return min(max(limit, 1), MAX_LIMIT)


def ranking_entry(row):
    # Public data only: no e-mail or account details.
    return {
        "rank": int(row.rank),
        "user_id": row.id,
        "name": row.name,
        "picture": row.picture,
        "experience_points": int(row.experience_points),
    }


class RankingView(MethodView):
    """Users sorted by experience points. Public; a signed-in user also gets their own position."""

    def get(self):
        limit = parse_limit(request.args.get("limit"))
        # Equal XP shares a place (1, 2, 2, 4); earlier accounts are listed first within a tie.
        rank = func.rank().over(order_by=User.experience_points.desc()).label("rank")
        ranked = select(
            User.id, User.name, User.picture, User.experience_points, rank,
        )
        if current_app.config.get("AUTH_MODE") != "mock":
            ranked = ranked.where(~User.google_sub.startswith(MOCK_SUB_PREFIX))
        ranked = ranked.subquery()

        try:
            with database() as db:
                rows = db.execute(
                    select(ranked).order_by(ranked.c.rank, ranked.c.id).limit(limit)
                ).all()
                total = db.scalar(select(func.count()).select_from(ranked)) or 0

                current_user = None
                user = get_authenticated_user(db)
                if user:
                    row = db.execute(select(ranked).where(ranked.c.id == user.id)).first()
                    if row:
                        current_user = ranking_entry(row)
        except SQLAlchemyError:
            current_app.logger.exception("Could not load ranking")
            return jsonify(error="Database unavailable"), 503

        return jsonify(
            ranking=[ranking_entry(row) for row in rows],
            total_users=int(total),
            current_user=current_user,
        )


ranking.add_url_rule("/api/ranking", view_func=RankingView.as_view("ranking"))

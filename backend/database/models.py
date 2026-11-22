from datetime import datetime
from typing import Any

from sqlalchemy import (
    BigInteger, Boolean, CheckConstraint, DateTime, Float, ForeignKey, Identity,
    Integer, LargeBinary, String, Text, UniqueConstraint, func
)
from sqlalchemy.dialects.postgresql import JSONB, insert
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

JsonType = JSON().with_variant(JSONB, "postgresql")
SUPPORTED_LANGUAGE_CODES = ("pl", "en", "de")
# Typy zalogowanych kont. Niezalogowany (gość) to brak ważnej sesji, więc nie ma go w bazie.
USER_ROLES = ("user", "creator", "partner")
DEFAULT_USER_ROLE = "user"
DEFAULT_STARTING_SHARK_COINS = 3000


def get_translation(translations: dict[str, Any] | None, language: str) -> dict[str, Any]:
    translation = (translations or {}).get(language, {})
    return translation if isinstance(translation, dict) else {}


def merge_guided_flow_content(content: dict[str, Any], translated_content: dict[str, Any]) -> dict[str, Any]:
    """Overlay localized copy without losing frame coordinates and images."""
    merged = dict(content)
    for key, value in translated_content.items():
        if key not in ("intro", "frames"):
            merged[key] = value

    base_intro = content.get("intro")
    translated_intro = translated_content.get("intro")
    if isinstance(base_intro, dict) and isinstance(translated_intro, dict):
        merged["intro"] = {**base_intro, **translated_intro}
    elif "intro" in translated_content:
        merged["intro"] = translated_intro

    base_frames = content.get("frames")
    translated_frames = translated_content.get("frames")
    if not isinstance(base_frames, list) or not isinstance(translated_frames, list):
        if "frames" in translated_content:
            merged["frames"] = translated_frames
        return merged

    translated_by_id = {
        str(frame["id"]): frame
        for frame in translated_frames
        if isinstance(frame, dict) and frame.get("id") is not None
    }
    merged_frames = []
    for frame in base_frames:
        if not isinstance(frame, dict):
            merged_frames.append(frame)
            continue

        translated_frame = translated_by_id.get(str(frame.get("id")))
        if not translated_frame:
            merged_frames.append(frame)
            continue

        merged_frame = {
            **frame,
            **{
                key: value
                for key, value in translated_frame.items()
                if key not in ("hitbox", "inputs")
            },
        }
        base_hitbox = frame.get("hitbox")
        translated_hitbox = translated_frame.get("hitbox")
        if isinstance(base_hitbox, dict) and isinstance(translated_hitbox, dict):
            merged_frame["hitbox"] = {**base_hitbox, **translated_hitbox}
        elif "hitbox" in translated_frame:
            merged_frame["hitbox"] = translated_hitbox

        base_inputs = frame.get("inputs")
        translated_inputs = translated_frame.get("inputs")
        if isinstance(base_inputs, list) and isinstance(translated_inputs, list):
            translated_inputs_by_id = {
                str(input_field["id"]): input_field
                for input_field in translated_inputs
                if isinstance(input_field, dict) and input_field.get("id") is not None
            }
            merged_frame["inputs"] = [
                {
                    **input_field,
                    **translated_inputs_by_id.get(str(input_field.get("id")), {}),
                }
                if isinstance(input_field, dict) else input_field
                for input_field in base_inputs
            ]
        elif "inputs" in translated_frame:
            merged_frame["inputs"] = translated_inputs

        merged_frames.append(merged_frame)

    merged["frames"] = merged_frames
    return merged


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('user', 'creator', 'partner')", name="ck_users_role"),
    )

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), Identity(), primary_key=True)
    google_sub: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    email: Mapped[str | None] = mapped_column(Text)
    name: Mapped[str | None] = mapped_column(Text)
    picture: Mapped[str | None] = mapped_column(Text)
    preferred_language: Mapped[str] = mapped_column(
        String(2), nullable=False, default="pl", server_default="pl"
    )
    shark_coins: Mapped[int] = mapped_column(
        Integer, nullable=False, default=DEFAULT_STARTING_SHARK_COINS, server_default=str(DEFAULT_STARTING_SHARK_COINS)
    )
    experience_points: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    role: Mapped[str] = mapped_column(
        String(16), nullable=False, default=DEFAULT_USER_ROLE, server_default=DEFAULT_USER_ROLE
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    @classmethod
    def upsert(cls, db, userinfo, role=None):
        """Tworzy lub aktualizuje konto. Rola zmienia się tylko, gdy zostanie jawnie podana
        (konta demonstracyjne); przy logowaniu Google zostaje rola nadana w bazie."""
        values = dict(
            google_sub=userinfo["sub"], email=userinfo.get("email"),
            name=userinfo.get("name"), picture=userinfo.get("picture"),
            shark_coins=userinfo.get("shark_coins", DEFAULT_STARTING_SHARK_COINS),
        )
        if role is not None:
            values["role"] = role
        statement = insert(cls).values(**values)
        update = {
            "email": statement.excluded.email,
            "name": statement.excluded.name,
            "picture": statement.excluded.picture,
            "updated_at": func.now(),
        }
        if role is not None:
            update["role"] = statement.excluded.role
        statement = statement.on_conflict_do_update(
            index_elements=[cls.google_sub], set_=update,
        ).returning(cls.id)
        return db.execute(statement).scalar_one()

    def to_dict(self):
        return {
            "id": self.id, "email": self.email, "name": self.name,
            "picture": self.picture, "preferred_language": self.preferred_language,
            "shark_coins": self.shark_coins, "experience_points": self.experience_points,
            "role": self.role, "created_at": self.created_at,
        }


class UserSession(Base):
    __tablename__ = "user_sessions"

    token_hash: Mapped[str] = mapped_column(Text, primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), Identity(), primary_key=True
    )
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(64), nullable=False, default="general")
    difficulty: Mapped[str] = mapped_column(String(32), nullable=False, default="beginner")
    estimated_minutes: Mapped[int] = mapped_column(Integer, default=15)
    icon_url: Mapped[str | None] = mapped_column(Text)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    translations: Mapped[dict[str, Any]] = mapped_column(JsonType, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    lessons: Mapped[list["Lesson"]] = relationship(
        "Lesson", back_populates="course", cascade="all, delete-orphan", order_by="Lesson.order_index"
    )

    def to_dict(self, include_lessons=False, language="pl"):
        translation = get_translation(self.translations, language)
        data = {
            "id": self.id,
            "slug": self.slug,
            "title": translation.get("title", self.title),
            "description": translation.get("description", self.description),
            "category": self.category,
            "difficulty": self.difficulty,
            "estimated_minutes": self.estimated_minutes,
            "icon_url": self.icon_url,
            "is_published": self.is_published,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_lessons:
            data["lessons"] = [
                lesson.to_dict(language=language) for lesson in self.lessons if lesson.is_published
            ]
        return data


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), Identity(), primary_key=True
    )
    course_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    xp_reward: Mapped[int] = mapped_column(Integer, default=20)
    translations: Mapped[dict[str, Any]] = mapped_column(JsonType, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    course: Mapped["Course"] = relationship("Course", back_populates="lessons")
    activities: Mapped[list["Activity"]] = relationship(
        "Activity", back_populates="lesson", cascade="all, delete-orphan", order_by="Activity.order_index"
    )

    def to_dict(self, include_activities=False, language="pl"):
        translation = get_translation(self.translations, language)
        data = {
            "id": self.id,
            "course_id": self.course_id,
            "title": translation.get("title", self.title),
            "description": translation.get("description", self.description),
            "order_index": self.order_index,
            "xp_reward": self.xp_reward,
            "is_published": self.is_published,
        }
        if include_activities:
            data["activities"] = [
                activity.to_dict(include_content=False, language=language) for activity in self.activities
            ]
        return data


class Activity(Base):
    __tablename__ = "activities"
    __table_args__ = (
        CheckConstraint(
            "activity_type IN ('article', 'quiz', 'video', 'guided_flow')",
            name="ck_activities_activity_type",
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), Identity(), primary_key=True
    )
    lesson_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    activity_type: Mapped[str] = mapped_column(
        String(32), nullable=False
    )  # 'article', 'quiz', 'video', 'guided_flow'
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    xp_reward: Mapped[int] = mapped_column(Integer, default=10)
    coin_reward: Mapped[int] = mapped_column(Integer, default=5)
    estimated_minutes: Mapped[int] = mapped_column(Integer, default=3)
    content: Mapped[dict[str, Any]] = mapped_column(JsonType, nullable=False, default=dict)
    translations: Mapped[dict[str, Any]] = mapped_column(JsonType, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    lesson: Mapped["Lesson"] = relationship("Lesson", back_populates="activities")
    videos: Mapped[list["ActivityVideo"]] = relationship(
        "ActivityVideo", back_populates="activity", cascade="all, delete-orphan"
    )

    def localized_content(self, language="pl"):
        translation = get_translation(self.translations, language)
        translated_content = translation.get("content")
        content = dict(self.content or {})
        if isinstance(translated_content, dict):
            if self.activity_type == "guided_flow":
                content = merge_guided_flow_content(content, translated_content)
            else:
                content.update(translated_content)
        return content

    def to_dict(self, include_content=True, sanitize_quiz=True, language="pl"):
        translation = get_translation(self.translations, language)
        data = {
            "id": self.id,
            "lesson_id": self.lesson_id,
            "title": translation.get("title", self.title),
            "activity_type": self.activity_type,
            "order_index": self.order_index,
            "xp_reward": self.xp_reward,
            "coin_reward": self.coin_reward,
            "estimated_minutes": self.estimated_minutes,
        }
        if include_content:
            content = self.localized_content(language)
            content_copy = dict(content) if content else {}
            if self.activity_type == "quiz" and sanitize_quiz and "questions" in content_copy:
                base_questions = {
                    str(question.get("id")): question
                    for question in (self.content or {}).get("questions", [])
                }
                sanitized_questions = []
                for q in content_copy.get("questions", []):
                    image = q.get("image") or base_questions.get(str(q.get("id")), {}).get("image")
                    sanitized_q = {
                        "id": q.get("id"),
                        "prompt": q.get("prompt"),
                        "options": q.get("options", []),
                    }
                    if isinstance(image, dict) and isinstance(image.get("url"), str):
                        sanitized_q["image"] = {
                            key: image[key]
                            for key in ("url", "alt", "caption")
                            if isinstance(image.get(key), str)
                        }
                    sanitized_questions.append(sanitized_q)
                content_copy["questions"] = sanitized_questions
            data["content"] = content_copy
        return data


class ActivityVideo(Base):
    __tablename__ = "activity_videos"
    __table_args__ = (
        UniqueConstraint("activity_id", "language", name="uq_activity_video_language"),
        CheckConstraint("language IN ('pl', 'en', 'de')", name="ck_activity_videos_language"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), Identity(), primary_key=True
    )
    activity_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("activities.id", ondelete="CASCADE"), nullable=False, index=True
    )
    language: Mapped[str] = mapped_column(String(2), nullable=False, default="pl", server_default="pl")
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(127), nullable=False, default="video/mp4")
    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    # Deferred keeps MP4 bytes out of ordinary activity and course queries.
    data: Mapped[bytes] = mapped_column(LargeBinary, nullable=False, deferred=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    activity: Mapped["Activity"] = relationship("Activity", back_populates="videos")


class UserCourseEnrollment(Base):
    __tablename__ = "user_course_enrollments"
    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="uq_user_course"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), Identity(), primary_key=True
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    course_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True
    )
    enrolled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_accessed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class UserActivityProgress(Base):
    __tablename__ = "user_activity_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "activity_id", name="uq_user_activity"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), Identity(), primary_key=True
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    activity_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("activities.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(String(32), default="started")
    quiz_score: Mapped[int | None] = mapped_column(Integer)
    passed: Mapped[bool] = mapped_column(Boolean, default=False)
    attempts_count: Mapped[int] = mapped_column(Integer, default=1)
    submitted_data: Mapped[dict[str, Any] | None] = mapped_column(JsonType)
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    coins_earned: Mapped[int] = mapped_column(Integer, default=0)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class UserSimulationProgress(Base):
    __tablename__ = "user_simulation_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "event_id", name="uq_user_simulation_event"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), Identity(), primary_key=True
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), default="awaiting_initial_investment")
    current_quarter_index: Mapped[int] = mapped_column(Integer, default=0)
    total_quarters: Mapped[int] = mapped_column(Integer, default=0)
    initial_capital: Mapped[float] = mapped_column(Float, default=10000.0)
    current_capital: Mapped[float] = mapped_column(Float, default=10000.0)
    peak_capital: Mapped[float] = mapped_column(Float, default=10000.0)
    max_drawdown_pct: Mapped[float] = mapped_column(Float, default=0.0)
    cumulative_inflation_factor: Mapped[float] = mapped_column(Float, default=1.0)
    allocations: Mapped[dict[str, Any]] = mapped_column(JsonType, nullable=False, default=dict)
    rebalances_count: Mapped[int] = mapped_column(Integer, default=0)
    history: Mapped[list[Any]] = mapped_column(JsonType, nullable=False, default=list)
    debrief: Mapped[dict[str, Any] | None] = mapped_column(JsonType, nullable=True)
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    coins_earned: Mapped[int] = mapped_column(Integer, default=0)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User")

    def to_session_dict(self):
        return {
            "event_id": self.event_id,
            "status": self.status,
            "current_quarter_index": self.current_quarter_index,
            "total_quarters": self.total_quarters,
            "initial_capital": self.initial_capital,
            "current_capital": self.current_capital,
            "peak_capital": self.peak_capital,
            "max_drawdown_pct": self.max_drawdown_pct,
            "cumulative_inflation_factor": self.cumulative_inflation_factor,
            "allocations": self.allocations,
            "rebalances_count": self.rebalances_count,
            "history": self.history,
            "debrief": self.debrief,
            "xp_earned": self.xp_earned,
            "coins_earned": self.coins_earned,
            "persisted": True,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


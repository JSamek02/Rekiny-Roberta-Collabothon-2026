from datetime import datetime
from typing import Any

from sqlalchemy import (
    BigInteger, Boolean, DateTime, ForeignKey, Identity,
    Integer, String, Text, UniqueConstraint, func
)
from sqlalchemy.dialects.postgresql import JSONB, insert
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

JsonType = JSON().with_variant(JSONB, "postgresql")
SUPPORTED_LANGUAGE_CODES = ("pl", "en", "de")


def get_translation(translations: dict[str, Any] | None, language: str) -> dict[str, Any]:
    translation = (translations or {}).get(language, {})
    return translation if isinstance(translation, dict) else {}


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), Identity(), primary_key=True)
    google_sub: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    email: Mapped[str | None] = mapped_column(Text)
    name: Mapped[str | None] = mapped_column(Text)
    picture: Mapped[str | None] = mapped_column(Text)
    preferred_language: Mapped[str] = mapped_column(
        String(2), nullable=False, default="pl", server_default="pl"
    )
    shark_coins: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    @classmethod
    def upsert(cls, db, userinfo):
        statement = insert(cls).values(
            google_sub=userinfo["sub"], email=userinfo.get("email"),
            name=userinfo.get("name"), picture=userinfo.get("picture"),
        )
        statement = statement.on_conflict_do_update(
            index_elements=[cls.google_sub],
            set_={
                "email": statement.excluded.email,
                "name": statement.excluded.name,
                "picture": statement.excluded.picture,
                "updated_at": func.now(),
            },
        ).returning(cls.id)
        return db.execute(statement).scalar_one()

    def to_dict(self):
        return {
            "id": self.id, "email": self.email, "name": self.name,
            "picture": self.picture, "preferred_language": self.preferred_language,
            "shark_coins": self.shark_coins, "created_at": self.created_at,
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

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), Identity(), primary_key=True
    )
    lesson_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    activity_type: Mapped[str] = mapped_column(String(32), nullable=False)  # 'article', 'quiz', 'video'
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    xp_reward: Mapped[int] = mapped_column(Integer, default=10)
    coin_reward: Mapped[int] = mapped_column(Integer, default=5)
    estimated_minutes: Mapped[int] = mapped_column(Integer, default=3)
    content: Mapped[dict[str, Any]] = mapped_column(JsonType, nullable=False, default=dict)
    translations: Mapped[dict[str, Any]] = mapped_column(JsonType, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    lesson: Mapped["Lesson"] = relationship("Lesson", back_populates="activities")

    def localized_content(self, language="pl"):
        translation = get_translation(self.translations, language)
        content = translation.get("content")
        return content if isinstance(content, dict) else self.content

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
                sanitized_questions = []
                for q in content_copy.get("questions", []):
                    sanitized_q = {
                        "id": q.get("id"),
                        "prompt": q.get("prompt"),
                        "options": q.get("options", []),
                    }
                    sanitized_questions.append(sanitized_q)
                content_copy["questions"] = sanitized_questions
            data["content"] = content_copy
        return data


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

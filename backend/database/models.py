from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Identity, Integer, Text, func
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), Identity(), primary_key=True)
    google_sub: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    email: Mapped[str | None] = mapped_column(Text)
    name: Mapped[str | None] = mapped_column(Text)
    picture: Mapped[str | None] = mapped_column(Text)
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
            "picture": self.picture, "created_at": self.created_at,
        }


class UserSession(Base):
    __tablename__ = "user_sessions"

    token_hash: Mapped[str] = mapped_column(Text, primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

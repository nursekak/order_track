from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime, timezone
from database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(120), nullable=False)
    description = Column(String(1000), nullable=True)
    status = Column(String(20), default="new", nullable=False)
    priority = Column(String(20), default="normal", nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)

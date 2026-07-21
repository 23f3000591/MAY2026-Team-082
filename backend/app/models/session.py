from datetime import datetime

from app.extensions import db


class Session(db.Model):
    __tablename__ = "sessions"

    session_id = db.Column(db.Integer, primary_key=True)

    learner_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)

    mentor_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)

    skill_id = db.Column(db.Integer, db.ForeignKey("skills.skill_id"), nullable=False)

    availability_id = db.Column(
        db.Integer, db.ForeignKey("availabilities.availability_id"), nullable=False
    )

    session_mode = db.Column(db.String(20), nullable=False)

    session_date = db.Column(db.Date, nullable=False)

    meeting_link = db.Column(db.String(255))

    location = db.Column(db.String(255))

    status = db.Column(db.String(20), nullable=False, default="Pending")

    learner_note = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    learner = db.relationship(
        "User", foreign_keys=[learner_id], back_populates="learning_sessions"
    )

    mentor = db.relationship(
        "User", foreign_keys=[mentor_id], back_populates="mentoring_sessions"
    )

    skill = db.relationship("Skill", back_populates="sessions")

    availability = db.relationship("Availability", back_populates="sessions")

    messages = db.relationship(
        "Message", back_populates="session", cascade="all, delete-orphan", lazy=True
    )

    reviews = db.relationship(
        "Review", back_populates="session", cascade="all, delete-orphan", lazy=True
    )

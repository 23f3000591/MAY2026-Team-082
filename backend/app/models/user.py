from datetime import datetime

from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    user_id = db.Column(db.Integer, primary_key=True)

    society_id = db.Column(
        db.Integer, db.ForeignKey("societies.society_id"), nullable=False
    )

    full_name = db.Column(db.String(100), nullable=False)

    email = db.Column(db.String(120), unique=True, nullable=False)

    password_hash = db.Column(db.String(255), nullable=False)

    phone_number = db.Column(db.String(15), unique=True, nullable=False)

    bio = db.Column(db.Text)

    profile_image = db.Column(db.String(255))

    role = db.Column(db.String(20), nullable=False, default="user")

    is_mentor = db.Column(db.Boolean, default=False, nullable=False)

    is_learner = db.Column(db.Boolean, default=True, nullable=False)

    is_verified = db.Column(db.Boolean, default=False, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    society = db.relationship(
        "Society", foreign_keys=[society_id], back_populates="users"
    )

    managed_society = db.relationship(
        "Society",
        foreign_keys="Society.admin_id",
        back_populates="admin",
        uselist=False,
    )

    user_skills = db.relationship(
        "UserSkill", back_populates="user", cascade="all, delete-orphan", lazy=True
    )

    availabilities = db.relationship(
        "Availability", back_populates="user", cascade="all, delete-orphan", lazy=True
    )

    learning_sessions = db.relationship(
        "Session",
        foreign_keys="Session.learner_id",
        back_populates="learner",
        lazy=True,
    )

    mentoring_sessions = db.relationship(
        "Session", foreign_keys="Session.mentor_id", back_populates="mentor", lazy=True
    )

    sent_messages = db.relationship(
        "Message", foreign_keys="Message.sender_id", back_populates="sender", lazy=True
    )

    received_messages = db.relationship(
        "Message",
        foreign_keys="Message.receiver_id",
        back_populates="receiver",
        lazy=True,
    )

    notifications = db.relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan", lazy=True
    )

    reviews_given = db.relationship(
        "Review", foreign_keys="Review.learner_id", back_populates="learner", lazy=True
    )

    reviews_received = db.relationship(
        "Review", foreign_keys="Review.mentor_id", back_populates="mentor", lazy=True
    )

    reports_made = db.relationship(
        "Report",
        foreign_keys="Report.reported_by",
        back_populates="reporter",
        lazy=True,
    )

    reports_received = db.relationship(
        "Report",
        foreign_keys="Report.reported_user",
        back_populates="reported_user_ref",
        lazy=True,
    )

    reports_resolved = db.relationship(
        "Report",
        foreign_keys="Report.resolved_by",
        back_populates="resolver",
        lazy=True,
    )

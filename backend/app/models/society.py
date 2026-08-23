from datetime import datetime

from app.extensions import db


class Society(db.Model):
    __tablename__ = "societies"

    society_id = db.Column(db.Integer, primary_key=True)

    society_name = db.Column(db.String(100), nullable=False)

    address = db.Column(db.String(255), nullable=False)

    city = db.Column(db.String(100), nullable=False)

    state = db.Column(db.String(100), nullable=False)

    pincode = db.Column(db.String(10), nullable=False)

    admin_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    users = db.relationship(
        "User", back_populates="society", foreign_keys="User.society_id", lazy=True
    )

    admin = db.relationship(
        "User", foreign_keys=[admin_id], back_populates="managed_society", uselist=False
    )

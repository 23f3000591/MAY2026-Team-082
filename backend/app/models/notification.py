from datetime import datetime

from app.extensions import db


class Notification(db.Model):
    __tablename__ = "notifications"

    notification_id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)

    title = db.Column(db.String(100), nullable=False)

    message = db.Column(db.Text, nullable=False)

    notification_type = db.Column(db.String(50), nullable=False)

    is_read = db.Column(db.Boolean, default=False, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    email_sent = db.Column(db.Boolean, default=False, nullable=False)

    user = db.relationship("User", back_populates="notifications")

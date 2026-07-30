from datetime import datetime

from app.extensions import db


class Message(db.Model):
    __tablename__ = "messages"

    message_id = db.Column(db.Integer, primary_key=True)

    sender_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)

    receiver_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)

    session_id = db.Column(
        db.Integer, db.ForeignKey("sessions.session_id"), nullable=True
    )

    message = db.Column(db.Text, nullable=False)

    is_read = db.Column(db.Boolean, default=False, nullable=False)

    sent_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    sender = db.relationship(
        "User", foreign_keys=[sender_id], back_populates="sent_messages"
    )

    receiver = db.relationship(
        "User", foreign_keys=[receiver_id], back_populates="received_messages"
    )

    session = db.relationship("Session", back_populates="messages")

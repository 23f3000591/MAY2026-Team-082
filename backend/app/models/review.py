from datetime import datetime

from app.extensions import db


class Review(db.Model):
    __tablename__ = "reviews"

    review_id = db.Column(db.Integer, primary_key=True)

    session_id = db.Column(
        db.Integer, db.ForeignKey("sessions.session_id"), nullable=False
    )

    learner_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)

    mentor_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)

    rating = db.Column(db.Integer, nullable=False)

    review_text = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    session = db.relationship("Session", back_populates="reviews")

    learner = db.relationship(
        "User", foreign_keys=[learner_id], back_populates="reviews_given"
    )

    mentor = db.relationship(
        "User", foreign_keys=[mentor_id], back_populates="reviews_received"
    )

from datetime import datetime
from app.extensions import db


class Favorite(db.Model):
    """Model representing a user's saved favorite mentor."""

    __tablename__ = "favorites"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)
    mentor_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("user_id", "mentor_id", name="unique_user_favorite_mentor"),
    )

    user = db.relationship("User", foreign_keys=[user_id], backref=db.backref("favorites", lazy=True))
    mentor = db.relationship("User", foreign_keys=[mentor_id], backref=db.backref("favorited_by", lazy=True))

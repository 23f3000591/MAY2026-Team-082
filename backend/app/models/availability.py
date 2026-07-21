from app.extensions import db


class Availability(db.Model):
    __tablename__ = "availabilities"

    availability_id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)

    day_of_week = db.Column(db.String(20), nullable=False)

    start_time = db.Column(db.Time, nullable=False)

    end_time = db.Column(db.Time, nullable=False)

    user = db.relationship("User", back_populates="availabilities")

    sessions = db.relationship("Session", back_populates="availability", lazy=True)

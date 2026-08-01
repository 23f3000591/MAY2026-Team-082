from datetime import datetime

from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models.user import User
from app.models.availability import Availability


class ValidationError(Exception):
    """Raised when availability validation fails."""

    def __init__(self, message):
        self.message = message
        super().__init__(message)


ALLOWED_DAYS = [
    "Monday", "Tuesday", "Wednesday", "Thursday",
    "Friday", "Saturday", "Sunday",
]


def _parse_time(value, field_name):
    try:
        return datetime.strptime(str(value).strip(), "%H:%M").time()
    except (ValueError, TypeError):
        raise ValidationError(f"{field_name} must be in HH:MM 24-hour format.")


# Service function for setting mentor availability
def set_mentor_availability_service(data):
    """
    Creates a new availability slot for the logged-in mentor.
    """

    if data is None or not isinstance(data, dict):
        raise ValidationError("Request body must be a valid JSON object.")

    day_of_week = data.get("day_of_week")
    start_time_raw = data.get("start_time")
    end_time_raw = data.get("end_time")

    if not day_of_week or str(day_of_week).strip().title() not in ALLOWED_DAYS:
        raise ValidationError(
            f"day_of_week must be one of: {', '.join(ALLOWED_DAYS)}."
        )

    day_of_week = str(day_of_week).strip().title()

    if start_time_raw is None or end_time_raw is None:
        raise ValidationError("start_time and end_time are required.")

    start_time = _parse_time(start_time_raw, "start_time")
    end_time = _parse_time(end_time_raw, "end_time")

    if start_time >= end_time:
        raise ValidationError("start_time must be before end_time.")

    user_id = int(get_jwt_identity())

    user = db.session.get(User, user_id)

    if user is None:
        raise ValidationError("User not found.")

    if not user.is_mentor:
        raise ValidationError("Only mentors can set availability.")

    overlap = Availability.query.filter(
        Availability.user_id == user_id,
        Availability.day_of_week == day_of_week,
        Availability.start_time < end_time,
        Availability.end_time > start_time,
    ).first()

    if overlap:
        raise ValidationError("This availability overlaps with an existing slot.")

    availability = Availability(
        user_id=user_id,
        day_of_week=day_of_week,
        start_time=start_time,
        end_time=end_time,
    )

    db.session.add(availability)
    db.session.commit()

    return availability


# Service function for viewing a mentor's available slots
def get_available_slots_service(mentor_id):
    """
    Retrieves all availability slots for a given mentor.
    """

    mentor = db.session.get(User, mentor_id)

    if mentor is None:
        raise ValidationError("Mentor not found.")

    if not mentor.is_mentor:
        raise ValidationError("This user is not a mentor.")

    slots = (
        Availability.query.filter_by(user_id=mentor_id)
        .order_by(Availability.day_of_week, Availability.start_time)
        .all()
    )

    return slots
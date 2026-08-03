from datetime import datetime

from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models.user import User
from app.models.skill import Skill
from app.models.availability import Availability
from app.models.session import Session
from app.models.notification import Notification


class ValidationError(Exception):
    """Raised when session validation fails."""

    def __init__(self, message):
        self.message = message
        super().__init__(message)


ALLOWED_SESSION_MODES = ["online", "in-person"]

ACTIVE_STATUSES = ("Pending", "Accepted")


def _notify(user_id, title, message, notification_type):
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
    )
    db.session.add(notification)


def _get_session_or_raise(session_id):
    session = db.session.get(Session, session_id)

    if session is None:
        raise ValidationError("Session not found.")

    return session


def _get_participant_or_raise(session, user_id, action):
    if user_id not in (session.learner_id, session.mentor_id):
        raise ValidationError(f"You are not authorized to {action} this session.")


# Service function for booking a session
def book_session_service(data):
    """
    Creates a new session booking request from the logged-in learner.
    """

    if data is None or not isinstance(data, dict):
        raise ValidationError("Request body must be a valid JSON object.")

    mentor_id = data.get("mentor_id")
    skill_id = data.get("skill_id")
    availability_id = data.get("availability_id")
    session_date_raw = data.get("session_date")
    session_mode = data.get("session_mode")
    learner_note = data.get("learner_note")
    meeting_link = data.get("meeting_link")
    location = data.get("location")

    missing_fields = []

    for field_name, value in (
        ("mentor_id", mentor_id),
        ("skill_id", skill_id),
        ("availability_id", availability_id),
        ("session_date", session_date_raw),
        ("session_mode", session_mode),
    ):
        if value is None or (isinstance(value, str) and not value.strip()):
            missing_fields.append(field_name)

    if missing_fields:
        raise ValidationError(
            f"Missing or invalid required fields: {', '.join(missing_fields)}"
        )

    if str(session_mode).strip().lower() not in ALLOWED_SESSION_MODES:
        raise ValidationError(
            f"session_mode must be one of: {', '.join(ALLOWED_SESSION_MODES)}."
        )

    session_mode = str(session_mode).strip().lower()

    try:
        mentor_id = int(mentor_id)
        skill_id = int(skill_id)
        availability_id = int(availability_id)
    except (ValueError, TypeError):
        raise ValidationError(
            "mentor_id, skill_id and availability_id must be valid integers."
        )

    try:
        session_date = datetime.strptime(
            str(session_date_raw).strip(), "%Y-%m-%d"
        ).date()
    except (ValueError, TypeError):
        raise ValidationError("session_date must be in YYYY-MM-DD format.")

    if session_date < datetime.utcnow().date():
        raise ValidationError("session_date cannot be in the past.")

    learner_id = int(get_jwt_identity())

    learner = db.session.get(User, learner_id)

    if learner is None:
        raise ValidationError("Learner not found.")

    if mentor_id == learner_id:
        raise ValidationError("You cannot book a session with yourself.")

    mentor = db.session.get(User, mentor_id)

    if mentor is None or not mentor.is_mentor:
        raise ValidationError("Mentor not found.")

    skill = db.session.get(Skill, skill_id)

    if skill is None:
        raise ValidationError("Skill not found.")

    availability = db.session.get(Availability, availability_id)

    if availability is None or availability.user_id != mentor_id:
        raise ValidationError("Availability slot not found for this mentor.")

    clashing_session = Session.query.filter(
        Session.availability_id == availability_id,
        Session.session_date == session_date,
        Session.status.in_(ACTIVE_STATUSES),
    ).first()

    if clashing_session:
        raise ValidationError("This slot is already booked for the selected date.")

    session = Session(
        learner_id=learner_id,
        mentor_id=mentor_id,
        skill_id=skill_id,
        availability_id=availability_id,
        session_mode=session_mode,
        session_date=session_date,
        meeting_link=meeting_link,
        location=location,
        learner_note=learner_note,
        status="Pending",
    )

    db.session.add(session)

    _notify(
        mentor_id,
        "New booking request",
        f"{learner.full_name} requested a session on {session_date.isoformat()}.",
        "booking_request",
    )

    db.session.commit()

    return session


# Service function for accepting a booking request
def accept_booking_service(session_id):
    """
    Mentor accepts a pending booking request.
    """

    user_id = int(get_jwt_identity())

    session = _get_session_or_raise(session_id)

    if session.mentor_id != user_id:
        raise ValidationError("Only the mentor can accept this booking.")

    if session.status != "Pending":
        raise ValidationError(
            f"Cannot accept a session with status '{session.status}'."
        )

    session.status = "Accepted"

    _notify(
        session.learner_id,
        "Booking accepted",
        f"Your session on {session.session_date.isoformat()} was accepted.",
        "booking_accepted",
    )

    db.session.commit()

    return session


# Service function for rejecting a booking request
def reject_booking_service(session_id):
    """
    Mentor rejects a pending booking request.
    """

    user_id = int(get_jwt_identity())

    session = _get_session_or_raise(session_id)

    if session.mentor_id != user_id:
        raise ValidationError("Only the mentor can reject this booking.")

    if session.status != "Pending":
        raise ValidationError(
            f"Cannot reject a session with status '{session.status}'."
        )

    session.status = "Rejected"

    _notify(
        session.learner_id,
        "Booking rejected",
        f"Your session on {session.session_date.isoformat()} was rejected.",
        "booking_rejected",
    )

    db.session.commit()

    return session


# Service function for cancelling a booking
def cancel_booking_service(session_id):
    """
    Learner or mentor cancels an active booking.
    """

    user_id = int(get_jwt_identity())

    session = _get_session_or_raise(session_id)

    _get_participant_or_raise(session, user_id, "cancel")

    if session.status not in ACTIVE_STATUSES:
        raise ValidationError(
            f"Cannot cancel a session with status '{session.status}'."
        )

    session.status = "Cancelled"

    other_party_id = (
        session.learner_id if user_id == session.mentor_id else session.mentor_id
    )

    _notify(
        other_party_id,
        "Booking cancelled",
        f"The session on {session.session_date.isoformat()} was cancelled.",
        "booking_cancelled",
    )

    db.session.commit()

    return session


# Service function for rescheduling a session
def reschedule_session_service(session_id, data):
    """
    Learner or mentor reschedules an active session to a new slot
    and/or date. Resets status to Pending for re-confirmation.
    """

    if data is None or not isinstance(data, dict):
        raise ValidationError("Request body must be a valid JSON object.")

    user_id = int(get_jwt_identity())

    session = _get_session_or_raise(session_id)

    _get_participant_or_raise(session, user_id, "reschedule")

    if session.status not in ACTIVE_STATUSES:
        raise ValidationError(
            f"Cannot reschedule a session with status '{session.status}'."
        )

    availability_id = data.get("availability_id")
    session_date_raw = data.get("session_date")

    if availability_id is None or session_date_raw is None:
        raise ValidationError("availability_id and session_date are required.")

    try:
        availability_id = int(availability_id)
    except (ValueError, TypeError):
        raise ValidationError("availability_id must be a valid integer.")

    try:
        session_date = datetime.strptime(
            str(session_date_raw).strip(), "%Y-%m-%d"
        ).date()
    except (ValueError, TypeError):
        raise ValidationError("session_date must be in YYYY-MM-DD format.")

    if session_date < datetime.utcnow().date():
        raise ValidationError("session_date cannot be in the past.")

    availability = db.session.get(Availability, availability_id)

    if availability is None or availability.user_id != session.mentor_id:
        raise ValidationError("Availability slot not found for this mentor.")

    clashing_session = Session.query.filter(
        Session.availability_id == availability_id,
        Session.session_date == session_date,
        Session.status.in_(ACTIVE_STATUSES),
        Session.session_id != session.session_id,
    ).first()

    if clashing_session:
        raise ValidationError("This slot is already booked for the selected date.")

    session.availability_id = availability_id
    session.session_date = session_date
    session.status = "Pending"

    other_party_id = (
        session.learner_id if user_id == session.mentor_id else session.mentor_id
    )

    _notify(
        other_party_id,
        "Session rescheduled",
        f"The session was rescheduled to {session_date.isoformat()}. Please confirm.",
        "booking_rescheduled",
    )

    db.session.commit()

    return session


# Service function for viewing booking history
def get_booking_history_service(status_filter=None):
    """
    Retrieves all sessions where the logged-in user is either the
    learner or the mentor, optionally filtered by status.
    """

    user_id = int(get_jwt_identity())

    query = Session.query.filter(
        db.or_(Session.learner_id == user_id, Session.mentor_id == user_id)
    )

    if status_filter:
        query = query.filter(Session.status == status_filter.strip().title())

    sessions = query.order_by(Session.session_date.desc()).all()

    return sessions
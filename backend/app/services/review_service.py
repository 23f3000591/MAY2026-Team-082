from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models.review import Review
from app.models.session import Session
from app.models.user import User


class ValidationError(Exception):
    """Raised when review input validation fails."""

    def __init__(self, message):
        self.message = message
        super().__init__(message)


class NotFoundError(Exception):
    """Raised when a requested resource does not exist."""

    def __init__(self, message):
        self.message = message
        super().__init__(message)


class AuthorizationError(Exception):
    """Raised when an authenticated user is not allowed to rate a session."""

    def __init__(self, message):
        self.message = message
        super().__init__(message)


class ConflictError(Exception):
    """Raised when a review already exists for the session."""

    def __init__(self, message):
        self.message = message
        super().__init__(message)


def rate_mentor_service(data):
    """
    Creates a rating for a mentor after a completed mentoring session.
    """

    if data is None or not isinstance(data, dict):
        raise ValidationError("Request body must be a valid JSON object.")

    session_id = data.get("session_id")
    rating = data.get("rating")
    review_text = data.get("review_text")

    if session_id is None:
        raise ValidationError("session_id is required.")

    if rating is None:
        raise ValidationError("rating is required.")

    try:
        session_id = int(session_id)
    except (ValueError, TypeError):
        raise ValidationError("session_id must be a valid integer.")

    # bool is technically an int in Python, so reject it explicitly.
    if isinstance(rating, bool):
        raise ValidationError("rating must be an integer between 1 and 5.")

    try:
        rating = int(rating)
    except (ValueError, TypeError):
        raise ValidationError("rating must be an integer between 1 and 5.")

    if rating < 1 or rating > 5:
        raise ValidationError("rating must be between 1 and 5.")

    if not isinstance(review_text, str) or not review_text.strip():
        raise ValidationError("review_text is required and cannot be empty.")

    learner_id = int(get_jwt_identity())

    learner = db.session.get(User, learner_id)

    if learner is None:
        raise ValidationError("Learner not found.")

    session = db.session.get(Session, session_id)

    if session is None:
        raise NotFoundError("Session not found.")

    # Only the learner who actually booked the session can rate it.
    if session.learner_id != learner_id:
        raise AuthorizationError(
            "You can only rate a session you attended."
        )

    # Only completed sessions are eligible for rating.
    if session.status != "Completed":
        raise ValidationError("Only completed sessions can be rated.")

    mentor = db.session.get(User, session.mentor_id)

    if mentor is None or not (mentor.is_mentor or (mentor.role and mentor.role.lower() == "mentor") or (mentor.user_skills and len(mentor.user_skills) > 0)):
        raise NotFoundError("Mentor not found.")

    # Prevent duplicate ratings for the same session.
    existing_review = Review.query.filter_by(
        session_id=session.session_id,
        learner_id=learner_id,
    ).first()

    if existing_review:
        raise ConflictError("This session has already been rated.")

    review = Review(
        session_id=session.session_id,
        learner_id=learner_id,
        mentor_id=session.mentor_id,
        rating=rating,
        review_text=review_text.strip() if review_text else None,
    )

    db.session.add(review)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

    return review

def get_mentor_reviews_service(mentor_id):
    """
    Retrieves all reviews submitted for a specific mentor.
    """

    try:
        mentor_id = int(mentor_id)
        mentor = db.session.get(User, mentor_id)
    except (ValueError, TypeError):
        from sqlalchemy import or_, func
        mentor = (
            db.session.query(User)
            .filter(
                or_(
                    func.lower(User.full_name) == str(mentor_id).replace("-", " ").lower(),
                    func.lower(User.email).like(f"{str(mentor_id).lower()}%"),
                ),
                or_(
                    func.lower(User.role) == "mentor",
                    User.is_mentor.is_(True),
                    User.user_skills.any(),
                ),
            )
            .first()
        )
        if not mentor:
            raise ValidationError("mentor_id must be a valid integer or mentor identifier.")
        mentor_id = mentor.user_id

    if mentor is None or not (mentor.is_mentor or (mentor.role and mentor.role.lower() == "mentor") or (mentor.user_skills and len(mentor.user_skills) > 0)):
        raise NotFoundError("Mentor not found.")

    reviews = (
        Review.query
        .filter_by(mentor_id=mentor_id)
        .order_by(Review.created_at.desc())
        .all()
    )

    return reviews
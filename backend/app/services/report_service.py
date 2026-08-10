from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models.report import Report
from app.models.review import Review
from app.models.user import User


class ValidationError(Exception):
    """Raised when report input validation fails."""

    def __init__(self, message):
        self.message = message
        super().__init__(message)


class NotFoundError(Exception):
    """Raised when a requested resource does not exist."""

    def __init__(self, message):
        self.message = message
        super().__init__(message)


class AuthorizationError(Exception):
    """Raised when a user is not allowed to perform the action."""

    def __init__(self, message):
        self.message = message
        super().__init__(message)


def report_review_service(data):
    """
    Creates a report for a review.
    """

    if data is None or not isinstance(data, dict):
        raise ValidationError("Request body must be a valid JSON object.")

    review_id = data.get("review_id")
    reason = data.get("reason")
    description = data.get("description")

    if review_id is None:
        raise ValidationError("review_id is required.")

    try:
        review_id = int(review_id)
    except (ValueError, TypeError):
        raise ValidationError("review_id must be a valid integer.")

    if not isinstance(reason, str) or not reason.strip():
        raise ValidationError("reason is required and cannot be empty.")

    if description is not None and not isinstance(description, str):
        raise ValidationError("description must be a string.")

    reporter_id = int(get_jwt_identity())

    reporter = db.session.get(User, reporter_id)

    if reporter is None:
        raise ValidationError("User not found.")

    review = db.session.get(Review, review_id)

    if review is None:
        raise NotFoundError("Review not found.")

    report = Report(
        review_id=review.review_id,
        reported_by=reporter_id,
        reported_user=review.mentor_id,
        reason=reason.strip(),
        description=description.strip() if description else None,
        status="Pending",
    )

    db.session.add(report)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

    return report
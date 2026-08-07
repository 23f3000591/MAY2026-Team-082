from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models.user import User
from app.services.notification_service import (
    create_notification_service,
    NOTIFICATION_TYPE_ADMIN,
    NOTIFICATION_TYPE_VERIFICATION,
)


class ValidationError(Exception):
    """Raised when request validation fails."""

    def __init__(self, message):
        self.message = message
        super().__init__(message)


class ResourceNotFoundError(Exception):
    """Raised when a requested resource does not exist."""

    def __init__(self, message):
        self.message = message
        super().__init__(message)


class AuthorizationError(Exception):
    """Raised when a user is not authorized."""

    def __init__(self, message):
        self.message = message
        super().__init__(message)


def update_user_suspension_service(user_id, data):
    """
    Suspends or unsuspends a user.
    """

    if data is None or not isinstance(data, dict):
        raise ValidationError("Request body must be a valid JSON object.")

    if "is_suspended" not in data:
        raise ValidationError("is_suspended field is required.")

    is_suspended = data.get("is_suspended")

    if not isinstance(is_suspended, bool):
        raise ValidationError("is_suspended must be a boolean.")

    admin_id = int(get_jwt_identity())

    admin = db.session.get(User, admin_id)

    if not admin:
        raise ResourceNotFoundError("Admin not found.")

    if admin.role != "admin":
        raise AuthorizationError(
            "Only administrators can update user suspension status."
        )

    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        raise ValidationError("user_id must be a valid integer.")

    user = db.session.get(User, user_id)

    if not user:
        raise ResourceNotFoundError("User not found.")

    if user.user_id == admin.user_id:
        raise ValidationError("Administrators cannot suspend their own account.")

    if user.is_suspended == is_suspended:
        state = "suspended" if is_suspended else "active"
        raise ValidationError(f"User is already {state}.")

    user.is_suspended = is_suspended

    db.session.commit()

    if is_suspended:
        create_notification_service(
            user_id=user.user_id,
            title="Account Suspended",
            message="Your account has been suspended by the administrator.",
            notification_type=NOTIFICATION_TYPE_ADMIN,
        )
    else:
        create_notification_service(
            user_id=user.user_id,
            title="Account Reactivated",
            message="Your account has been reactivated by the administrator.",
            notification_type=NOTIFICATION_TYPE_ADMIN,
        )

    return user


def update_mentor_verification_service(user_id, data):
    """
    Verifies or unverifies a mentor.
    """

    if data is None or not isinstance(data, dict):
        raise ValidationError("Request body must be a valid JSON object.")

    if "is_verified" not in data:
        raise ValidationError("is_verified field is required.")

    is_verified = data.get("is_verified")

    if not isinstance(is_verified, bool):
        raise ValidationError("is_verified must be a boolean.")

    admin_id = int(get_jwt_identity())

    admin = db.session.get(User, admin_id)

    if not admin:
        raise ResourceNotFoundError("Admin not found.")

    if admin.role != "admin":
        raise AuthorizationError("Only administrators can update mentor verification.")

    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        raise ValidationError("user_id must be a valid integer.")

    mentor = db.session.get(User, user_id)

    if not mentor:
        raise ResourceNotFoundError("User not found.")

    if admin.user_id == mentor.user_id:
        raise ValidationError("Administrators cannot verify themselves.")

    if not mentor.is_mentor:
        raise ValidationError("Selected user is not a mentor.")

    if mentor.is_verified == is_verified:
        state = "verified" if is_verified else "unverified"
        raise ValidationError(f"Mentor is already {state}.")

    mentor.is_verified = is_verified

    db.session.commit()

    if is_verified:
        create_notification_service(
            user_id=mentor.user_id,
            title="Mentor Verified",
            message="Congratulations! Your mentor account has been verified.",
            notification_type=NOTIFICATION_TYPE_VERIFICATION,
        )
    else:
        create_notification_service(
            user_id=mentor.user_id,
            title="Mentor Verification Removed",
            message="Your mentor verification has been removed by the administrator.",
            notification_type=NOTIFICATION_TYPE_VERIFICATION,
        )

    return mentor

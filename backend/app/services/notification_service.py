from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models.notification import Notification
from app.models.user import User

# Notification type constants
NOTIFICATION_TYPE_SESSION_BOOKING = "Session Booking"
NOTIFICATION_TYPE_SESSION_REMINDER = "Session Reminder"
NOTIFICATION_TYPE_MESSAGE = "Message"
NOTIFICATION_TYPE_VERIFICATION = "Verification"
NOTIFICATION_TYPE_REPORT = "Report"
NOTIFICATION_TYPE_ADMIN = "Admin"


class ValidationError(Exception):
    """Raised when notification validation fails."""

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


def get_notifications_service():
    """
    Retrieves all notifications for the logged-in user.
    """
    user_id = int(get_jwt_identity())

    user = db.session.get(User, user_id)

    if not user:
        raise ResourceNotFoundError("User not found.")

    if user.is_suspended:
        raise AuthorizationError(
            "Your account has been suspended. You cannot view notifications."
        )

    notifications = (
        Notification.query.filter_by(user_id=user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )

    return notifications


def create_notification_service(user_id, title, message, notification_type):
    """
    Creates a notification for a user.
    """
    user = db.session.get(User, user_id)

    if not user:
        raise ResourceNotFoundError("User not found.")

    notification = Notification(
        user_id=user_id,
        title=title.strip(),
        message=message.strip(),
        notification_type=notification_type.strip(),
    )

    db.session.add(notification)
    db.session.commit()

    return notification


def mark_notification_read_service(notification_id):
    """
    Marks a notification as read.
    """

    try:
        notification_id = int(notification_id)
    except (ValueError, TypeError):
        raise ValidationError("notification_id must be a valid integer.")

    user_id = int(get_jwt_identity())

    user = db.session.get(User, user_id)

    if not user:
        raise ResourceNotFoundError("User not found.")

    if user.is_suspended:
        raise AuthorizationError(
            "Your account has been suspended. You cannot update notifications."
        )

    notification = db.session.get(Notification, notification_id)

    if not notification:
        raise ResourceNotFoundError("Notification not found.")

    if notification.user_id != user_id:
        raise AuthorizationError("You are not authorized to update this notification.")

    notification.is_read = True

    db.session.commit()

    return notification

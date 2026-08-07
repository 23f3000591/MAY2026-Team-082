from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models.message import Message
from app.models.user import User
from sqlalchemy import and_, or_

from app.services.notification_service import (
    create_notification_service,
    NOTIFICATION_TYPE_MESSAGE,
)


class ValidationError(Exception):
    """Raised when message validation fails."""

    def __init__(self, message):
        self.message = message
        super().__init__(message)


class ResourceNotFoundError(Exception):
    """Raised when a requested resource does not exist."""

    def __init__(self, message):
        self.message = message
        super().__init__(message)


class AuthorizationError(Exception):
    """Raised when a user is not authorized to perform an action."""

    def __init__(self, message):
        self.message = message
        super().__init__(message)


def send_message_service(data):
    """
    Sends a message from the logged-in user to another user.
    """

    if data is None or not isinstance(data, dict):
        raise ValidationError("Request body must be a valid JSON object.")

    receiver_id = data.get("receiver_id")
    message = data.get("message")

    missing_fields = []

    if receiver_id is None:
        missing_fields.append("receiver_id")

    if not message or not str(message).strip():
        missing_fields.append("message")

    if missing_fields:
        raise ValidationError(
            f"Missing or invalid required fields: {', '.join(missing_fields)}"
        )

    try:
        receiver_id = int(receiver_id)
    except (ValueError, TypeError):
        raise ValidationError("receiver_id must be a valid integer.")

    sender_id = int(get_jwt_identity())
    sender = db.session.get(User, sender_id)

    if not sender:
        raise ResourceNotFoundError("Sender not found.")

    receiver = db.session.get(User, receiver_id)

    if not receiver:
        raise ResourceNotFoundError("Receiver not found.")

    if sender.is_suspended:
        raise AuthorizationError(
            "Your account has been suspended. You cannot send messages."
        )

    if receiver.is_suspended:
        raise ValidationError("Cannot send a message to a suspended user.")

    if sender.user_id == receiver.user_id:
        raise ValidationError("You cannot send a message to yourself.")

    message = str(message).strip()

    if len(message) > 1000:
        raise ValidationError("Message cannot exceed 1000 characters.")

    message_obj = Message(
        sender_id=sender.user_id,
        receiver_id=receiver.user_id,
        message=message,
    )

    db.session.add(message_obj)
    db.session.commit()

    create_notification_service(
        user_id=receiver.user_id,
        title="New Message",
        message=f"You received a new message from {sender.full_name}.",
        notification_type=NOTIFICATION_TYPE_MESSAGE,
    )

    return message_obj


def get_received_messages_service():
    """
    Retrieves all messages received by the logged-in user.
    """

    user_id = int(get_jwt_identity())

    user = db.session.get(User, user_id)

    if not user:
        raise ResourceNotFoundError("User not found.")

    if user.is_suspended:
        raise AuthorizationError(
            "Your account has been suspended. You cannot view messages."
        )

    messages = (
        Message.query.filter_by(receiver_id=user_id)
        .order_by(Message.sent_at.desc())
        .all()
    )

    return messages


def get_conversation_service(user_id):
    """
    Retrieves the conversation history between the logged-in user
    and another user.
    """

    try:
        other_user_id = int(user_id)
    except (ValueError, TypeError):
        raise ValidationError("user_id must be a valid integer.")

    current_user_id = int(get_jwt_identity())

    current_user = db.session.get(User, current_user_id)

    if not current_user:
        raise ResourceNotFoundError("User not found.")

    other_user = db.session.get(User, other_user_id)

    if not other_user:
        raise ResourceNotFoundError("User not found.")

    if current_user.user_id == other_user.user_id:
        raise ValidationError("You cannot view a conversation with yourself.")

    if current_user.is_suspended:
        raise AuthorizationError(
            "Your account has been suspended. You cannot view conversations."
        )

    conversation = (
        Message.query.filter(
            or_(
                and_(
                    Message.sender_id == current_user_id,
                    Message.receiver_id == other_user_id,
                ),
                and_(
                    Message.sender_id == other_user_id,
                    Message.receiver_id == current_user_id,
                ),
            )
        )
        .order_by(Message.sent_at.asc())
        .all()
    )

    unread_messages = Message.query.filter(
        Message.sender_id == other_user_id,
        Message.receiver_id == current_user_id,
        Message.is_read == False,
    ).all()

    for message in unread_messages:
        message.is_read = True

    db.session.commit()

    return conversation

from flask_jwt_extended import get_jwt_identity
from sqlalchemy import and_, or_

from app.extensions import db
from app.models.message import Message
from app.models.user import User
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


def _get_current_user():
    """Return the currently authenticated user."""

    user_id = int(get_jwt_identity())

    user = db.session.get(User, user_id)

    if not user:
        raise ResourceNotFoundError("User not found.")

    return user


def _validate_active_user(user):
    """Prevent suspended users from accessing chat functionality."""

    if user.is_suspended:
        raise AuthorizationError(
            "Your account has been suspended. You cannot access chat."
        )


def _validate_pagination(page, per_page):
    """
    Validate pagination parameters.

    Returns:
        tuple[int, int]
    """

    try:
        page = int(page)
        per_page = int(per_page)
    except (ValueError, TypeError):
        raise ValidationError(
            "page and per_page must be valid integers."
        )

    if page < 1:
        raise ValidationError("page must be greater than or equal to 1.")

    if per_page < 1:
        raise ValidationError(
            "per_page must be greater than or equal to 1."
        )

    if per_page > 100:
        raise ValidationError("per_page cannot exceed 100.")

    return page, per_page


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

    sender = _get_current_user()
    _validate_active_user(sender)

    receiver = db.session.get(User, receiver_id)

    if not receiver:
        raise ResourceNotFoundError("Receiver not found.")

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
    Includes both read and unread messages.
    """

    current_user = _get_current_user()
    _validate_active_user(current_user)

    messages = (
        Message.query
        .filter(Message.receiver_id == current_user.user_id)
        .order_by(
            Message.sent_at.desc(),
            Message.message_id.desc(),
        )
        .all()
    )

    return messages


def get_unread_messages_service():
    """
    Retrieves all unread messages received by the logged-in user.
    """

    current_user = _get_current_user()
    _validate_active_user(current_user)

    messages = (
        Message.query
        .filter(
            Message.receiver_id == current_user.user_id,
            Message.is_read.is_(False),
        )
        .order_by(
            Message.sent_at.desc(),
            Message.message_id.desc(),
        )
        .all()
    )

    return messages


def get_read_messages_service():
    """
    Retrieves all read messages received by the logged-in user.
    """

    current_user = _get_current_user()
    _validate_active_user(current_user)

    messages = (
        Message.query
        .filter(
            Message.receiver_id == current_user.user_id,
            Message.is_read.is_(True),
        )
        .order_by(
            Message.sent_at.desc(),
            Message.message_id.desc(),
        )
        .all()
    )

    return messages


def get_conversation_service(user_id, page=1, per_page=20):
    """
    Retrieves a paginated complete conversation history between
    the logged-in user and another user.

    Both sent and received messages are returned.

    Messages are ordered oldest to newest.

    Reading the conversation does not modify read status.
    """

    try:
        other_user_id = int(user_id)
    except (ValueError, TypeError):
        raise ValidationError("user_id must be a valid integer.")

    page, per_page = _validate_pagination(page, per_page)

    current_user = _get_current_user()
    _validate_active_user(current_user)

    other_user = db.session.get(User, other_user_id)

    if not other_user:
        raise ResourceNotFoundError("User not found.")

    if current_user.user_id == other_user.user_id:
        raise ValidationError(
            "You cannot view a conversation with yourself."
        )

    query = Message.query.filter(
        or_(
            and_(
                Message.sender_id == current_user.user_id,
                Message.receiver_id == other_user.user_id,
            ),
            and_(
                Message.sender_id == other_user.user_id,
                Message.receiver_id == current_user.user_id,
            ),
        )
    ).order_by(
        Message.sent_at.asc(),
        Message.message_id.asc(),
    )

    pagination = query.paginate(
        page=page,
        per_page=per_page,
        error_out=False,
    )

    return pagination


def get_conversation_search_service(
    user_id,
    search,
    page=1,
    per_page=20,
):
    """
    Searches message content within a specific conversation.

    Both sent and received messages are searched.

    Results are paginated and ordered newest to oldest.
    """

    try:
        other_user_id = int(user_id)
    except (ValueError, TypeError):
        raise ValidationError("user_id must be a valid integer.")

    page, per_page = _validate_pagination(page, per_page)

    if not search or not search.strip():
        raise ValidationError("Search query cannot be empty.")

    search = search.strip()

    current_user = _get_current_user()
    _validate_active_user(current_user)

    other_user = db.session.get(User, other_user_id)

    if not other_user:
        raise ResourceNotFoundError("User not found.")

    if current_user.user_id == other_user.user_id:
        raise ValidationError(
            "You cannot search a conversation with yourself."
        )

    query = Message.query.filter(
        or_(
            and_(
                Message.sender_id == current_user.user_id,
                Message.receiver_id == other_user.user_id,
            ),
            and_(
                Message.sender_id == other_user.user_id,
                Message.receiver_id == current_user.user_id,
            ),
        ),
        Message.message.ilike(f"%{search}%"),
    ).order_by(
        Message.sent_at.desc(),
        Message.message_id.desc(),
    )

    pagination = query.paginate(
        page=page,
        per_page=per_page,
        error_out=False,
    )

    return pagination


def get_conversation_inbox_service(search=None):
    """
    Retrieves the WhatsApp-style conversation inbox.

    Returns one entry per user with whom the logged-in user
    has exchanged messages.

    Each entry contains:
    - other user's ID
    - other user's name
    - latest message
    - latest message timestamp
    - total messages exchanged
    - unread message count
    """

    current_user = _get_current_user()
    _validate_active_user(current_user)

    search = search.strip() if search else None

    messages = (
        Message.query
        .filter(
            or_(
                Message.sender_id == current_user.user_id,
                Message.receiver_id == current_user.user_id,
            )
        )
        .order_by(
            Message.sent_at.desc(),
            Message.message_id.desc(),
        )
        .all()
    )

    conversations = {}

    for message in messages:
        if message.sender_id == current_user.user_id:
            other_user_id = message.receiver_id
        else:
            other_user_id = message.sender_id

        if other_user_id not in conversations:
            other_user = db.session.get(User, other_user_id)

            if not other_user:
                continue

            if (
                search
                and search.lower() not in other_user.full_name.lower()
            ):
                continue

            conversations[other_user_id] = {
                "user_id": other_user.user_id,
                "user_name": other_user.full_name,
                "last_message": message.message,
                "last_message_at": (
                    message.sent_at.isoformat()
                    if message.sent_at
                    else None
                ),
                "message_count": 0,
                "unread_count": 0,
            }

        conversation = conversations[other_user_id]

        conversation["message_count"] += 1

        if (
            message.receiver_id == current_user.user_id
            and not message.is_read
        ):
            conversation["unread_count"] += 1

    return list(conversations.values())


def search_messages_service(search):
    """
    Searches message content across all conversations
    of the logged-in user.
    """

    if not search or not search.strip():
        raise ValidationError("Search query cannot be empty.")

    current_user = _get_current_user()
    _validate_active_user(current_user)

    search = search.strip()

    messages = (
        Message.query
        .filter(
            or_(
                Message.sender_id == current_user.user_id,
                Message.receiver_id == current_user.user_id,
            ),
            Message.message.ilike(f"%{search}%"),
        )
        .order_by(
            Message.sent_at.desc(),
            Message.message_id.desc(),
        )
        .all()
    )

    return messages


def mark_message_read_service(message_id):
    """
    Marks one received message as read.
    """

    try:
        message_id = int(message_id)
    except (ValueError, TypeError):
        raise ValidationError("message_id must be a valid integer.")

    current_user = _get_current_user()
    _validate_active_user(current_user)

    message = db.session.get(Message, message_id)

    if not message:
        raise ResourceNotFoundError("Message not found.")

    if message.receiver_id != current_user.user_id:
        raise AuthorizationError(
            "You are not authorized to update this message."
        )

    message.is_read = True

    db.session.commit()

    return message


def mark_conversation_read_service(user_id):
    """
    Marks all unread messages received from another user as read.
    """

    try:
        other_user_id = int(user_id)
    except (ValueError, TypeError):
        raise ValidationError("user_id must be a valid integer.")

    current_user = _get_current_user()
    _validate_active_user(current_user)

    other_user = db.session.get(User, other_user_id)

    if not other_user:
        raise ResourceNotFoundError("User not found.")

    if current_user.user_id == other_user.user_id:
        raise ValidationError(
            "You cannot update a conversation with yourself."
        )

    messages = (
        Message.query
        .filter(
            Message.sender_id == other_user.user_id,
            Message.receiver_id == current_user.user_id,
            Message.is_read.is_(False),
        )
        .all()
    )

    for message in messages:
        message.is_read = True

    db.session.commit()

    return messages
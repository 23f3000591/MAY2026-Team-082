from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import jwt_required

from app.services.chat_service import (
    AuthorizationError,
    ResourceNotFoundError,
    ValidationError,
    send_message_service,
    get_received_messages_service,
    get_unread_messages_service,
    get_read_messages_service,
    get_conversation_service,
    get_conversation_inbox_service,
    search_messages_service,
    mark_message_read_service,
    mark_conversation_read_service,
)


chat_bp = Blueprint(
    "chat",
    __name__,
    url_prefix="/chat",
)


def _serialize_message(message):
    """Convert a Message object into a JSON-safe dictionary."""

    return {
        "message_id": message.message_id,
        "sender_id": message.sender_id,
        "receiver_id": message.receiver_id,
        "message": message.message,
        "is_read": message.is_read,
        "sent_at": (
            message.sent_at.isoformat()
            if message.sent_at
            else None
        ),
    }


@chat_bp.route("/messages", methods=["POST"])
@jwt_required()
def send_message():
    """
    POST /api/chat/messages

    Sends a message to another user.
    """

    data = request.get_json(silent=True)

    try:
        message_obj = send_message_service(data)

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Message sent successfully",
                    "data": _serialize_message(message_obj),
                }
            ),
            201,
        )

    except ValidationError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 400

    except ResourceNotFoundError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 404

    except AuthorizationError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 403

    except Exception as err:
        current_app.logger.exception(
            f"Unexpected error in send_message: {str(err)}"
        )

        return jsonify(
            {
                "status": "error",
                "message": "An unexpected error occurred.",
            }
        ), 500


@chat_bp.route("/messages", methods=["GET"])
@jwt_required()
def get_received_messages():
    """
    GET /api/chat/messages

    Retrieves all messages received by the logged-in user.
    Includes both read and unread messages.
    """

    try:
        messages = get_received_messages_service()

        return jsonify(
            {
                "status": "success",
                "message": "Messages retrieved successfully",
                "data": [
                    _serialize_message(message)
                    for message in messages
                ],
            }
        ), 200

    except ResourceNotFoundError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 404

    except AuthorizationError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 403

    except Exception as err:
        current_app.logger.exception(
            f"Unexpected error in get_received_messages: {str(err)}"
        )

        return jsonify(
            {
                "status": "error",
                "message": "An unexpected error occurred.",
            }
        ), 500


@chat_bp.route("/messages/unread", methods=["GET"])
@jwt_required()
def get_unread_messages():
    """
    GET /api/chat/messages/unread

    Retrieves unread messages received by the logged-in user.
    """

    try:
        messages = get_unread_messages_service()

        return jsonify(
            {
                "status": "success",
                "message": "Unread messages retrieved successfully",
                "data": [
                    _serialize_message(message)
                    for message in messages
                ],
            }
        ), 200

    except ResourceNotFoundError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 404

    except AuthorizationError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 403

    except Exception as err:
        current_app.logger.exception(
            f"Unexpected error in get_unread_messages: {str(err)}"
        )

        return jsonify(
            {
                "status": "error",
                "message": "An unexpected error occurred.",
            }
        ), 500


@chat_bp.route("/messages/read", methods=["GET"])
@jwt_required()
def get_read_messages():
    """
    GET /api/chat/messages/read

    Retrieves read messages received by the logged-in user.
    """

    try:
        messages = get_read_messages_service()

        return jsonify(
            {
                "status": "success",
                "message": "Read messages retrieved successfully",
                "data": [
                    _serialize_message(message)
                    for message in messages
                ],
            }
        ), 200

    except ResourceNotFoundError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 404

    except AuthorizationError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 403

    except Exception as err:
        current_app.logger.exception(
            f"Unexpected error in get_read_messages: {str(err)}"
        )

        return jsonify(
            {
                "status": "error",
                "message": "An unexpected error occurred.",
            }
        ), 500


@chat_bp.route("/conversations", methods=["GET"])
@jwt_required()
def get_conversation_inbox():
    """
    GET /api/chat/conversations

    Retrieves the WhatsApp-style conversation inbox.

    Optional query parameter:
        ?search=John
    """

    try:
        search = request.args.get("search")

        conversations = get_conversation_inbox_service(search)

        return jsonify(
            {
                "status": "success",
                "message": "Conversation inbox retrieved successfully",
                "data": conversations,
            }
        ), 200

    except ValidationError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 400

    except ResourceNotFoundError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 404

    except AuthorizationError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 403

    except Exception as err:
        current_app.logger.exception(
            f"Unexpected error in get_conversation_inbox: {str(err)}"
        )

        return jsonify(
            {
                "status": "error",
                "message": "An unexpected error occurred.",
            }
        ), 500


@chat_bp.route("/conversations/<int:user_id>", methods=["GET"])
@jwt_required()
def get_conversation(user_id):
    """
    GET /api/chat/conversations/<user_id>

    Retrieves the complete conversation history between the
    logged-in user and another user.

    Messages are not automatically marked as read.
    """

    try:
        conversation = get_conversation_service(user_id)

        return jsonify(
            {
                "status": "success",
                "message": "Conversation retrieved successfully",
                "data": [
                    _serialize_message(message)
                    for message in conversation
                ],
            }
        ), 200

    except ValidationError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 400

    except ResourceNotFoundError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 404

    except AuthorizationError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 403

    except Exception as err:
        current_app.logger.exception(
            f"Unexpected error in get_conversation: {str(err)}"
        )

        return jsonify(
            {
                "status": "error",
                "message": "An unexpected error occurred.",
            }
        ), 500


@chat_bp.route("/messages/search", methods=["GET"])
@jwt_required()
def search_messages():
    """
    GET /api/chat/messages/search?query=hello

    Searches messages in the logged-in user's conversations.
    """

    try:
        search = request.args.get("query")

        messages = search_messages_service(search)

        return jsonify(
            {
                "status": "success",
                "message": "Messages search completed successfully",
                "data": [
                    _serialize_message(message)
                    for message in messages
                ],
            }
        ), 200

    except ValidationError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 400

    except ResourceNotFoundError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 404

    except AuthorizationError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 403

    except Exception as err:
        current_app.logger.exception(
            f"Unexpected error in search_messages: {str(err)}"
        )

        return jsonify(
            {
                "status": "error",
                "message": "An unexpected error occurred.",
            }
        ), 500


@chat_bp.route("/messages/<int:message_id>/read", methods=["PATCH"])
@jwt_required()
def mark_message_read(message_id):
    """
    PATCH /api/chat/messages/<message_id>/read

    Marks one received message as read.
    """

    try:
        message = mark_message_read_service(message_id)

        return jsonify(
            {
                "status": "success",
                "message": "Message marked as read successfully",
                "data": _serialize_message(message),
            }
        ), 200

    except ValidationError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 400

    except ResourceNotFoundError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 404

    except AuthorizationError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 403

    except Exception as err:
        current_app.logger.exception(
            f"Unexpected error in mark_message_read: {str(err)}"
        )

        return jsonify(
            {
                "status": "error",
                "message": "An unexpected error occurred.",
            }
        ), 500


@chat_bp.route(
    "/conversations/<int:user_id>/read",
    methods=["PATCH"],
)
@jwt_required()
def mark_conversation_read(user_id):
    """
    PATCH /api/chat/conversations/<user_id>/read

    Marks all unread messages received from another user as read.
    """

    try:
        messages = mark_conversation_read_service(user_id)

        return jsonify(
            {
                "status": "success",
                "message": "Conversation messages marked as read successfully",
                "data": {
                    "updated_count": len(messages),
                },
            }
        ), 200

    except ValidationError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 400

    except ResourceNotFoundError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 404

    except AuthorizationError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 403

    except Exception as err:
        current_app.logger.exception(
            f"Unexpected error in mark_conversation_read: {str(err)}"
        )

        return jsonify(
            {
                "status": "error",
                "message": "An unexpected error occurred.",
            }
        ), 500
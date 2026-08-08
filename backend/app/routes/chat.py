from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import jwt_required

from app.services.chat_service import (
    AuthorizationError,
    ResourceNotFoundError,
    ValidationError,
    send_message_service,
    get_received_messages_service,
    get_conversation_service,
)

chat_bp = Blueprint(
    "chat",
    __name__,
    url_prefix="/chat",
)


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
                    "data": {
                        "message_id": message_obj.message_id,
                        "sender_id": message_obj.sender_id,
                        "receiver_id": message_obj.receiver_id,
                        "message": message_obj.message,
                        "is_read": message_obj.is_read,
                        "sent_at": (
                            message_obj.sent_at.isoformat()
                            if message_obj.sent_at
                            else None
                        ),
                    },
                }
            ),
            201,
        )

    except ValidationError as err:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": err.message,
                }
            ),
            400,
        )

    except ResourceNotFoundError as err:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": err.message,
                }
            ),
            404,
        )

    except AuthorizationError as err:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": err.message,
                }
            ),
            403,
        )

    except Exception as err:
        current_app.logger.exception(f"Unexpected error in send_message: {str(err)}")

        return (
            jsonify(
                {
                    "status": "error",
                    "message": "An unexpected error occurred.",
                }
            ),
            500,
        )


@chat_bp.route("/messages", methods=["GET"])
@jwt_required()
def get_received_messages():
    """
    GET /api/chat/messages

    Retrieves all messages received by the logged-in user.
    """

    try:
        messages = get_received_messages_service()

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Messages retrieved successfully",
                    "data": [
                        {
                            "message_id": message.message_id,
                            "sender_id": message.sender_id,
                            "receiver_id": message.receiver_id,
                            "message": message.message,
                            "is_read": message.is_read,
                            "sent_at": (
                                message.sent_at.isoformat() if message.sent_at else None
                            ),
                        }
                        for message in messages
                    ],
                }
            ),
            200,
        )

    except ResourceNotFoundError as err:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": err.message,
                }
            ),
            404,
        )

    except AuthorizationError as err:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": err.message,
                }
            ),
            403,
        )

    except Exception as err:
        current_app.logger.exception(
            f"Unexpected error in get_received_messages: {str(err)}"
        )

        return (
            jsonify(
                {
                    "status": "error",
                    "message": "An unexpected error occurred.",
                }
            ),
            500,
        )


@chat_bp.route("/conversations/<int:user_id>", methods=["GET"])
@jwt_required()
def get_conversation(user_id):
    """
    GET /api/chat/conversations/<user_id>

    Retrieves the conversation history between the logged-in user
    and another user.
    """

    try:
        conversation = get_conversation_service(user_id)

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Conversation retrieved successfully",
                    "data": [
                        {
                            "message_id": message.message_id,
                            "sender_id": message.sender_id,
                            "receiver_id": message.receiver_id,
                            "message": message.message,
                            "is_read": message.is_read,
                            "sent_at": (
                                message.sent_at.isoformat() if message.sent_at else None
                            ),
                        }
                        for message in conversation
                    ],
                }
            ),
            200,
        )

    except ValidationError as err:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": err.message,
                }
            ),
            400,
        )

    except ResourceNotFoundError as err:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": err.message,
                }
            ),
            404,
        )

    except AuthorizationError as err:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": err.message,
                }
            ),
            403,
        )

    except Exception as err:
        current_app.logger.exception(
            f"Unexpected error in get_conversation: {str(err)}"
        )

        return (
            jsonify(
                {
                    "status": "error",
                    "message": "An unexpected error occurred.",
                }
            ),
            500,
        )

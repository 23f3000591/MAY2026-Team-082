from flask import Blueprint, current_app, jsonify
from flask_jwt_extended import jwt_required

from app.services.notification_service import (
    AuthorizationError,
    ResourceNotFoundError,
    get_notifications_service,
    mark_notification_read_service,
    ValidationError,
)

notification_bp = Blueprint(
    "notification",
    __name__,
    url_prefix="/notifications",
)


@notification_bp.route("/", methods=["GET"])
@jwt_required()
def get_notifications():
    """
    GET /api/notifications

    Retrieves all notifications for the logged-in user.
    """

    try:
        notifications = get_notifications_service()

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Notifications retrieved successfully",
                    "data": [
                        {
                            "notification_id": notification.notification_id,
                            "title": notification.title,
                            "message": notification.message,
                            "notification_type": notification.notification_type,
                            "is_read": notification.is_read,
                            "created_at": (
                                notification.created_at.isoformat()
                                if notification.created_at
                                else None
                            ),
                        }
                        for notification in notifications
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
            f"Unexpected error in get_notifications: {str(err)}"
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


@notification_bp.route("/<int:notification_id>/read", methods=["PUT"])
@jwt_required()
def mark_notification_read(notification_id):
    """
    PUT /api/notifications/<notification_id>/read

    Marks a notification as read.
    """

    try:
        notification = mark_notification_read_service(notification_id)

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Notification marked as read",
                    "data": {
                        "notification_id": notification.notification_id,
                        "is_read": notification.is_read,
                    },
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
            f"Unexpected error in mark_notification_read: {str(err)}"
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

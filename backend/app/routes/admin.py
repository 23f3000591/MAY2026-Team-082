from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import jwt_required

from app.services.admin_service import (
    AuthorizationError,
    ResourceNotFoundError,
    ValidationError,
    update_user_suspension_service,
    update_mentor_verification_service,
)

admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/admin",
)


@admin_bp.route("/users/<int:user_id>/suspend", methods=["PATCH"])
@jwt_required()
def update_user_suspension(user_id):
    """
    PATCH /api/admin/users/<user_id>/suspend

    Suspends or unsuspends a user.
    """

    data = request.get_json(silent=True)

    try:
        user = update_user_suspension_service(user_id, data)

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "User suspension status updated successfully.",
                    "data": {
                        "user_id": user.user_id,
                        "is_suspended": user.is_suspended,
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
            f"Unexpected error in update_user_suspension: {str(err)}"
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


@admin_bp.route("/mentors/<int:user_id>/verify", methods=["PATCH"])
@jwt_required()
def update_mentor_verification(user_id):
    """
    PATCH /api/admin/mentors/<user_id>/verify

    Verifies or unverifies a mentor.
    """

    data = request.get_json(silent=True)

    try:
        mentor = update_mentor_verification_service(user_id, data)

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Mentor verification updated successfully.",
                    "data": {
                        "user_id": mentor.user_id,
                        "is_verified": mentor.is_verified,
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
            f"Unexpected error in update_mentor_verification: {str(err)}"
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

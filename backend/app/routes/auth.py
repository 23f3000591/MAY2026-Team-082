from flask import Blueprint, jsonify, request

from app.services.auth_service import (
    DuplicateError,
    ValidationError,
    register_learner_service,
    register_mentor_service,
)

# Blueprint for authentication routes
auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


@auth_bp.route("/register", methods=["POST"])
def register_learner():
    """
    POST /api/auth/register

    Thin route handler to register a new Learner user.
    Delegates all validation and persistence logic to auth_service.
    """
    data = request.get_json(silent=True)

    try:
        user = register_learner_service(data)
        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Learner registered successfully",
                    "data": {
                        "user_id": user.user_id,
                        "full_name": user.full_name,
                        "email": user.email,
                        "phone_number": user.phone_number,
                        "society_id": user.society_id,
                        "role": user.role,
                        "is_learner": user.is_learner,
                        "is_mentor": user.is_mentor,
                        "is_verified": user.is_verified,
                        "created_at": (
                            user.created_at.isoformat() if user.created_at else None
                        ),
                    },
                }
            ),
            201,
        )

    except ValidationError as err:
        return jsonify({"status": "error", "message": err.message}), 400

    except DuplicateError as err:
        return jsonify({"status": "error", "message": err.message}), 409

    except Exception:
        return (
            jsonify({"status": "error", "message": "An unexpected error occurred."}),
            500,
        )


@auth_bp.route("/register/mentor", methods=["POST"])
def register_mentor():
    """
    POST /api/auth/register/mentor

    Thin route handler to register a new Mentor user.
    Delegates all validation and persistence logic to auth_service.
    """
    data = request.get_json(silent=True)

    try:
        user = register_mentor_service(data)
        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Mentor registered successfully",
                    "data": {
                        "user_id": user.user_id,
                        "full_name": user.full_name,
                        "email": user.email,
                        "phone_number": user.phone_number,
                        "society_id": user.society_id,
                        "role": user.role,
                        "is_learner": user.is_learner,
                        "is_mentor": user.is_mentor,
                        "is_verified": user.is_verified,
                        "created_at": (
                            user.created_at.isoformat() if user.created_at else None
                        ),
                    },
                }
            ),
            201,
        )

    except ValidationError as err:
        return jsonify({"status": "error", "message": err.message}), 400

    except DuplicateError as err:
        return jsonify({"status": "error", "message": err.message}), 409

    except Exception:
        return (
            jsonify({"status": "error", "message": "An unexpected error occurred."}),
            500,
        )

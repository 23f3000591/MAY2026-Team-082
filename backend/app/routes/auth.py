from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt, jwt_required

from app.services.auth_service import (
    AuthenticationError,
    DuplicateError,
    ValidationError,
    login_user_service,
    logout_user_service,
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

    except Exception as err:
        current_app.logger.exception(
            f"Unexpected error in register_learner: {str(err)}"
        )
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

    except Exception as err:
        current_app.logger.exception(f"Unexpected error in register_mentor: {str(err)}")
        return (
            jsonify({"status": "error", "message": "An unexpected error occurred."}),
            500,
        )


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    POST /api/auth/login

    Thin route handler to authenticate user credentials and issue JWT access token.
    Delegates validation, password checking, and token generation to auth_service.
    """
    data = request.get_json(silent=True)

    try:
        user, access_token = login_user_service(data)
        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Login successful",
                    "access_token": access_token,
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
            200,
        )

    except ValidationError as err:
        return jsonify({"status": "error", "message": err.message}), 400

    except AuthenticationError as err:
        return jsonify({"status": "error", "message": err.message}), 401

    except Exception as err:
        current_app.logger.exception(f"Unexpected error in login: {str(err)}")
        return (
            jsonify({"status": "error", "message": "An unexpected error occurred."}),
            500,
        )


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """
    POST /api/auth/logout

    Thin route handler to revoke the current JWT access token.
    Requires a valid Bearer token in the Authorization header.
    """
    try:
        jwt_payload = get_jwt()
        logout_user_service(jwt_payload)
        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Successfully logged out",
                }
            ),
            200,
        )
    except Exception as err:
        current_app.logger.exception(f"Unexpected error in logout: {str(err)}")
        return (
            jsonify({"status": "error", "message": "An unexpected error occurred."}),
            500,
        )

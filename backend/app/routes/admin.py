from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import jwt_required

from app.services.admin_service import (
    AuthorizationError,
    ResourceNotFoundError,
    ValidationError,
    update_user_suspension_service,
    update_mentor_verification_service,
    get_users_service,
    get_user_details_service,
    get_reports_service,
    get_report_details_service,
    resolve_report_service,
    dismiss_report_service,
    get_platform_activity_service,
)

admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/admin",
)


@admin_bp.route("/users", methods=["GET"])
@jwt_required()
def get_users():
    """
    GET /api/admin/users

    # Test/admin functionality: retrieve users with optional search and filters.
    """

    try:
        users = get_users_service(request.args)

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Users retrieved successfully.",
                    "data": [
                        {
                            "user_id": user.user_id,
                            "full_name": user.full_name,
                            "email": user.email,
                            "phone_number": user.phone_number,
                            "role": user.role,
                            "is_mentor": user.is_mentor,
                            "is_learner": user.is_learner,
                            "is_verified": user.is_verified,
                            "is_suspended": user.is_suspended,
                            "created_at": (
                                user.created_at.isoformat() if user.created_at else None
                            ),
                        }
                        for user in users
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
        current_app.logger.exception(f"Unexpected error in get_users: {str(err)}")

        return (
            jsonify(
                {
                    "status": "error",
                    "message": "An unexpected error occurred.",
                }
            ),
            500,
        )


@admin_bp.route("/users/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user_details(user_id):
    """
    GET /api/admin/users/<user_id>

    Returns complete details of a user for admin view.
    """

    try:
        user = get_user_details_service(user_id)

        return (
            jsonify(
                {
                    "status": "success",
                    "data": {
                        "user_id": user.user_id,
                        "society_id": user.society_id,
                        "full_name": user.full_name,
                        "email": user.email,
                        "phone_number": user.phone_number,
                        "bio": user.bio,
                        "profile_image": user.profile_image,
                        "role": user.role,
                        "is_mentor": user.is_mentor,
                        "is_learner": user.is_learner,
                        "is_verified": user.is_verified,
                        "is_suspended": user.is_suspended,
                        "created_at": user.created_at,
                        "updated_at": user.updated_at,
                    },
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
            f"Unexpected error in get_user_details: {str(err)}"
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


@admin_bp.route("/reports", methods=["GET"])
@jwt_required()
def get_reports():
    """
    GET /api/admin/reports

    Returns reports for admin review.
    """

    try:
        reports = get_reports_service(request.args)

        return (
            jsonify(
                {
                    "status": "success",
                    "data": [
                        {
                            "report_id": report.report_id,
                            "reported_by": report.reported_by,
                            "reported_user": report.reported_user,
                            "reason": report.reason,
                            "status": report.status,
                            "created_at": report.created_at.isoformat(),
                        }
                        for report in reports
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
        current_app.logger.exception(f"Unexpected error in get_reports: {str(err)}")

        return (
            jsonify(
                {
                    "status": "error",
                    "message": "An unexpected error occurred.",
                }
            ),
            500,
        )


@admin_bp.route("/reports/<int:report_id>", methods=["GET"])
@jwt_required()
def get_report_details(report_id):
    """
    GET /api/admin/reports/<report_id>

    Returns complete details of a report.
    """

    try:
        report = get_report_details_service(report_id)

        return (
            jsonify(
                {
                    "status": "success",
                    "data": {
                        "report_id": report.report_id,
                        "reported_by": report.reported_by,
                        "reported_user": report.reported_user,
                        "reason": report.reason,
                        "description": report.description,
                        "status": report.status,
                        "resolved_by": report.resolved_by,
                        "created_at": report.created_at.isoformat(),
                        "resolved_at": (
                            report.resolved_at.isoformat()
                            if report.resolved_at
                            else None
                        ),
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
            f"Unexpected error in get_report_details: {str(err)}"
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


@admin_bp.route("/reports/<int:report_id>/resolve", methods=["PATCH"])
@jwt_required()
def resolve_report(report_id):
    """
    PATCH /api/admin/reports/<report_id>/resolve

    Resolves a pending report with an optional admin remark.
    """

    try:
        data = request.get_json(silent=True)
        report = resolve_report_service(report_id, data)

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Report resolved successfully.",
                    "data": {
                        "report_id": report.report_id,
                        "status": report.status,
                        "description": report.description,
                        "resolved_by": report.resolved_by,
                        "resolved_at": report.resolved_at.isoformat(),
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
        current_app.logger.exception(f"Unexpected error in resolve_report: {str(err)}")

        return (
            jsonify(
                {
                    "status": "error",
                    "message": "An unexpected error occurred.",
                }
            ),
            500,
        )


@admin_bp.route("/reports/<int:report_id>/dismiss", methods=["PATCH"])
@jwt_required()
def dismiss_report(report_id):
    """
    PATCH /api/admin/reports/<report_id>/dismiss

    Dismisses a pending report with an optional admin remark.
    """

    try:
        data = request.get_json(silent=True)
        report = dismiss_report_service(report_id, data)

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Report dismissed successfully.",
                    "data": {
                        "report_id": report.report_id,
                        "status": report.status,
                        "description": report.description,
                        "resolved_by": report.resolved_by,
                        "resolved_at": report.resolved_at.isoformat(),
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
        current_app.logger.exception(f"Unexpected error in dismiss_report: {str(err)}")

        return (
            jsonify(
                {
                    "status": "error",
                    "message": "An unexpected error occurred.",
                }
            ),
            500,
        )


@admin_bp.route("/activity", methods=["GET"])
@jwt_required()
def get_platform_activity():
    """
    GET /api/admin/activity

    Returns platform statistics and recent meaningful activity
    for the admin dashboard.
    """

    try:
        activity = get_platform_activity_service()

        return (
            jsonify(
                {
                    "status": "success",
                    "data": activity,
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
            f"Unexpected error in get_platform_activity: {str(err)}"
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

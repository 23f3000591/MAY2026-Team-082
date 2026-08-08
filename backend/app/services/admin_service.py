from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models.user import User
from app.models.report import Report
from datetime import datetime
from app.services.notification_service import (
    create_notification_service,
    NOTIFICATION_TYPE_ADMIN,
    NOTIFICATION_TYPE_VERIFICATION,
)


class ValidationError(Exception):
    """Raised when request validation fails."""

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


def get_users_service(filters):
    """
    Retrieves users for the admin dashboard with optional search and filters.
    """

    admin_id = int(get_jwt_identity())

    admin = db.session.get(User, admin_id)

    if not admin:
        raise ResourceNotFoundError("Admin not found.")

    if admin.role != "admin":
        raise AuthorizationError("Only administrators can view users.")

    query = User.query

    search = filters.get("search")
    user_id = filters.get("user_id")
    role = filters.get("role")
    is_verified = filters.get("is_verified")
    is_suspended = filters.get("is_suspended")

    if search:
        search = search.strip()

        query = query.filter(
            db.or_(
                User.full_name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
            )
        )

    if user_id:
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            raise ValidationError("user_id must be a valid integer.")

        query = query.filter(User.user_id == user_id)

    if role:
        role = role.lower()

        if role not in ["admin", "mentor", "learner"]:
            raise ValidationError("role must be admin, mentor, or learner.")

        if role == "mentor":
            query = query.filter(User.is_mentor.is_(True))
        elif role == "learner":
            query = query.filter(User.is_learner.is_(True))
        else:
            query = query.filter(User.role == "admin")

    if is_verified is not None:
        if is_verified.lower() not in ["true", "false"]:
            raise ValidationError("is_verified must be true or false.")

        query = query.filter(User.is_verified.is_(is_verified.lower() == "true"))

    if is_suspended is not None:
        if is_suspended.lower() not in ["true", "false"]:
            raise ValidationError("is_suspended must be true or false.")

        query = query.filter(User.is_suspended.is_(is_suspended.lower() == "true"))

    return query.order_by(User.user_id.asc()).all()


def get_user_details_service(user_id):
    """
    Returns complete details of a user for admin view.
    """

    admin_id = int(get_jwt_identity())

    admin = db.session.get(User, admin_id)

    if not admin:
        raise ResourceNotFoundError("Admin not found.")

    if admin.role != "admin":
        raise AuthorizationError("Only administrators can view user details.")

    user = db.session.get(User, user_id)

    if not user:
        raise ResourceNotFoundError("User not found.")

    return user


def update_user_suspension_service(user_id, data):
    """
    Suspends or unsuspends a user.
    """

    if data is None or not isinstance(data, dict):
        raise ValidationError("Request body must be a valid JSON object.")

    if "is_suspended" not in data:
        raise ValidationError("is_suspended field is required.")

    is_suspended = data.get("is_suspended")

    if not isinstance(is_suspended, bool):
        raise ValidationError("is_suspended must be a boolean.")

    admin_id = int(get_jwt_identity())

    admin = db.session.get(User, admin_id)

    if not admin:
        raise ResourceNotFoundError("Admin not found.")

    if admin.role != "admin":
        raise AuthorizationError(
            "Only administrators can update user suspension status."
        )

    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        raise ValidationError("user_id must be a valid integer.")

    user = db.session.get(User, user_id)

    if not user:
        raise ResourceNotFoundError("User not found.")

    if user.user_id == admin.user_id:
        raise ValidationError("Administrators cannot suspend their own account.")

    if user.is_suspended == is_suspended:
        state = "suspended" if is_suspended else "active"
        raise ValidationError(f"User is already {state}.")

    user.is_suspended = is_suspended

    db.session.commit()

    if is_suspended:
        create_notification_service(
            user_id=user.user_id,
            title="Account Suspended",
            message="Your account has been suspended by the administrator.",
            notification_type=NOTIFICATION_TYPE_ADMIN,
        )
    else:
        create_notification_service(
            user_id=user.user_id,
            title="Account Reactivated",
            message="Your account has been reactivated by the administrator.",
            notification_type=NOTIFICATION_TYPE_ADMIN,
        )

    return user


def update_mentor_verification_service(user_id, data):
    """
    Verifies or unverifies a mentor.
    """

    if data is None or not isinstance(data, dict):
        raise ValidationError("Request body must be a valid JSON object.")

    if "is_verified" not in data:
        raise ValidationError("is_verified field is required.")

    is_verified = data.get("is_verified")

    if not isinstance(is_verified, bool):
        raise ValidationError("is_verified must be a boolean.")

    admin_id = int(get_jwt_identity())

    admin = db.session.get(User, admin_id)

    if not admin:
        raise ResourceNotFoundError("Admin not found.")

    if admin.role != "admin":
        raise AuthorizationError("Only administrators can update mentor verification.")

    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        raise ValidationError("user_id must be a valid integer.")

    mentor = db.session.get(User, user_id)

    if not mentor:
        raise ResourceNotFoundError("User not found.")

    if admin.user_id == mentor.user_id:
        raise ValidationError("Administrators cannot verify themselves.")

    if not mentor.is_mentor:
        raise ValidationError("Selected user is not a mentor.")

    if mentor.is_verified == is_verified:
        state = "verified" if is_verified else "unverified"
        raise ValidationError(f"Mentor is already {state}.")

    mentor.is_verified = is_verified

    db.session.commit()

    if is_verified:
        create_notification_service(
            user_id=mentor.user_id,
            title="Mentor Verified",
            message="Congratulations! Your mentor account has been verified.",
            notification_type=NOTIFICATION_TYPE_VERIFICATION,
        )
    else:
        create_notification_service(
            user_id=mentor.user_id,
            title="Mentor Verification Removed",
            message="Your mentor verification has been removed by the administrator.",
            notification_type=NOTIFICATION_TYPE_VERIFICATION,
        )

    return mentor


def get_reports_service(args):
    """
    Returns reports for admin review with optional filters.
    """

    admin_id = int(get_jwt_identity())

    admin = db.session.get(User, admin_id)

    if not admin:
        raise ResourceNotFoundError("Admin not found.")

    if admin.role != "admin":
        raise AuthorizationError("Only administrators can view reports.")

    query = Report.query

    status = args.get("status")
    reported_user = args.get("reported_user")
    reported_by = args.get("reported_by")
    reason = args.get("reason")

    if status:
        allowed_statuses = {"Pending", "Resolved", "Dismissed"}

        if status not in allowed_statuses:
            raise ValidationError("status must be Pending, Resolved, or Dismissed.")

        query = query.filter(Report.status == status)

    if reported_user:
        try:
            reported_user = int(reported_user)
        except (ValueError, TypeError):
            raise ValidationError("reported_user must be a valid integer.")

        query = query.filter(Report.reported_user == reported_user)

    if reported_by:
        try:
            reported_by = int(reported_by)
        except (ValueError, TypeError):
            raise ValidationError("reported_by must be a valid integer.")

        query = query.filter(Report.reported_by == reported_by)

    if reason:
        query = query.filter(Report.reason.ilike(f"%{reason}%"))

    reports = query.order_by(Report.created_at.desc()).all()

    return reports


def get_report_details_service(report_id):
    """
    Returns complete details of a report for admin review.
    """

    admin_id = int(get_jwt_identity())

    admin = db.session.get(User, admin_id)

    if not admin:
        raise ResourceNotFoundError("Admin not found.")

    if admin.role != "admin":
        raise AuthorizationError("Only administrators can view reports.")

    try:
        report_id = int(report_id)
    except (ValueError, TypeError):
        raise ValidationError("report_id must be a valid integer.")

    report = db.session.get(Report, report_id)

    if not report:
        raise ResourceNotFoundError("Report not found.")

    return report


def resolve_report_service(report_id, data=None):
    """
    Resolves a pending report and optionally stores an admin remark.
    """

    admin_id = int(get_jwt_identity())

    admin = db.session.get(User, admin_id)

    if not admin:
        raise ResourceNotFoundError("Admin not found.")

    if admin.role != "admin":
        raise AuthorizationError("Only administrators can resolve reports.")

    try:
        report_id = int(report_id)
    except (ValueError, TypeError):
        raise ValidationError("report_id must be a valid integer.")

    report = db.session.get(Report, report_id)

    if not report:
        raise ResourceNotFoundError("Report not found.")

    if report.status != "Pending":
        raise ValidationError(f"Report is already {report.status.lower()}.")

    if data is not None and not isinstance(data, dict):
        raise ValidationError("Request body must be a valid JSON object.")

    if data and "description" in data:
        description = data.get("description")

        if description is not None and not isinstance(description, str):
            raise ValidationError("description must be a string.")

        report.description = description.strip() if description else None

    report.status = "Resolved"
    report.resolved_by = admin.user_id
    report.resolved_at = datetime.utcnow()

    db.session.commit()

    create_notification_service(
        user_id=report.reported_user,
        title="Report Reviewed",
        message="Your reported case has been reviewed and resolved by an administrator.",
        notification_type=NOTIFICATION_TYPE_ADMIN,
    )

    return report


def dismiss_report_service(report_id, data=None):
    """
    Dismisses a pending report and optionally stores an admin remark.
    """

    admin_id = int(get_jwt_identity())

    admin = db.session.get(User, admin_id)

    if not admin:
        raise ResourceNotFoundError("Admin not found.")

    if admin.role != "admin":
        raise AuthorizationError("Only administrators can dismiss reports.")

    try:
        report_id = int(report_id)
    except (ValueError, TypeError):
        raise ValidationError("report_id must be a valid integer.")

    report = db.session.get(Report, report_id)

    if not report:
        raise ResourceNotFoundError("Report not found.")

    if report.status != "Pending":
        raise ValidationError(f"Report is already {report.status.lower()}.")

    if data is not None and not isinstance(data, dict):
        raise ValidationError("Request body must be a valid JSON object.")

    if data and "description" in data:
        description = data.get("description")

        if description is not None and not isinstance(description, str):
            raise ValidationError("description must be a string.")

        report.description = description.strip() if description else None

    report.status = "Dismissed"
    report.resolved_by = admin.user_id
    report.resolved_at = datetime.utcnow()

    db.session.commit()

    create_notification_service(
        user_id=report.reported_user,
        title="Report Dismissed",
        message="Your reported case has been reviewed and dismissed by an administrator.",
        notification_type=NOTIFICATION_TYPE_ADMIN,
    )

    return report

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import jwt_required

from app.models.review import Review
from app.services.session_service import (
    ValidationError,
    book_session_service,
    accept_booking_service,
    reject_booking_service,
    cancel_booking_service,
    complete_session_service,
    reschedule_session_service,
    get_booking_history_service,
)

# Blueprint for session booking routes
session_bp = Blueprint(
    "session",
    __name__,
    url_prefix="/sessions",
)


def _serialize_session(session):
    return {
        "session_id": session.session_id,
        "learner_id": session.learner_id,
        "learner_name": session.learner.full_name if session.learner else None,
        "learner_email": session.learner.email if session.learner else None,
        "mentor_id": session.mentor_id,
        "mentor_name": session.mentor.full_name if session.mentor else None,
        "mentor_email": session.mentor.email if session.mentor else None,
        "skill_id": session.skill_id,
        "skill_name": session.skill.skill_name if session.skill else None,
        "skill_category": session.skill.category if session.skill else None,
        "availability_id": session.availability_id,
        "time_slot": (
            f"{session.availability.day_of_week}, {session.availability.start_time.strftime('%H:%M')} - {session.availability.end_time.strftime('%H:%M')}"
            if session.availability
            else None
        ),
        "session_mode": session.session_mode,
        "session_date": session.session_date.isoformat(),
        "meeting_link": session.meeting_link,
        "location": session.location,
        "status": session.status,
        "learner_note": session.learner_note,
        "has_review": Review.query.filter_by(
            session_id=session.session_id,
            learner_id=session.learner_id,
        ).first() is not None,
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "updated_at": session.updated_at.isoformat() if session.updated_at else None,
    }


# Endpoint for booking a session
@session_bp.route("/", methods=["POST"])
@jwt_required()
def book_session():
    """
    POST /api/sessions

    Creates a new session booking request.
    """

    data = request.get_json(silent=True)

    try:
        session = book_session_service(data)

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Booking request sent successfully",
                    "data": _serialize_session(session),
                }
            ),
            201,
        )

    except ValidationError as err:
        return jsonify({"status": "error", "message": err.message}), 400

    except Exception as err:
        current_app.logger.exception(f"Unexpected error in book_session: {str(err)}")
        return (
            jsonify({"status": "error", "message": "An unexpected error occurred."}),
            500,
        )


# Endpoint for accepting a booking request
@session_bp.route("/<int:session_id>/accept", methods=["PUT"])
@jwt_required()
def accept_booking(session_id):
    """
    PUT /api/sessions/<session_id>/accept

    Mentor accepts a pending booking request.
    """

    try:
        session = accept_booking_service(session_id)

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Booking accepted successfully",
                    "data": _serialize_session(session),
                }
            ),
            200,
        )

    except ValidationError as err:
        return jsonify({"status": "error", "message": err.message}), 400

    except Exception as err:
        current_app.logger.exception(f"Unexpected error in accept_booking: {str(err)}")
        return (
            jsonify({"status": "error", "message": "An unexpected error occurred."}),
            500,
        )


# Endpoint for rejecting a booking request
@session_bp.route("/<int:session_id>/reject", methods=["PUT"])
@jwt_required()
def reject_booking(session_id):
    """
    PUT /api/sessions/<session_id>/reject

    Mentor rejects a pending booking request.
    """

    try:
        session = reject_booking_service(session_id)

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Booking rejected successfully",
                    "data": _serialize_session(session),
                }
            ),
            200,
        )

    except ValidationError as err:
        return jsonify({"status": "error", "message": err.message}), 400

    except Exception as err:
        current_app.logger.exception(f"Unexpected error in reject_booking: {str(err)}")
        return (
            jsonify({"status": "error", "message": "An unexpected error occurred."}),
            500,
        )


# Endpoint for cancelling a booking
@session_bp.route("/<int:session_id>/cancel", methods=["PUT"])
@jwt_required()
def cancel_booking(session_id):
    """
    PUT /api/sessions/<session_id>/cancel

    Learner or mentor cancels an active booking.
    """

    try:
        session = cancel_booking_service(session_id)

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Booking cancelled successfully",
                    "data": _serialize_session(session),
                }
            ),
            200,
        )

    except ValidationError as err:
        return jsonify({"status": "error", "message": err.message}), 400

    except Exception as err:
        current_app.logger.exception(f"Unexpected error in cancel_booking: {str(err)}")
        return (
            jsonify({"status": "error", "message": "An unexpected error occurred."}),
            500,
        )


# Endpoint for completing a session
@session_bp.route("/<int:session_id>/complete", methods=["PUT"])
@jwt_required()
def complete_session(session_id):
    """
    PUT /api/sessions/<session_id>/complete

    Mentor marks a session as completed.
    """
    try:
        session = complete_session_service(session_id)
        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Session marked as completed successfully",
                    "data": _serialize_session(session),
                }
            ),
            200,
        )
    except ValidationError as err:
        return jsonify({"status": "error", "message": err.message}), 400
    except Exception as err:
        current_app.logger.exception(f"Unexpected error in complete_session: {str(err)}")
        return (
            jsonify({"status": "error", "message": "An unexpected error occurred."}),
            500,
        )


# Endpoint for rescheduling a session
@session_bp.route("/<int:session_id>/reschedule", methods=["PUT"])
@jwt_required()
def reschedule_session(session_id):
    """
    PUT /api/sessions/<session_id>/reschedule

    Learner or mentor reschedules an active session.
    """

    data = request.get_json(silent=True)

    try:
        session = reschedule_session_service(session_id, data)

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Session rescheduled successfully",
                    "data": _serialize_session(session),
                }
            ),
            200,
        )

    except ValidationError as err:
        return jsonify({"status": "error", "message": err.message}), 400

    except Exception as err:
        current_app.logger.exception(
            f"Unexpected error in reschedule_session: {str(err)}"
        )
        return (
            jsonify({"status": "error", "message": "An unexpected error occurred."}),
            500,
        )


# Endpoint for viewing booking history
@session_bp.route("/history", methods=["GET"])
@jwt_required()
def view_booking_history():
    """
    GET /api/sessions/history?status=<status>

    Returns the logged-in user's full booking history, optionally
    filtered by status (Pending, Accepted, Rejected, Cancelled).
    """

    status_filter = request.args.get("status")

    try:
        sessions = get_booking_history_service(status_filter)

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Booking history retrieved successfully",
                    "data": [_serialize_session(session) for session in sessions],
                }
            ),
            200,
        )

    except ValidationError as err:
        return jsonify({"status": "error", "message": err.message}), 400

    except Exception as err:
        current_app.logger.exception(
            f"Unexpected error in view_booking_history: {str(err)}"
        )
        return (
            jsonify({"status": "error", "message": "An unexpected error occurred."}),
            500,
        )
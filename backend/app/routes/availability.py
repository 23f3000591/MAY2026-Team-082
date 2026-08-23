from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import jwt_required

from app.services.availability_service import (
    ValidationError,
    set_mentor_availability_service,
    get_available_slots_service,
)

# Blueprint for availability routes
availability_bp = Blueprint(
    "availability",
    __name__,
    url_prefix="/availability",
)


# Endpoint for setting mentor availability
@availability_bp.route("/", methods=["POST"])
@jwt_required()
def set_mentor_availability():
    """
    POST /api/availability

    Creates an availability slot for the logged-in mentor.
    """

    data = request.get_json(silent=True)

    try:
        availability = set_mentor_availability_service(data)

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Availability slot added successfully",
                    "data": {
                        "availability_id": availability.availability_id,
                        "user_id": availability.user_id,
                        "day_of_week": availability.day_of_week,
                        "start_time": availability.start_time.strftime("%H:%M"),
                        "end_time": availability.end_time.strftime("%H:%M"),
                    },
                }
            ),
            201,
        )

    except ValidationError as err:
        return jsonify({"status": "error", "message": err.message}), 400

    except Exception as err:
        current_app.logger.exception(
            f"Unexpected error in set_mentor_availability: {str(err)}"
        )
        return (
            jsonify({"status": "error", "message": "An unexpected error occurred."}),
            500,
        )


# Endpoint for viewing a mentor's available slots
@availability_bp.route("/mentor/<int:mentor_id>", methods=["GET"])
@jwt_required()
def view_available_slots(mentor_id):
    """
    GET /api/availability/mentor/<mentor_id>

    Returns all availability slots for the given mentor.
    """

    try:
        slots = get_available_slots_service(mentor_id)

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Available slots retrieved successfully",
                    "data": [
                        {
                            "availability_id": slot.availability_id,
                            "day_of_week": slot.day_of_week,
                            "start_time": slot.start_time.strftime("%H:%M"),
                            "end_time": slot.end_time.strftime("%H:%M"),
                        }
                        for slot in slots
                    ],
                }
            ),
            200,
        )

    except ValidationError as err:
        return jsonify({"status": "error", "message": err.message}), 404

    except Exception as err:
        current_app.logger.exception(
            f"Unexpected error in view_available_slots: {str(err)}"
        )
        return (
            jsonify({"status": "error", "message": "An unexpected error occurred."}),
            500,
        )


# Endpoint for deleting an availability slot
@availability_bp.route("/<int:availability_id>", methods=["DELETE"])
@jwt_required()
def delete_availability(availability_id):
    """
    DELETE /api/availability/<availability_id>

    Deletes an availability slot owned by the logged-in mentor.
    """
    from flask_jwt_extended import get_jwt_identity
    from app.models.availability import Availability
    from app.models.session import Session
    from app.extensions import db

    user_id = int(get_jwt_identity())
    slot = db.session.get(Availability, availability_id)

    if not slot:
        return jsonify({"status": "error", "message": "Availability slot not found."}), 404

    if slot.user_id != user_id:
        return jsonify({"status": "error", "message": "You can only delete your own availability slots."}), 403

    try:
        # If there are old cancelled or rejected sessions referencing this slot, unlink or clear them
        Session.query.filter_by(availability_id=availability_id).filter(Session.status.in_(["Cancelled", "Rejected"])).update({"availability_id": None}, synchronize_session=False)

        # Check if there are active bookings
        active_sessions = Session.query.filter_by(availability_id=availability_id).filter(Session.status.in_(["Pending", "Accepted", "Confirmed"])).first()
        if active_sessions:
            return jsonify({"status": "error", "message": "Cannot delete slot with active or pending bookings."}), 400

        # Unlink any other historical sessions before deleting the slot
        Session.query.filter_by(availability_id=availability_id).update({"availability_id": None}, synchronize_session=False)

        db.session.delete(slot)
        db.session.commit()

        return jsonify({"status": "success", "message": "Availability slot deleted successfully."}), 200
    except Exception as err:
        db.session.rollback()
        current_app.logger.exception(f"Unexpected error in delete_availability: {str(err)}")
        return jsonify({"status": "error", "message": "Failed to delete slot."}), 500
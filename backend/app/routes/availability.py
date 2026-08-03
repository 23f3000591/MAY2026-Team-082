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
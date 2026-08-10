from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import jwt_required

from app.services.review_service import (
    AuthorizationError,
    ConflictError,
    NotFoundError,
    ValidationError,
    rate_mentor_service,
)


review_bp = Blueprint(
    "review",
    __name__,
    url_prefix="/reviews",
)


def _serialize_review(review):
    return {
        "review_id": review.review_id,
        "session_id": review.session_id,
        "learner_id": review.learner_id,
        "mentor_id": review.mentor_id,
        "rating": review.rating,
        "review_text": review.review_text,
        "created_at": (
            review.created_at.isoformat()
            if review.created_at
            else None
        ),
    }


@review_bp.route("/", methods=["POST"])
@jwt_required()
def rate_mentor():
    """
    POST /api/reviews/

    Allows an authenticated learner to rate a mentor
    after completing a mentoring session.
    """

    data = request.get_json(silent=True)

    try:
        review = rate_mentor_service(data)

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Mentor rated successfully",
                    "data": _serialize_review(review),
                }
            ),
            201,
        )

    except ValidationError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 400

    except AuthorizationError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 403

    except NotFoundError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 404

    except ConflictError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 409

    except Exception as err:
        current_app.logger.exception(
            f"Unexpected error in rate_mentor: {str(err)}"
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
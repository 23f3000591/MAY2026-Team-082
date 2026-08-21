from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import jwt_required

from app.services.profile_service import (
    ValidationError,
    create_learner_profile_service,
    create_mentor_profile_service,
    edit_profile_service,
    upload_profile_picture_service,
    add_skill_service,
    get_mentor_profile_service,
    get_learner_profile_service,
)

# Blueprint for profile routes
profile_bp = Blueprint(
    "profile",
    __name__,
    url_prefix="/profile",
)

# Endpoint for creating learner profile
@profile_bp.route("/learner", methods=["POST"])
@jwt_required()
def create_learner_profile():
    """
    POST /api/profile/learner

    Creates/completes a learner profile.
    """

    data = request.get_json(silent=True)

    try:
        user = create_learner_profile_service(data)

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Learner profile created successfully",
                    "data": {
                        "user_id": user.user_id,
                        "bio": user.bio,
                        "is_learner": user.is_learner,
                        "is_mentor": user.is_mentor,
                        "updated_at": (
                            user.updated_at.isoformat()
                            if user.updated_at
                            else None
                        ),
                    },
                }
            ),
            200,
        )

    except ValidationError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 400

    except Exception as err:
        current_app.logger.exception(
            f"Unexpected error in create_learner_profile: {str(err)}"
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
        

# Endpoint for creating mentor profile
@profile_bp.route("/mentor", methods=["POST"])
@jwt_required()
def create_mentor_profile():
    """
    POST /api/profile/mentor

    Creates/completes a mentor profile.
    """

    data = request.get_json(silent=True)

    try:
        user = create_mentor_profile_service(data)

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Mentor profile created successfully",
                    "data": {
                        "user_id": user.user_id,
                        "bio": user.bio,
                        "is_learner": user.is_learner,
                        "is_mentor": user.is_mentor,
                        "updated_at": (
                            user.updated_at.isoformat()
                            if user.updated_at
                            else None
                        ),
                    },
                }
            ),
            200,
        )

    except ValidationError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 400

    except Exception as err:
        current_app.logger.exception(
            f"Unexpected error in create_mentor_profile: {str(err)}"
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
        
        
# Endpoint for editing user profile
@profile_bp.route("/", methods=["PUT"])
@jwt_required()
def edit_profile():
    """
    PUT /api/profile

    Updates the profile of the currently logged-in user.
    """

    data = request.get_json(silent=True)

    try:
        user = edit_profile_service(data)

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Profile updated successfully",
                    "data": {
                        "user_id": user.user_id,
                        "bio": user.bio,
                        "is_learner": user.is_learner,
                        "is_mentor": user.is_mentor,
                        "updated_at": (
                            user.updated_at.isoformat()
                            if user.updated_at
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

    except Exception as err:
        current_app.logger.exception(
            f"Unexpected error in edit_profile: {str(err)}"
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
        
        
# Endpoint for uploading profile picture
@profile_bp.route("/picture", methods=["PUT"])
@jwt_required()
def upload_profile_picture():
    """
    PUT /api/profile/picture

    Updates the profile picture.
    """

    data = request.get_json(silent=True)

    try:
        user = upload_profile_picture_service(data)

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Profile picture updated successfully",
                    "data": {
                        "user_id": user.user_id,
                        "profile_image": user.profile_image,
                    },
                }
            ),
            200,
        )

    except ValidationError as err:
        return jsonify(
            {
                "status": "error",
                "message": err.message,
            }
        ), 400

    except Exception as err:
        current_app.logger.exception(
            f"Unexpected error in upload_profile_picture: {str(err)}"
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
        
        
# Endpoint for adding a skill to the user's profile
@profile_bp.route("/skills", methods=["POST"])
@jwt_required()
def add_skill():
    """
    POST /api/profile/skills

    Adds a skill to the logged-in user's profile.
    """

    data = request.get_json(silent=True)

    try:
        user_skill = add_skill_service(data)

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Skill added successfully",
                    "data": {
                        "user_skill_id": user_skill.user_skill_id,
                        "user_id": user_skill.user_id,
                        "skill_id": user_skill.skill_id,
                        "experience_level": user_skill.experience_level,
                        "years_of_experience": user_skill.years_of_experience,
                        "description": user_skill.description,
                    },
                }
            ),
            201,
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

    except Exception as err:
        current_app.logger.exception(
            f"Unexpected error in add_skill: {str(err)}"
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
        
        
# Endpoint for viewing a mentor's profile
@profile_bp.route("/mentor/<int:user_id>", methods=["GET"])
@jwt_required()
def view_mentor_profile(user_id):
    """
    GET /api/profile/mentor/<user_id>

    Returns the public profile of a mentor, including skills
    and review summary.
    """

    try:
        profile_data = get_mentor_profile_service(user_id)

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Mentor profile retrieved successfully",
                    "data": profile_data,
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
            404,
        )

    except Exception as err:
        current_app.logger.exception(
            f"Unexpected error in view_mentor_profile: {str(err)}"
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


# Endpoint for viewing a learner's profile
@profile_bp.route("/learner/<int:user_id>", methods=["GET"])
@jwt_required()
def view_learner_profile(user_id):
    """
    GET /api/profile/learner/<user_id>

    Returns the public profile of a learner, including skills.
    """

    try:
        profile_data = get_learner_profile_service(user_id)

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Learner profile retrieved successfully",
                    "data": profile_data,
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
            404,
        )

    except Exception as err:
        current_app.logger.exception(
            f"Unexpected error in view_learner_profile: {str(err)}"
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
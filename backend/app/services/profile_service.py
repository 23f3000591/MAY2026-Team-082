from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models.user import User
from app.models.skill import Skill
from app.models.user_skill import UserSkill

class ValidationError(Exception):
    """Raised when profile validation fails."""

    def __init__(self, message):
        self.message = message
        super().__init__(message)

# Service functions for profile management
def create_learner_profile_service(data):
    """
    Completes learner profile.
    """

    if data is None or not isinstance(data, dict):
        raise ValidationError("Request body must be a valid JSON object.")

    bio = data.get("bio")

    if bio is None or not str(bio).strip():
        raise ValidationError("Bio is required.")

    bio = str(bio).strip()

    if len(bio) > 1000:
        raise ValidationError("Bio cannot exceed 1000 characters.")

    user_id = int(get_jwt_identity())

    user = db.session.get(User, user_id)

    if user is None:
        raise ValidationError("User not found.")

    user.bio = bio
    user.is_learner = True

    db.session.commit()

    return user


# Service function for creating mentor profile
def create_mentor_profile_service(data):
    """
    Completes mentor profile.
    """

    if data is None or not isinstance(data, dict):
        raise ValidationError("Request body must be a valid JSON object.")

    bio = data.get("bio")

    if bio is None or not str(bio).strip():
        raise ValidationError("Bio is required.")

    bio = str(bio).strip()

    if len(bio) > 1000:
        raise ValidationError("Bio cannot exceed 1000 characters.")

    user_id = int(get_jwt_identity())

    user = db.session.get(User, user_id)

    if user is None:
        raise ValidationError("User not found.")

    user.bio = bio
    user.is_mentor = True

    db.session.commit()

    return user


# Service function for editing profile
def edit_profile_service(data):
    """
    Updates the profile of the currently logged-in user.
    """

    if data is None or not isinstance(data, dict):
        raise ValidationError("Request body must be a valid JSON object.")

    user_id = int(get_jwt_identity())

    user = db.session.get(User, user_id)

    if user is None:
        raise ValidationError("User not found.")

    # Update bio if provided
    if "bio" in data:
        bio = str(data.get("bio", "")).strip()

        if not bio:
            raise ValidationError("Bio cannot be empty.")

        if len(bio) > 1000:
            raise ValidationError("Bio cannot exceed 1000 characters.")

        user.bio = bio

    db.session.commit()

    return user


# Service function for uploading profile picture
def upload_profile_picture_service(data):
    """
    Updates the profile picture URL of the logged-in user.
    """

    if data is None or not isinstance(data, dict):
        raise ValidationError("Request body must be a valid JSON object.")

    profile_image = data.get("profile_image")

    if profile_image is None or not str(profile_image).strip():
        raise ValidationError("Profile image is required.")

    user_id = int(get_jwt_identity())

    user = db.session.get(User, user_id)

    if user is None:
        raise ValidationError("User not found.")

    user.profile_image = str(profile_image).strip()

    db.session.commit()

    return user


# Service function for adding a skill to the user's profile
def add_skill_service(data):
    """
    Adds an existing skill to the logged-in user's profile.
    """

    if data is None or not isinstance(data, dict):
        raise ValidationError("Request body must be a valid JSON object.")

    skill_id = data.get("skill_id")
    experience_level = data.get("experience_level")
    years_of_experience = data.get("years_of_experience")
    description = data.get("description")

    missing_fields = []

    if skill_id is None:
        missing_fields.append("skill_id")

    if not experience_level or not str(experience_level).strip():
        missing_fields.append("experience_level")

    if missing_fields:
        raise ValidationError(
            f"Missing or invalid required fields: {', '.join(missing_fields)}"
        )

    try:
        skill_id = int(skill_id)
    except (ValueError, TypeError):
        raise ValidationError("skill_id must be a valid integer.")

    user_id = int(get_jwt_identity())

    user = db.session.get(User, user_id)

    if not user:
        raise ValidationError("User not found.")

    skill = db.session.get(Skill, skill_id)

    if not skill:
        raise ValidationError("Skill not found.")

    existing_skill = UserSkill.query.filter_by(
        user_id=user_id,
        skill_id=skill_id,
    ).first()

    if existing_skill:
        raise ValidationError("Skill already added to profile.")

    user_skill = UserSkill(
        user_id=user_id,
        skill_id=skill_id,
        experience_level=str(experience_level).strip(),
        years_of_experience=years_of_experience,
        description=description,
    )

    db.session.add(user_skill)
    db.session.commit()

    return user_skill
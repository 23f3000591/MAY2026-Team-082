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

    # Update full_name if provided
    if "full_name" in data and str(data.get("full_name", "")).strip():
        user.full_name = str(data.get("full_name")).strip()

    # Update bio if provided
    if "bio" in data:
        bio = str(data.get("bio", "")).strip()
        if len(bio) > 1000:
            raise ValidationError("Bio cannot exceed 1000 characters.")
        user.bio = bio

    # Update location / society if provided
    if "location" in data and str(data.get("location", "")).strip():
        loc_str = str(data.get("location")).strip()
        if user.society:
            user.society.society_name = loc_str
            user.society.city = loc_str

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
    skill_name = data.get("skill_name")
    category = data.get("category", "General")
    experience_level = data.get("experience_level")
    years_of_experience = data.get("years_of_experience")
    description = data.get("description")

    missing_fields = []

    if skill_id is None and not skill_name:
        missing_fields.append("skill_id or skill_name")

    if not experience_level or not str(experience_level).strip():
        missing_fields.append("experience_level")

    if missing_fields:
        raise ValidationError(
            f"Missing or invalid required fields: {', '.join(missing_fields)}"
        )

    skill = None
    if skill_id is not None:
        try:
            skill_int_id = int(skill_id)
            skill = db.session.get(Skill, skill_int_id)
        except (ValueError, TypeError):
            pass

    if not skill:
        skill_name_str = str(skill_name or skill_id).strip()
        skill = Skill.query.filter(Skill.skill_name.ilike(skill_name_str)).first()
        if not skill:
            # Dynamically create skill with user-chosen category
            cat_str = str(category).strip() if category else "General"
            skill = Skill(skill_name=skill_name_str, category=cat_str)
            db.session.add(skill)
            db.session.flush()

    user_id = int(get_jwt_identity())

    user = db.session.get(User, user_id)

    if not user:
        raise ValidationError("User not found.")

    existing_skill = UserSkill.query.filter_by(
        user_id=user_id,
        skill_id=skill.skill_id,
    ).first()

    if existing_skill:
        existing_skill.experience_level = str(experience_level).strip()
        existing_skill.years_of_experience = years_of_experience
        existing_skill.description = description
        db.session.commit()
        return existing_skill

    user_skill = UserSkill(
        user_id=user_id,
        skill_id=skill.skill_id,
        experience_level=str(experience_level).strip(),
        years_of_experience=years_of_experience,
        description=description,
    )

    db.session.add(user_skill)
    db.session.commit()

    return user_skill


# Service function for viewing a mentor's profile
def get_mentor_profile_service(user_id):
    """
    Retrieves a mentor's public profile, including their skills
    and review summary.
    """

    user = db.session.get(User, user_id)

    if user is None:
        raise ValidationError("User not found.")

    if not user.is_mentor:
        raise ValidationError("This user does not have a mentor profile.")

    skills = [
        {
            "skill_id": user_skill.skill_id,
            "skill_name": user_skill.skill.skill_name,
            "category": user_skill.skill.category,
            "experience_level": user_skill.experience_level,
            "years_of_experience": user_skill.years_of_experience,
            "description": user_skill.description,
        }
        for user_skill in user.user_skills
    ]

    ratings = [review.rating for review in user.reviews_received]
    average_rating = round(sum(ratings) / len(ratings), 2) if ratings else None

    location = (
        f"{user.society.society_name}, {user.society.city}"
        if user.society and user.society.society_name and user.society.city
        else user.society.society_name if user.society and user.society.society_name
        else user.society.city if user.society and user.society.city
        else ""
    )

    return {
        "user_id": user.user_id,
        "full_name": user.full_name,
        "bio": user.bio,
        "location": location,
        "profile_image": user.profile_image,
        "is_mentor": user.is_mentor,
        "is_learner": user.is_learner,
        "society_id": user.society_id,
        "skills": skills,
        "average_rating": average_rating,
        "total_reviews": len(ratings),
    }


# Service function for viewing a learner's profile
def get_learner_profile_service(user_id):
    """
    Retrieves a learner's public profile, including their skills.
    """

    user = db.session.get(User, user_id)

    if user is None:
        raise ValidationError("User not found.")

    if not user.is_learner:
        raise ValidationError("This user does not have a learner profile.")

    skills = [
        {
            "skill_id": user_skill.skill_id,
            "skill_name": user_skill.skill.skill_name,
            "category": user_skill.skill.category,
            "experience_level": user_skill.experience_level,
            "years_of_experience": user_skill.years_of_experience,
            "description": user_skill.description,
        }
        for user_skill in user.user_skills
    ]

    location = (
        f"{user.society.society_name}, {user.society.city}"
        if user.society and user.society.society_name and user.society.city
        else user.society.society_name if user.society and user.society.society_name
        else user.society.city if user.society and user.society.city
        else ""
    )

    return {
        "user_id": user.user_id,
        "full_name": user.full_name,
        "bio": user.bio,
        "location": location,
        "profile_image": user.profile_image,
        "is_mentor": user.is_mentor,
        "is_learner": user.is_learner,
        "society_id": user.society_id,
        "skills": skills,
    }
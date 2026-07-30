from sqlalchemy import func, or_
from sqlalchemy.orm import joinedload, selectinload

from app.extensions import db
from app.models.skill import Skill
from app.models.user import User
from app.models.user_skill import UserSkill


class ValidationError(Exception):
    """Exception raised when input validation fails for mentor search."""

    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class MentorSearchService:
    """Service class for mentor search operations."""

    @staticmethod
    def search_mentors_by_skill(skill_query: str) -> list:
        """
        Search mentors by skill name (case insensitive, partial match).

        :param skill_query: Skill search query string.
        :return: List of dicts representing matching mentors.
        :raises ValidationError: If skill_query is missing or empty.
        """
        if skill_query is None or not str(skill_query).strip():
            raise ValidationError("skill query parameter is required", status_code=400)

        cleaned_skill = str(skill_query).strip()

        # Query users who are mentors and have a skill matching partial cleaned_skill
        mentors = (
            db.session.query(User)
            .options(
                joinedload(User.society),
                selectinload(User.user_skills).joinedload(UserSkill.skill),
                selectinload(User.reviews_received),
            )
            .join(UserSkill, User.user_id == UserSkill.user_id)
            .join(Skill, UserSkill.skill_id == Skill.skill_id)
            .filter(
                or_(
                    func.lower(User.role) == "mentor",
                    User.is_mentor.is_(True),
                ),
                Skill.skill_name.ilike(f"%{cleaned_skill}%"),
            )
            .distinct()
            .all()
        )

        response_dto = []
        for mentor in mentors:
            # Collect all skill names associated with this mentor
            skills_list = [
                us.skill.skill_name
                for us in mentor.user_skills
                if us.skill and us.skill.skill_name
            ]

            # Calculate average rating from reviews_received
            if mentor.reviews_received:
                ratings = [
                    r.rating for r in mentor.reviews_received if r.rating is not None
                ]
                avg_rating = (
                    round(sum(ratings) / len(ratings), 1) if ratings else 0.0
                )
            else:
                avg_rating = 0.0

            # Location: city from Society if available
            location = (
                mentor.society.city
                if mentor.society and mentor.society.city
                else ""
            )

            response_dto.append(
                {
                    "id": mentor.user_id,
                    "name": mentor.full_name,
                    "skills": skills_list,
                    "location": location,
                    "rating": avg_rating,
                    "profile_picture": mentor.profile_image or "",
                }
            )

        return response_dto

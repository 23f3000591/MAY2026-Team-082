from sqlalchemy import func, or_
from sqlalchemy.orm import joinedload, selectinload

from app.extensions import db
from app.models.skill import Skill
from app.models.society import Society
from app.models.user import User
from app.models.user_skill import UserSkill


class ValidationError(Exception):
    """Exception raised when input validation fails for mentor search."""

    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class NotFoundError(Exception):
    """Exception raised when requested resource is not found (HTTP 404)."""

    def __init__(self, message: str, status_code: int = 404):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class MentorSearchService:
    """Service class for mentor search operations."""

    @staticmethod
    def get_mentor_details(mentor_id_raw) -> dict:
        """
        Retrieve complete details for a mentor by ID.

        :param mentor_id_raw: Raw mentor ID parameter from route.
        :return: Dict containing complete mentor details DTO.
        :raises ValidationError: If mentor_id_raw is not a valid positive integer.
        :raises NotFoundError: If mentor with mentor_id is not found or is not a mentor.
        """
        try:
            mentor_id = int(mentor_id_raw)
            if mentor_id <= 0:
                raise ValueError()
        except (ValueError, TypeError):
            raise ValidationError("Invalid mentor ID", status_code=400)

        mentor = (
            db.session.query(User)
            .options(
                joinedload(User.society),
                selectinload(User.user_skills).joinedload(UserSkill.skill),
                selectinload(User.reviews_received),
                selectinload(User.availabilities),
            )
            .filter(
                User.user_id == mentor_id,
                or_(
                    func.lower(User.role) == "mentor",
                    User.is_mentor.is_(True),
                ),
            )
            .first()
        )

        if not mentor:
            raise NotFoundError("Mentor not found", status_code=404)

        skills_list = [
            us.skill.skill_name
            for us in mentor.user_skills
            if us.skill and us.skill.skill_name
        ]

        if mentor.reviews_received:
            ratings = [
                r.rating for r in mentor.reviews_received if r.rating is not None
            ]
            avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0.0
            review_count = len(mentor.reviews_received)
        else:
            avg_rating = 0.0
            review_count = 0

        availability_list = []
        for a in mentor.availabilities:
            if a.start_time:
                formatted_time = a.start_time.strftime("%I %p").lstrip("0")
                availability_list.append(f"{a.day_of_week} {formatted_time}")
            else:
                availability_list.append(str(a.day_of_week))

        location = (
            mentor.society.city
            if mentor.society and mentor.society.city
            else ""
        )

        return {
            "id": mentor.user_id,
            "name": mentor.full_name,
            "bio": mentor.bio or "",
            "location": location,
            "skills": skills_list,
            "rating": avg_rating,
            "review_count": review_count,
            "availability": availability_list,
            "profile_picture": mentor.profile_image or "",
        }


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

    @staticmethod
    def search_mentors_by_location(location_query: str) -> list:
        """
        Search mentors by location (city, society name, state, address - case insensitive, partial match).

        :param location_query: Location search query string.
        :return: List of dicts representing matching mentors.
        :raises ValidationError: If location_query is missing or empty.
        """
        if location_query is None or not str(location_query).strip():
            raise ValidationError("location query parameter is required", status_code=400)

        cleaned_location = str(location_query).strip()

        # Query users who are mentors and belong to a society matching location query
        mentors = (
            db.session.query(User)
            .options(
                joinedload(User.society),
                selectinload(User.user_skills).joinedload(UserSkill.skill),
                selectinload(User.reviews_received),
            )
            .join(Society, User.society_id == Society.society_id)
            .filter(
                or_(
                    func.lower(User.role) == "mentor",
                    User.is_mentor.is_(True),
                ),
                or_(
                    Society.city.ilike(f"%{cleaned_location}%"),
                    Society.society_name.ilike(f"%{cleaned_location}%"),
                    Society.state.ilike(f"%{cleaned_location}%"),
                    Society.address.ilike(f"%{cleaned_location}%"),
                ),
            )
            .distinct()
            .all()
        )

        response_dto = []
        for mentor in mentors:
            skills_list = [
                us.skill.skill_name
                for us in mentor.user_skills
                if us.skill and us.skill.skill_name
            ]

            if mentor.reviews_received:
                ratings = [
                    r.rating for r in mentor.reviews_received if r.rating is not None
                ]
                avg_rating = (
                    round(sum(ratings) / len(ratings), 1) if ratings else 0.0
                )
            else:
                avg_rating = 0.0

            location = (
                mentor.society.city
                if mentor.society and mentor.society.city
                else ""
            )

            response_dto.append(
                {
                    "id": mentor.user_id,
                    "name": mentor.full_name,
                    "location": location,
                    "skills": skills_list,
                    "rating": avg_rating,
                    "profile_picture": mentor.profile_image or "",
                }
            )

        return response_dto

    @staticmethod
    def filter_mentors(
        skill: str = None,
        location: str = None,
        minimum_rating_raw: str = None,
        sort: str = None,
        order: str = None,
    ) -> list:
        """
        Filter and sort mentors dynamically by optional criteria: skill, location, minimum_rating, sort, order.

        :param skill: Optional skill query string (case insensitive, partial match).
        :param location: Optional location query string (case insensitive, partial match).
        :param minimum_rating_raw: Optional minimum rating value string.
        :param sort: Optional sort field ('rating' or 'name').
        :param order: Optional sort order ('asc' or 'desc').
        :return: List of dicts representing mentors matching all supplied criteria in requested order.
        :raises ValidationError: If minimum_rating_raw, sort, or order parameters are invalid.
        """
        min_rating = None
        if minimum_rating_raw is not None and str(minimum_rating_raw).strip() != "":
            try:
                min_rating = float(minimum_rating_raw)
            except (ValueError, TypeError):
                raise ValidationError("minimum_rating must be a valid number", status_code=400)

        # Validate sort field if provided
        sort_field = None
        if sort is not None and str(sort).strip() != "":
            sort_field = str(sort).strip().lower()
            if sort_field not in ["rating", "name"]:
                raise ValidationError("Invalid sort field", status_code=400)

        # Validate order field if provided
        sort_order = "asc"
        if order is not None and str(order).strip() != "":
            sort_order = str(order).strip().lower()
            if sort_order not in ["asc", "desc"]:
                raise ValidationError("Invalid sort order", status_code=400)

        query = (
            db.session.query(User)
            .options(
                joinedload(User.society),
                selectinload(User.user_skills).joinedload(UserSkill.skill),
                selectinload(User.reviews_received),
            )
            .filter(
                or_(
                    func.lower(User.role) == "mentor",
                    User.is_mentor.is_(True),
                )
            )
        )

        if skill is not None and str(skill).strip() != "":
            cleaned_skill = str(skill).strip()
            query = (
                query.join(UserSkill, User.user_id == UserSkill.user_id)
                .join(Skill, UserSkill.skill_id == Skill.skill_id)
                .filter(Skill.skill_name.ilike(f"%{cleaned_skill}%"))
            )

        if location is not None and str(location).strip() != "":
            cleaned_location = str(location).strip()
            query = query.join(Society, User.society_id == Society.society_id).filter(
                or_(
                    Society.city.ilike(f"%{cleaned_location}%"),
                    Society.society_name.ilike(f"%{cleaned_location}%"),
                    Society.state.ilike(f"%{cleaned_location}%"),
                    Society.address.ilike(f"%{cleaned_location}%"),
                )
            )

        mentors = query.distinct().all()

        response_dto = []
        for mentor in mentors:
            skills_list = [
                us.skill.skill_name
                for us in mentor.user_skills
                if us.skill and us.skill.skill_name
            ]

            if mentor.reviews_received:
                ratings = [
                    r.rating for r in mentor.reviews_received if r.rating is not None
                ]
                avg_rating = (
                    round(sum(ratings) / len(ratings), 1) if ratings else 0.0
                )
            else:
                avg_rating = 0.0

            if min_rating is not None and avg_rating < min_rating:
                continue

            loc = (
                mentor.society.city
                if mentor.society and mentor.society.city
                else ""
            )

            response_dto.append(
                {
                    "id": mentor.user_id,
                    "name": mentor.full_name,
                    "location": loc,
                    "skills": skills_list,
                    "rating": avg_rating,
                    "profile_picture": mentor.profile_image or "",
                }
            )

        # Apply sorting if specified
        if sort_field == "rating":
            reverse_flag = (sort_order == "desc")
            response_dto.sort(key=lambda x: x["rating"], reverse=reverse_flag)
        elif sort_field == "name":
            reverse_flag = (sort_order == "desc")
            response_dto.sort(key=lambda x: x["name"].lower(), reverse=reverse_flag)

        return response_dto



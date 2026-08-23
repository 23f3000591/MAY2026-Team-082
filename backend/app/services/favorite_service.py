from sqlalchemy import func, or_
from sqlalchemy.orm import joinedload, selectinload

from app.extensions import db
from app.models.favorite import Favorite
from app.models.user import User
from app.models.user_skill import UserSkill
from app.services.mentor_service import NotFoundError, ValidationError


class ConflictError(Exception):
    """Exception raised when a conflict occurs (HTTP 409)."""

    def __init__(self, message: str, status_code: int = 409):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class FavoriteService:
    """Service class for managing learner's favorite mentors."""

    @staticmethod
    def add_favorite(user_id: int, mentor_id_raw) -> dict:
        """
        Add a mentor to the authenticated learner's favorites.

        :param user_id: Authenticated learner user_id.
        :param mentor_id_raw: Raw mentor ID parameter from route.
        :return: Dict response message.
        :raises ValidationError: If mentor_id_raw is not a valid positive integer.
        :raises NotFoundError: If mentor does not exist or is not a mentor.
        :raises ConflictError: If mentor is already in learner's favorites.
        """
        try:
            mentor_id = int(mentor_id_raw)
            if mentor_id <= 0:
                raise ValueError()
        except (ValueError, TypeError):
            # If mentor_id_raw is a string identifier/slug, attempt to find mentor by matching full_name or user_id
            mentor = (
                db.session.query(User)
                .filter(
                    or_(
                        func.lower(User.full_name) == str(mentor_id_raw).replace("-", " ").lower(),
                        func.lower(User.email).like(f"{str(mentor_id_raw).lower()}%"),
                    ),
                    or_(
                        func.lower(User.role) == "mentor",
                        User.is_mentor.is_(True),
                        User.user_skills.any(),
                    ),
                )
                .first()
            )
            if mentor:
                mentor_id = mentor.user_id
            else:
                raise ValidationError("Invalid mentor ID", status_code=400)

        if "mentor" not in locals() or not mentor:
            mentor = (
                db.session.query(User)
                .filter(
                    User.user_id == mentor_id,
                    or_(
                        func.lower(User.role) == "mentor",
                        User.is_mentor.is_(True),
                        User.user_skills.any(),
                    ),
                )
                .first()
            )

        if not mentor:
            raise NotFoundError("Mentor not found", status_code=404)

        existing = (
            db.session.query(Favorite)
            .filter(Favorite.user_id == user_id, Favorite.mentor_id == mentor_id)
            .first()
        )

        if existing:
            raise ConflictError("Mentor already added to favorites", status_code=409)

        fav = Favorite(user_id=user_id, mentor_id=mentor_id)
        db.session.add(fav)
        db.session.commit()

        return {"message": "Mentor added to favorites"}

    @staticmethod
    def remove_favorite(user_id: int, mentor_id_raw) -> dict:
        """
        Remove a mentor from the authenticated learner's favorites.

        :param user_id: Authenticated learner user_id.
        :param mentor_id_raw: Raw mentor ID parameter from route.
        :return: Dict response message.
        :raises ValidationError: If mentor_id_raw is not a valid positive integer.
        :raises NotFoundError: If mentor or favorite relation does not exist.
        """
        try:
            mentor_id = int(mentor_id_raw)
            if mentor_id <= 0:
                raise ValueError()
        except (ValueError, TypeError):
            mentor = (
                db.session.query(User)
                .filter(
                    or_(
                        func.lower(User.full_name) == str(mentor_id_raw).replace("-", " ").lower(),
                        func.lower(User.email).like(f"{str(mentor_id_raw).lower()}%"),
                    ),
                    or_(
                        func.lower(User.role) == "mentor",
                        User.is_mentor.is_(True),
                        User.user_skills.any(),
                    ),
                )
                .first()
            )
            if mentor:
                mentor_id = mentor.user_id
            else:
                raise ValidationError("Invalid mentor ID", status_code=400)

        if "mentor" not in locals() or not mentor:
            mentor = (
                db.session.query(User)
                .filter(
                    User.user_id == mentor_id,
                    or_(
                        func.lower(User.role) == "mentor",
                        User.is_mentor.is_(True),
                        User.user_skills.any(),
                    ),
                )
                .first()
            )

        if not mentor:
            raise NotFoundError("Mentor not found", status_code=404)

        fav = (
            db.session.query(Favorite)
            .filter(Favorite.user_id == user_id, Favorite.mentor_id == mentor_id)
            .first()
        )

        if not fav:
            raise NotFoundError("Favorite mentor not found", status_code=404)

        db.session.delete(fav)
        db.session.commit()

        return {"message": "Mentor removed from favorites"}

    @staticmethod
    def get_user_favorites(user_id: int) -> list:
        """
        Get all favorite mentors of the authenticated learner.

        :param user_id: Authenticated learner user_id.
        :return: List of dicts representing favorite mentors.
        """
        favorites = (
            db.session.query(Favorite)
            .options(
                joinedload(Favorite.mentor).joinedload(User.society),
                joinedload(Favorite.mentor)
                .selectinload(User.user_skills)
                .joinedload(UserSkill.skill),
                joinedload(Favorite.mentor).selectinload(User.reviews_received),
            )
            .filter(Favorite.user_id == user_id)
            .all()
        )

        results = []
        for fav in favorites:
            mentor = fav.mentor
            if not mentor:
                continue

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

            loc = (
                mentor.society.city
                if mentor.society and mentor.society.city
                else ""
            )

            results.append(
                {
                    "id": mentor.user_id,
                    "name": mentor.full_name,
                    "location": loc,
                    "rating": avg_rating,
                    "skills": skills_list,
                }
            )

        return results

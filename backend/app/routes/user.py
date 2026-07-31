from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.services.favorite_service import FavoriteService

# Blueprint for user routes
user_bp = Blueprint(
    "user",
    __name__,
    url_prefix="/users",
)


@user_bp.route("/me/favorites", methods=["GET"])
@jwt_required()
def get_my_favorites():
    """
    GET /api/users/me/favorites

    Returns all favorite mentors of the authenticated learner.
    """
    user_id = int(get_jwt_identity())
    favorites = FavoriteService.get_user_favorites(user_id)
    return jsonify(favorites), 200

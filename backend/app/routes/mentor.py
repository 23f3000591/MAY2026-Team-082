from flask import Blueprint, jsonify, request

from app.services.mentor_service import MentorSearchService, ValidationError

# Blueprint for mentor routes
mentor_bp = Blueprint(
    "mentor",
    __name__,
    url_prefix="/mentors",
)


@mentor_bp.route("/search", methods=["GET"])
def search_mentors():
    """
    GET /api/mentors/search?skill=<skill_name>

    Searches mentors by skill name (case insensitive, partial match).
    """
    skill_query = request.args.get("skill")

    try:
        results = MentorSearchService.search_mentors_by_skill(skill_query)
        return jsonify(results), 200
    except ValidationError as err:
        return jsonify({"error": err.message}), 400

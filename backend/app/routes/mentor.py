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


@mentor_bp.route("/search/location", methods=["GET"])
def search_mentors_by_location():
    """
    GET /api/mentors/search/location?location=<location>

    Searches mentors by location (case insensitive, partial match).
    """
    location_query = request.args.get("location")

    try:
        results = MentorSearchService.search_mentors_by_location(location_query)
        return jsonify(results), 200
    except ValidationError as err:
        return jsonify({"error": err.message}), 400


@mentor_bp.route("/filter", methods=["GET"])
def filter_mentors():
    """
    GET /api/mentors/filter

    Filters mentors dynamically by skill, location, and minimum_rating.
    """
    skill = request.args.get("skill")
    location = request.args.get("location")
    minimum_rating = request.args.get("minimum_rating")

    try:
        results = MentorSearchService.filter_mentors(
            skill=skill,
            location=location,
            minimum_rating_raw=minimum_rating,
        )
        return jsonify(results), 200
    except ValidationError as err:
        return jsonify({"error": err.message}), 400


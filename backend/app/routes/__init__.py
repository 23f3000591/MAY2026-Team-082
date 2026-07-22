from flask import Blueprint, jsonify
from .auth import auth_bp

# Create a blueprint for API routes
api_bp = Blueprint("api", __name__, url_prefix="/api")

# Register child blueprints
api_bp.register_blueprint(auth_bp)


@api_bp.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint to verify backend status."""
    return jsonify({"status": "healthy", "message": "Backend is running"}), 200


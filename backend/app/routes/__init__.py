from flask import Blueprint, jsonify
from .auth import auth_bp
from .profile import profile_bp
from .availability import availability_bp
from .session import session_bp
from .mentor import mentor_bp
from .user import user_bp
from .admin import admin_bp
from .chat import chat_bp
from .notification import notification_bp
from .review import review_bp

api_bp = Blueprint("api", __name__, url_prefix="/api")

api_bp.register_blueprint(auth_bp)
api_bp.register_blueprint(profile_bp)
api_bp.register_blueprint(availability_bp)
api_bp.register_blueprint(session_bp)
api_bp.register_blueprint(mentor_bp)
api_bp.register_blueprint(user_bp)
api_bp.register_blueprint(admin_bp)
api_bp.register_blueprint(chat_bp)
api_bp.register_blueprint(notification_bp)
api_bp.register_blueprint(review_bp)


@api_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "message": "Backend is running"}), 200

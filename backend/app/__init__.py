from flask import Flask

from .config import Config
from .extensions import cors, db, jwt
from .routes import api_bp
from .services.auth_service import is_token_revoked


def create_app(config_class=Config):
    """
    Application factory to create and configure the Flask app.
    """
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app)

    # Register token blocklist loader callback for JWT revocation
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        return is_token_revoked(jwt_header, jwt_payload)

    from . import models

    # Ensure database tables exist in runtime database under application context
    with app.app_context():
        db.create_all()

    # Register blueprints
    app.register_blueprint(api_bp)

    return app

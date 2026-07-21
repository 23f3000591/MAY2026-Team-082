from flask import Flask
from .config import Config
from .extensions import cors, db, jwt
from .routes import api_bp


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

    from . import models

    # Ensure database tables exist in runtime database under application context
    with app.app_context():
        db.create_all()

    # Register blueprints
    app.register_blueprint(api_bp)

    return app

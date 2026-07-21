from flask_jwt_extended import create_access_token
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db
from app.models.society import Society
from app.models.user import User


class ValidationError(Exception):
    """Custom exception raised when input validation fails (HTTP 400)."""

    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class DuplicateError(Exception):
    """Custom exception raised when duplicate email/phone is detected (HTTP 409)."""

    def __init__(self, message: str, status_code: int = 409):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class AuthenticationError(Exception):
    """Custom exception raised when user authentication fails (HTTP 401)."""

    def __init__(self, message: str, status_code: int = 401):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def register_user_service(
    data: dict, is_learner: bool = True, is_mentor: bool = False
) -> User:
    """
    Generalized service function to handle user registration logic.

    Steps:
    1. Validate required fields (full_name, email, password, phone_number, society_id).
    2. Check society existence.
    3. Ensure email is unique across all users.
    4. Ensure phone number is unique across all users.
    5. Hash password using werkzeug.security.generate_password_hash().
    6. Instantiate User with specified is_learner and is_mentor flags.
    7. Save the user into the database and return the created User model instance.
    """
    if not data or not isinstance(data, dict):
        raise ValidationError("Request body must be a valid JSON object.")

    full_name = data.get("full_name")
    email = data.get("email")
    password = data.get("password")
    phone_number = data.get("phone_number")
    society_id = data.get("society_id")

    missing_fields = []
    if not full_name or not str(full_name).strip():
        missing_fields.append("full_name")
    if not email or not str(email).strip():
        missing_fields.append("email")
    if not password or not str(password).strip():
        missing_fields.append("password")
    if not phone_number or not str(phone_number).strip():
        missing_fields.append("phone_number")
    if society_id is None or str(society_id).strip() == "":
        missing_fields.append("society_id")

    if missing_fields:
        raise ValidationError(
            f"Missing or invalid required fields: {', '.join(missing_fields)}"
        )

    full_name = str(full_name).strip()
    email = str(email).strip().lower()
    phone_number = str(phone_number).strip()

    try:
        society_id_int = int(society_id)
    except (ValueError, TypeError):
        raise ValidationError("society_id must be a valid integer.")

    society = db.session.get(Society, society_id_int)
    if not society:
        raise ValidationError(f"Society with ID {society_id_int} does not exist.")

    existing_user_email = User.query.filter_by(email=email).first()
    if existing_user_email:
        raise DuplicateError("A user with this email address already exists.")

    existing_user_phone = User.query.filter_by(phone_number=phone_number).first()
    if existing_user_phone:
        raise DuplicateError("A user with this phone number already exists.")

    hashed_password = generate_password_hash(password)

    new_user = User(
        society_id=society_id_int,
        full_name=full_name,
        email=email,
        password_hash=hashed_password,
        phone_number=phone_number,
        role="user",
        is_learner=is_learner,
        is_mentor=is_mentor,
        is_verified=False,
    )

    db.session.add(new_user)
    db.session.commit()

    return new_user


def register_learner_service(data: dict) -> User:
    """Service function to handle learner registration logic (is_learner=True, is_mentor=False)."""
    return register_user_service(data, is_learner=True, is_mentor=False)


def register_mentor_service(data: dict) -> User:
    """Service function to handle mentor registration logic (is_learner=False, is_mentor=True)."""
    return register_user_service(data, is_learner=False, is_mentor=True)


def login_user_service(data: dict) -> tuple[User, str]:
    """
    Service function to handle user login and JWT token generation.

    Steps:
    1. Validate required fields (email, password).
    2. Retrieve user from database by email.
    3. Verify password hash using werkzeug.security.check_password_hash().
    4. Generate JWT access token using flask_jwt_extended.create_access_token().
    5. Return tuple of (user, access_token).
    """
    if not data or not isinstance(data, dict):
        raise ValidationError("Request body must be a valid JSON object.")

    email = data.get("email")
    password = data.get("password")

    missing_fields = []
    if not email or not str(email).strip():
        missing_fields.append("email")
    if not password or not str(password).strip():
        missing_fields.append("password")

    if missing_fields:
        raise ValidationError(
            f"Missing or invalid required fields: {', '.join(missing_fields)}"
        )

    email = str(email).strip().lower()

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        raise AuthenticationError("Invalid email or password.")

    access_token = create_access_token(identity=str(user.user_id))
    return user, access_token

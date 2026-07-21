from werkzeug.security import generate_password_hash

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
    # Step 1: Validate payload format
    if not data or not isinstance(data, dict):
        raise ValidationError("Request body must be a valid JSON object.")

    # Extract required registration attributes
    full_name = data.get("full_name")
    email = data.get("email")
    password = data.get("password")
    phone_number = data.get("phone_number")
    society_id = data.get("society_id")

    # Step 2: Validate missing or blank required fields
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

    # Sanitize input values
    full_name = str(full_name).strip()
    email = str(email).strip().lower()
    phone_number = str(phone_number).strip()

    # Step 3: Validate society_id type and database existence
    try:
        society_id_int = int(society_id)
    except (ValueError, TypeError):
        raise ValidationError("society_id must be a valid integer.")

    society = db.session.get(Society, society_id_int)
    if not society:
        raise ValidationError(f"Society with ID {society_id_int} does not exist.")

    # Step 4: Ensure email is unique
    existing_user_email = User.query.filter_by(email=email).first()
    if existing_user_email:
        raise DuplicateError("A user with this email address already exists.")

    # Step 5: Ensure phone number is unique
    existing_user_phone = User.query.filter_by(phone_number=phone_number).first()
    if existing_user_phone:
        raise DuplicateError("A user with this phone number already exists.")

    # Step 6: Hash the password securely using werkzeug.security.generate_password_hash
    hashed_password = generate_password_hash(password)

    # Step 7: Create a new User instance with role flags set
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

    # Step 8: Save and commit new user to database
    db.session.add(new_user)
    db.session.commit()

    return new_user


def register_learner_service(data: dict) -> User:
    """Service function to handle learner registration logic (is_learner=True, is_mentor=False)."""
    return register_user_service(data, is_learner=True, is_mentor=False)


def register_mentor_service(data: dict) -> User:
    """Service function to handle mentor registration logic (is_learner=False, is_mentor=True)."""
    return register_user_service(data, is_learner=False, is_mentor=True)

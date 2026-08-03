import pytest
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
from flask_jwt_extended import create_access_token

from app import create_app
from app.config import Config
from app.extensions import db
from app.models.society import Society
from app.models.user import User
from app.models.skill import Skill
from app.models.user_skill import UserSkill
from app.models.availability import Availability
from app.models.session import Session

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = "test-secret-key"
    JWT_SECRET_KEY = "test-jwt-secret-key"

@pytest.fixture(scope="session")
def app():
    """Create and configure a new app instance for the entire test session."""
    app = create_app(TestConfig)
    yield app

@pytest.fixture(scope="session")
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture(scope="session")
def runner(app):
    """A test runner for the app's cli commands."""
    return app.test_cli_runner()

@pytest.fixture(scope="function")
def database(app):
    """Create a fresh database before each test, and drop it after."""
    with app.app_context():
        db.create_all()
        yield db
        db.session.remove()
        db.drop_all()

@pytest.fixture(scope="function")
def sample_society(database):
    """Create a sample society."""
    admin = User(
        society_id=1,
        full_name="Society Admin",
        email="admin@society.com",
        password_hash=generate_password_hash("password123"),
        phone_number="9999999999",
        role="admin",
        is_learner=False,
        is_mentor=False,
    )
    database.session.add(admin)
    database.session.flush()

    society = Society(
        society_name="Green Palms Society",
        address="456 Palm Avenue",
        city="Mumbai",
        state="Maharashtra",
        pincode="400001",
        admin_id=admin.user_id,
    )
    database.session.add(society)
    database.session.commit()
    
    admin.society_id = society.society_id
    database.session.commit()
    
    return society

@pytest.fixture(scope="function")
def sample_learner(database, sample_society):
    """Create a sample authenticated learner."""
    user = User(
        society_id=sample_society.society_id,
        full_name="John Learner",
        email="learner@example.com",
        password_hash=generate_password_hash("password123"),
        phone_number="8888888888",
        role="user",
        is_learner=True,
        is_mentor=False,
    )
    database.session.add(user)
    database.session.commit()
    return user

@pytest.fixture(scope="function")
def auth_learner(sample_learner):
    """Return access token and headers for the sample learner."""
    token = create_access_token(identity=str(sample_learner.user_id))
    headers = {"Authorization": f"Bearer {token}"}
    return {"user": sample_learner, "token": token, "headers": headers}

@pytest.fixture(scope="function")
def sample_mentor(database, sample_society):
    """Create a sample mentor."""
    user = User(
        society_id=sample_society.society_id,
        full_name="Mary Mentor",
        email="mentor@example.com",
        password_hash=generate_password_hash("password123"),
        phone_number="7777777777",
        role="user",
        is_learner=False,
        is_mentor=True,
        bio="Expert in Python",
    )
    database.session.add(user)
    database.session.commit()
    return user

@pytest.fixture(scope="function")
def auth_mentor(sample_mentor):
    """Return access token and headers for the sample mentor."""
    token = create_access_token(identity=str(sample_mentor.user_id))
    headers = {"Authorization": f"Bearer {token}"}
    return {"user": sample_mentor, "token": token, "headers": headers}

@pytest.fixture(scope="function")
def auth_admin(database, sample_society):
    """Return access token and headers for the sample admin."""
    admin = User.query.filter_by(email="admin@society.com").first()
    token = create_access_token(identity=str(admin.user_id))
    headers = {"Authorization": f"Bearer {token}"}
    return {"user": admin, "token": token, "headers": headers}

@pytest.fixture(scope="function")
def sample_skills(database, sample_mentor):
    """Create sample skills and associate with mentor."""
    skill1 = Skill(skill_name="Python", category="Programming")
    skill2 = Skill(skill_name="React", category="Web Dev")
    database.session.add_all([skill1, skill2])
    database.session.flush()

    user_skill = UserSkill(
        user_id=sample_mentor.user_id,
        skill_id=skill1.skill_id,
        experience_level="expert"
    )
    database.session.add(user_skill)
    database.session.commit()
    return {"python": skill1, "react": skill2, "mentor_skill": user_skill}

@pytest.fixture(scope="function")
def sample_availability(database, sample_mentor):
    """Create sample availability slots for mentor."""
    tomorrow = datetime.utcnow() + timedelta(days=1)
    
    slot1 = Availability(
        user_id=sample_mentor.user_id,
        day_of_week=tomorrow.strftime("%A"),
        start_time=tomorrow.replace(hour=10, minute=0, second=0, microsecond=0).time(),
        end_time=tomorrow.replace(hour=11, minute=0, second=0, microsecond=0).time()
    )
    
    slot2 = Availability(
        user_id=sample_mentor.user_id,
        day_of_week=tomorrow.strftime("%A"),
        start_time=tomorrow.replace(hour=11, minute=0, second=0, microsecond=0).time(),
        end_time=tomorrow.replace(hour=12, minute=0, second=0, microsecond=0).time()
    )
    
    database.session.add_all([slot1, slot2])
    database.session.commit()
    return [slot1, slot2]

@pytest.fixture(scope="function")
def sample_session(database, sample_learner, sample_mentor, sample_availability, sample_skills):
    """Create a sample session."""
    slot = sample_availability[1] # The booked slot
    session = Session(
        learner_id=sample_learner.user_id,
        mentor_id=sample_mentor.user_id,
        skill_id=sample_skills["python"].skill_id,
        availability_id=slot.availability_id,
        session_mode="Online",
        session_date=(datetime.utcnow() + timedelta(days=2)).date(),
        status="scheduled",
        meeting_link="https://meet.google.com/abc-defg-hij"
    )
    database.session.add(session)
    database.session.commit()
    return session

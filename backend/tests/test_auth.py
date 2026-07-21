import unittest
from werkzeug.security import check_password_hash

from app import create_app
from app.config import Config
from app.extensions import db
from app.models.society import Society
from app.models.user import User


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = "test-secret-key"
    JWT_SECRET_KEY = "test-jwt-secret-key"


class AuthTestCase(unittest.TestCase):
    """Test suite for Registration and Login APIs."""

    def setUp(self):
        """Set up test app, database, and client before each test."""
        self.app = create_app(TestConfig)
        self.app_context = self.app.app_context()
        self.app_context.push()
        self.client = self.app.test_client()

        db.create_all()

        # Create sample society
        admin = User(
            society_id=1,
            full_name="Society Admin",
            email="admin@society.com",
            password_hash="hashed_admin_password",
            phone_number="9999999999",
            role="admin",
            is_learner=False,
            is_mentor=False,
        )
        db.session.add(admin)
        db.session.flush()

        society = Society(
            society_name="Green Palms Society",
            address="456 Palm Avenue",
            city="Mumbai",
            state="Maharashtra",
            pincode="400001",
            admin_id=admin.user_id,
        )
        db.session.add(society)
        db.session.commit()

        admin.society_id = society.society_id
        db.session.commit()

        self.sample_society_id = society.society_id

    def tearDown(self):
        """Tear down database session and context after each test."""
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    # --- Learner Registration Tests (NSEP-8) ---

    def test_register_learner_success(self):
        """Test successful learner registration returns 201 Created and hashes password."""
        payload = {
            "full_name": "John Learner",
            "email": "john.learner@example.com",
            "password": "SecurePassword123!",
            "phone_number": "9876543210",
            "society_id": self.sample_society_id,
        }

        response = self.client.post("/api/auth/register", json=payload)
        self.assertEqual(response.status_code, 201)

        data = response.get_json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["message"], "Learner registered successfully")
        self.assertEqual(data["data"]["email"], "john.learner@example.com")
        self.assertEqual(data["data"]["full_name"], "John Learner")
        self.assertEqual(data["data"]["phone_number"], "9876543210")
        self.assertEqual(data["data"]["society_id"], self.sample_society_id)
        self.assertTrue(data["data"]["is_learner"])
        self.assertFalse(data["data"]["is_mentor"])

        user = User.query.filter_by(email="john.learner@example.com").first()
        self.assertIsNotNone(user)
        self.assertNotEqual(user.password_hash, "SecurePassword123!")
        self.assertTrue(check_password_hash(user.password_hash, "SecurePassword123!"))

    def test_register_learner_missing_fields(self):
        """Test registration with missing fields returns 400 Bad Request."""
        payload = {
            "full_name": "Incomplete User",
            "email": "incomplete@example.com",
        }

        response = self.client.post("/api/auth/register", json=payload)
        self.assertEqual(response.status_code, 400)

        data = response.get_json()
        self.assertEqual(data["status"], "error")
        self.assertIn("Missing or invalid required fields", data["message"])

    def test_register_learner_invalid_society(self):
        """Test registration with non-existent society_id returns 400 Bad Request."""
        payload = {
            "full_name": "Jane Learner",
            "email": "jane.learner@example.com",
            "password": "SecurePassword123!",
            "phone_number": "9876543211",
            "society_id": 99999,
        }

        response = self.client.post("/api/auth/register", json=payload)
        self.assertEqual(response.status_code, 400)

        data = response.get_json()
        self.assertEqual(data["status"], "error")
        self.assertIn("does not exist", data["message"])

    def test_register_learner_duplicate_email(self):
        """Test registration with duplicate email returns 409 Conflict."""
        payload = {
            "full_name": "Learner One",
            "email": "duplicate.email@example.com",
            "password": "Password123!",
            "phone_number": "9876543212",
            "society_id": self.sample_society_id,
        }

        self.client.post("/api/auth/register", json=payload)

        payload_dup = {
            "full_name": "Learner Two",
            "email": "duplicate.email@example.com",
            "password": "Password456!",
            "phone_number": "9876543213",
            "society_id": self.sample_society_id,
        }
        response = self.client.post("/api/auth/register", json=payload_dup)
        self.assertEqual(response.status_code, 409)

        data = response.get_json()
        self.assertEqual(data["status"], "error")
        self.assertIn("email address already exists", data["message"])

    def test_register_learner_duplicate_phone(self):
        """Test registration with duplicate phone number returns 409 Conflict."""
        payload = {
            "full_name": "Learner One",
            "email": "user1@example.com",
            "password": "Password123!",
            "phone_number": "9800000000",
            "society_id": self.sample_society_id,
        }

        self.client.post("/api/auth/register", json=payload)

        payload_dup = {
            "full_name": "Learner Two",
            "email": "user2@example.com",
            "password": "Password456!",
            "phone_number": "9800000000",
            "society_id": self.sample_society_id,
        }
        response = self.client.post("/api/auth/register", json=payload_dup)
        self.assertEqual(response.status_code, 409)

        data = response.get_json()
        self.assertEqual(data["status"], "error")
        self.assertIn("phone number already exists", data["message"])

    # --- Mentor Registration Tests (NSEP-9) ---

    def test_register_mentor_success(self):
        """Test successful mentor registration returns 201 Created and sets is_mentor=True."""
        payload = {
            "full_name": "Mary Mentor",
            "email": "mary.mentor@example.com",
            "password": "MentorPassword123!",
            "phone_number": "9876543220",
            "society_id": self.sample_society_id,
        }

        response = self.client.post("/api/auth/register/mentor", json=payload)
        self.assertEqual(response.status_code, 201)

        data = response.get_json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["message"], "Mentor registered successfully")
        self.assertFalse(data["data"]["is_learner"])
        self.assertTrue(data["data"]["is_mentor"])

    # --- Login Tests (NSEP-10) ---

    def test_login_success(self):
        """Test successful user login returns 200 OK, JWT access token, and user info."""
        reg_payload = {
            "full_name": "Login User",
            "email": "login.user@example.com",
            "password": "SecretPassword123!",
            "phone_number": "9876543230",
            "society_id": self.sample_society_id,
        }
        self.client.post("/api/auth/register", json=reg_payload)

        login_payload = {
            "email": "login.user@example.com",
            "password": "SecretPassword123!",
        }

        response = self.client.post("/api/auth/login", json=login_payload)
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["message"], "Login successful")
        self.assertIn("access_token", data)
        self.assertTrue(len(data["access_token"]) > 0)
        self.assertEqual(data["data"]["email"], "login.user@example.com")

    def test_login_missing_email(self):
        """Test login with missing email returns 400 Bad Request."""
        login_payload = {"password": "SecretPassword123!"}
        response = self.client.post("/api/auth/login", json=login_payload)
        self.assertEqual(response.status_code, 400)

        data = response.get_json()
        self.assertEqual(data["status"], "error")
        self.assertIn("Missing or invalid required fields", data["message"])

    def test_login_missing_password(self):
        """Test login with missing password returns 400 Bad Request."""
        login_payload = {"email": "login.user@example.com"}
        response = self.client.post("/api/auth/login", json=login_payload)
        self.assertEqual(response.status_code, 400)

        data = response.get_json()
        self.assertEqual(data["status"], "error")
        self.assertIn("Missing or invalid required fields", data["message"])

    def test_login_invalid_email(self):
        """Test login with non-existent email returns 401 Unauthorized."""
        login_payload = {
            "email": "nonexistent@example.com",
            "password": "SomePassword123!",
        }
        response = self.client.post("/api/auth/login", json=login_payload)
        self.assertEqual(response.status_code, 401)

        data = response.get_json()
        self.assertEqual(data["status"], "error")
        self.assertEqual(data["message"], "Invalid email or password.")

    def test_login_invalid_password(self):
        """Test login with incorrect password returns 401 Unauthorized."""
        reg_payload = {
            "full_name": "Login User",
            "email": "login.user2@example.com",
            "password": "CorrectPassword123!",
            "phone_number": "9876543231",
            "society_id": self.sample_society_id,
        }
        self.client.post("/api/auth/register", json=reg_payload)

        login_payload = {
            "email": "login.user2@example.com",
            "password": "WrongPassword123!",
        }
        response = self.client.post("/api/auth/login", json=login_payload)
        self.assertEqual(response.status_code, 401)

        data = response.get_json()
        self.assertEqual(data["status"], "error")
        self.assertEqual(data["message"], "Invalid email or password.")


if __name__ == "__main__":
    unittest.main()

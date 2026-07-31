import unittest
from datetime import date

from app import create_app
from app.config import Config
from app.extensions import db
from app.models.review import Review
from app.models.skill import Skill
from app.models.society import Society
from app.models.user import User
from app.models.user_skill import UserSkill


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = "test-secret-key"
    JWT_SECRET_KEY = "test-jwt-secret-key"


class MentorSearchTestCase(unittest.TestCase):
    """Test suite for NSEP-22 Search Mentors by Skill endpoint."""

    def setUp(self):
        """Set up test app, database, and sample seed data before each test."""
        self.app = create_app(TestConfig)
        self.app_context = self.app.app_context()
        self.app_context.push()
        self.client = self.app.test_client()

        db.create_all()

        # Create test society
        admin = User(
            society_id=1,
            full_name="Society Admin",
            email="admin@society.com",
            password_hash="hashed_password",
            phone_number="9000000000",
            role="admin",
            is_learner=False,
            is_mentor=False,
        )
        db.session.add(admin)
        db.session.flush()

        society = Society(
            society_name="Green Heights",
            address="123 Main St",
            city="Chennai",
            state="Tamil Nadu",
            pincode="600001",
            admin_id=admin.user_id,
        )
        db.session.add(society)
        db.session.commit()

        admin.society_id = society.society_id
        db.session.commit()

        self.society_id = society.society_id

        # Seed Skills
        skill_python = Skill(skill_name="Python", category="Programming")
        skill_pytorch = Skill(skill_name="PyTorch", category="Machine Learning")
        skill_web = Skill(skill_name="Python Web Development", category="Web")
        skill_java = Skill(skill_name="Java", category="Programming")

        db.session.add_all([skill_python, skill_pytorch, skill_web, skill_java])
        db.session.commit()

        # Create Mentor 1 (role="mentor", is_mentor=True)
        mentor1 = User(
            society_id=self.society_id,
            full_name="John Doe",
            email="john.doe@example.com",
            password_hash="hashed",
            phone_number="9876543210",
            role="mentor",
            is_mentor=True,
            is_learner=False,
            profile_image="http://example.com/john.jpg",
        )

        # Create Mentor 2 (is_mentor=True, possesses Python Web Development & PyTorch)
        mentor2 = User(
            society_id=self.society_id,
            full_name="Jane Smith",
            email="jane.smith@example.com",
            password_hash="hashed",
            phone_number="9876543211",
            role="user",
            is_mentor=True,
            is_learner=False,
            profile_image="http://example.com/jane.jpg",
        )

        # Create Learner (is_mentor=False, has Python skill - should NOT be returned in mentor search)
        learner = User(
            society_id=self.society_id,
            full_name="Bob Learner",
            email="bob.learner@example.com",
            password_hash="hashed",
            phone_number="9876543212",
            role="user",
            is_mentor=False,
            is_learner=True,
        )

        db.session.add_all([mentor1, mentor2, learner])
        db.session.commit()

        # Link skills to users
        # Mentor 1 has Python and Machine Learning (PyTorch)
        us1 = UserSkill(user_id=mentor1.user_id, skill_id=skill_python.skill_id, experience_level="Expert")
        us2 = UserSkill(user_id=mentor1.user_id, skill_id=skill_pytorch.skill_id, experience_level="Intermediate")

        # Mentor 2 has Python Web Development
        us3 = UserSkill(user_id=mentor2.user_id, skill_id=skill_web.skill_id, experience_level="Expert")

        # Learner has Python skill
        us4 = UserSkill(user_id=learner.user_id, skill_id=skill_python.skill_id, experience_level="Beginner")

        db.session.add_all([us1, us2, us3, us4])
        db.session.commit()

        # Create reviews for Mentor 1 to test rating calculation
        review1 = Review(
            session_id=1,
            learner_id=learner.user_id,
            mentor_id=mentor1.user_id,
            rating=5,
            review_text="Great mentor!",
        )
        review2 = Review(
            session_id=1,
            learner_id=learner.user_id,
            mentor_id=mentor1.user_id,
            rating=4,
            review_text="Good explanation.",
        )
        db.session.add_all([review1, review2])
        db.session.commit()

        self.mentor1 = mentor1
        self.mentor2 = mentor2
        self.learner = learner

    def tearDown(self):
        """Tear down database session and context after each test."""
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_search_mentors_valid(self):
        """Test searching with valid skill returns matching mentors with correct DTO fields."""
        response = self.client.get("/api/mentors/search?skill=python")
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 1)

        # Check fields of the returned mentor DTO
        mentor_data = next((m for m in data if m["id"] == self.mentor1.user_id), None)
        self.assertIsNotNone(mentor_data)
        self.assertEqual(mentor_data["name"], "John Doe")
        self.assertIn("Python", mentor_data["skills"])
        self.assertIn("PyTorch", mentor_data["skills"])
        self.assertEqual(mentor_data["location"], "Chennai")
        self.assertEqual(mentor_data["rating"], 4.5)  # Avg of 5 and 4
        self.assertEqual(mentor_data["profile_picture"], "http://example.com/john.jpg")

    def test_search_mentors_no_results(self):
        """Test searching for non-existent skill returns HTTP 200 and empty list []."""
        response = self.client.get("/api/mentors/search?skill=Rust")
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertEqual(data, [])

    def test_search_mentors_missing_parameter(self):
        """Test missing skill query parameter returns HTTP 400 with expected error message."""
        response = self.client.get("/api/mentors/search")
        self.assertEqual(response.status_code, 400)

        data = response.get_json()
        self.assertIn("error", data)
        self.assertEqual(data["error"], "skill query parameter is required")

    def test_search_mentors_empty_parameter(self):
        """Test empty skill query parameter returns HTTP 400 with expected error message."""
        response = self.client.get("/api/mentors/search?skill=")
        self.assertEqual(response.status_code, 400)

        data = response.get_json()
        self.assertIn("error", data)
        self.assertEqual(data["error"], "skill query parameter is required")

    def test_search_mentors_case_insensitive(self):
        """Test case-insensitive search matching (PYTHON, python, PyThOn)."""
        for query in ["PYTHON", "python", "PyThOn"]:
            response = self.client.get(f"/api/mentors/search?skill={query}")
            self.assertEqual(response.status_code, 200)
            data = response.get_json()
            mentor_ids = [m["id"] for m in data]
            self.assertIn(self.mentor1.user_id, mentor_ids)

    def test_search_mentors_partial_match(self):
        """Test partial string search ('py' matching 'Python', 'PyTorch', 'Python Web Development')."""
        response = self.client.get("/api/mentors/search?skill=py")
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        mentor_ids = [m["id"] for m in data]

        # Both mentor1 and mentor2 should match
        self.assertIn(self.mentor1.user_id, mentor_ids)
        self.assertIn(self.mentor2.user_id, mentor_ids)

    def test_search_mentors_excludes_non_mentors(self):
        """Test that non-mentor users having the requested skill are excluded from search results."""
        response = self.client.get("/api/mentors/search?skill=python")
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        mentor_ids = [m["id"] for m in data]

        # Learner has Python skill, but is_mentor=False and role='user', so should NOT be returned
        self.assertNotIn(self.learner.user_id, mentor_ids)

    # --- NSEP-23: Search Mentors by Location Tests ---

    def test_search_mentors_by_location_valid(self):
        """Test valid location search returns HTTP 200 and matching mentors with expected JSON schema."""
        response = self.client.get("/api/mentors/search/location?location=Chennai")
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 1)

        mentor_data = next((m for m in data if m["id"] == self.mentor1.user_id), None)
        self.assertIsNotNone(mentor_data)
        self.assertEqual(mentor_data["name"], "John Doe")
        self.assertEqual(mentor_data["location"], "Chennai")
        self.assertIn("Python", mentor_data["skills"])
        self.assertEqual(mentor_data["rating"], 4.5)
        self.assertEqual(mentor_data["profile_picture"], "http://example.com/john.jpg")

    def test_search_mentors_by_location_partial(self):
        """Test partial location search ('chen' matching 'Chennai')."""
        response = self.client.get("/api/mentors/search/location?location=chen")
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        mentor_ids = [m["id"] for m in data]
        self.assertIn(self.mentor1.user_id, mentor_ids)
        self.assertIn(self.mentor2.user_id, mentor_ids)

    def test_search_mentors_by_location_case_insensitive(self):
        """Test case-insensitive location search ('CHENNAI', 'chennai', 'ChEnNaI')."""
        for query in ["CHENNAI", "chennai", "ChEnNaI"]:
            response = self.client.get(f"/api/mentors/search/location?location={query}")
            self.assertEqual(response.status_code, 200)

            data = response.get_json()
            mentor_ids = [m["id"] for m in data]
            self.assertIn(self.mentor1.user_id, mentor_ids)

    def test_search_mentors_by_location_no_results(self):
        """Test searching for non-existent location returns HTTP 200 and empty list []."""
        response = self.client.get("/api/mentors/search/location?location=Mumbai")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), [])

    def test_search_mentors_by_location_missing_parameter(self):
        """Test missing location query parameter returns HTTP 400 with error message."""
        response = self.client.get("/api/mentors/search/location")
        self.assertEqual(response.status_code, 400)

        data = response.get_json()
        self.assertIn("error", data)
        self.assertEqual(data["error"], "location query parameter is required")

    def test_search_mentors_by_location_empty_parameter(self):
        """Test empty location query parameter returns HTTP 400 with error message."""
        response = self.client.get("/api/mentors/search/location?location=")
        self.assertEqual(response.status_code, 400)

        data = response.get_json()
        self.assertIn("error", data)
        self.assertEqual(data["error"], "location query parameter is required")

    def test_search_mentors_by_location_excludes_non_mentors(self):
        """Test non-mentor users in matching location are excluded from results."""
        response = self.client.get("/api/mentors/search/location?location=Chennai")
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        mentor_ids = [m["id"] for m in data]
        self.assertNotIn(self.learner.user_id, mentor_ids)

    # --- NSEP-24: Filter Mentors Tests ---

    def test_filter_mentors_by_skill(self):
        """Test filtering mentors by skill parameter."""
        response = self.client.get("/api/mentors/filter?skill=Python")
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertIsInstance(data, list)
        mentor_ids = [m["id"] for m in data]
        self.assertIn(self.mentor1.user_id, mentor_ids)

    def test_filter_mentors_by_location(self):
        """Test filtering mentors by location parameter."""
        response = self.client.get("/api/mentors/filter?location=Chennai")
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertIsInstance(data, list)
        mentor_ids = [m["id"] for m in data]
        self.assertIn(self.mentor1.user_id, mentor_ids)
        self.assertIn(self.mentor2.user_id, mentor_ids)

    def test_filter_mentors_by_minimum_rating(self):
        """Test filtering mentors by minimum rating parameter (>= provided rating)."""
        response = self.client.get("/api/mentors/filter?minimum_rating=4")
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        mentor_ids = [m["id"] for m in data]
        self.assertIn(self.mentor1.user_id, mentor_ids)

        # High minimum rating should exclude mentor2 (rating=0.0)
        response_high = self.client.get("/api/mentors/filter?minimum_rating=4.5")
        data_high = response_high.get_json()
        high_mentor_ids = [m["id"] for m in data_high]
        self.assertIn(self.mentor1.user_id, high_mentor_ids)
        self.assertNotIn(self.mentor2.user_id, high_mentor_ids)

    def test_filter_mentors_multiple_filters(self):
        """Test filtering mentors with multiple criteria simultaneously (AND logic)."""
        response = self.client.get("/api/mentors/filter?skill=Python&location=Chennai&minimum_rating=4.5")
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["id"], self.mentor1.user_id)
        self.assertEqual(data[0]["name"], "John Doe")

    def test_filter_mentors_no_results(self):
        """Test filter combination that yields no matching mentors returns HTTP 200 []."""
        response = self.client.get("/api/mentors/filter?skill=Java&location=Chennai")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), [])

    def test_filter_mentors_invalid_minimum_rating(self):
        """Test non-numeric minimum_rating returns HTTP 400 error."""
        response = self.client.get("/api/mentors/filter?minimum_rating=invalid")
        self.assertEqual(response.status_code, 400)

        data = response.get_json()
        self.assertIn("error", data)
        self.assertEqual(data["error"], "minimum_rating must be a valid number")


if __name__ == "__main__":
    unittest.main()



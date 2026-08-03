import unittest
from datetime import date, time
from flask_jwt_extended import create_access_token

from app import create_app
from app.config import Config
from app.extensions import db
from app.models.availability import Availability
from app.models.favorite import Favorite
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
    """Test suite for NSEP-22, NSEP-23, NSEP-24, NSEP-25, NSEP-26 & NSEP-27 endpoints."""

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
            bio="Experienced Python mentor",
            profile_image="http://example.com/john.jpg",
        )

        # Create Mentor 2 (is_mentor=True, possesses Python Web Development)
        mentor2 = User(
            society_id=self.society_id,
            full_name="Jane Smith",
            email="jane.smith@example.com",
            password_hash="hashed",
            phone_number="9876543211",
            role="user",
            is_mentor=True,
            is_learner=False,
            bio="Web development mentor",
            profile_image="http://example.com/jane.jpg",
        )

        # Create Learner (is_mentor=False, has Python skill)
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
        us1 = UserSkill(user_id=mentor1.user_id, skill_id=skill_python.skill_id, experience_level="Expert")
        us2 = UserSkill(user_id=mentor1.user_id, skill_id=skill_pytorch.skill_id, experience_level="Intermediate")
        us3 = UserSkill(user_id=mentor2.user_id, skill_id=skill_web.skill_id, experience_level="Expert")
        us4 = UserSkill(user_id=learner.user_id, skill_id=skill_python.skill_id, experience_level="Beginner")

        db.session.add_all([us1, us2, us3, us4])
        db.session.commit()

        # Create reviews for Mentor 1
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

        # Add Availability for Mentor 1
        avail1 = Availability(
            user_id=mentor1.user_id,
            day_of_week="Monday",
            start_time=time(18, 0),
            end_time=time(20, 0),
        )
        avail2 = Availability(
            user_id=mentor1.user_id,
            day_of_week="Wednesday",
            start_time=time(20, 0),
            end_time=time(21, 0),
        )
        db.session.add_all([avail1, avail2])
        db.session.commit()

        self.mentor1 = mentor1
        self.mentor2 = mentor2
        self.learner = learner

        # Generate JWT Auth Headers for Learner
        token = create_access_token(identity=str(learner.user_id))
        self.auth_headers = {"Authorization": f"Bearer {token}"}


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

        mentor_data = next((m for m in data if m["id"] == self.mentor1.user_id), None)
        self.assertIsNotNone(mentor_data)
        self.assertEqual(mentor_data["name"], "John Doe")
        self.assertIn("Python", mentor_data["skills"])
        self.assertIn("PyTorch", mentor_data["skills"])
        self.assertEqual(mentor_data["location"], "Chennai")
        self.assertEqual(mentor_data["rating"], 4.5)
        self.assertEqual(mentor_data["profile_picture"], "http://example.com/john.jpg")

    def test_search_mentors_no_results(self):
        """Test searching for non-existent skill returns HTTP 200 and empty list []."""
        response = self.client.get("/api/mentors/search?skill=Rust")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), [])

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
        self.assertIn(self.mentor1.user_id, mentor_ids)
        self.assertIn(self.mentor2.user_id, mentor_ids)

    def test_search_mentors_excludes_non_mentors(self):
        """Test that non-mentor users having the requested skill are excluded from search results."""
        response = self.client.get("/api/mentors/search?skill=python")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        mentor_ids = [m["id"] for m in data]
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

    # --- NSEP-25: Sort Search Results Tests ---

    def test_sort_mentors_by_rating_asc(self):
        """Test sorting mentors by rating ascending (0.0 to 5.0)."""
        response = self.client.get("/api/mentors/filter?sort=rating&order=asc")
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertGreaterEqual(len(data), 2)
        ratings = [m["rating"] for m in data]
        self.assertEqual(ratings, sorted(ratings))

    def test_sort_mentors_by_rating_desc(self):
        """Test sorting mentors by rating descending (5.0 to 0.0)."""
        response = self.client.get("/api/mentors/filter?sort=rating&order=desc")
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertGreaterEqual(len(data), 2)
        ratings = [m["rating"] for m in data]
        self.assertEqual(ratings, sorted(ratings, reverse=True))

    def test_sort_mentors_by_name_asc(self):
        """Test sorting mentors by name ascending (A to Z)."""
        response = self.client.get("/api/mentors/filter?sort=name&order=asc")
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertGreaterEqual(len(data), 2)
        names = [m["name"] for m in data]
        self.assertEqual(names, sorted(names))

    def test_sort_mentors_by_name_desc(self):
        """Test sorting mentors by name descending (Z to A)."""
        response = self.client.get("/api/mentors/filter?sort=name&order=desc")
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertGreaterEqual(len(data), 2)
        names = [m["name"] for m in data]
        self.assertEqual(names, sorted(names, reverse=True))

    def test_sort_mentors_combined_with_filters(self):
        """Test sorting combined with filtering (skill=Python&sort=rating&order=desc)."""
        response = self.client.get("/api/mentors/filter?skill=Python&sort=rating&order=desc")
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertGreaterEqual(len(data), 1)
        ratings = [m["rating"] for m in data]
        self.assertEqual(ratings, sorted(ratings, reverse=True))

    def test_sort_mentors_invalid_sort_field(self):
        """Test invalid sort field returns HTTP 400 error."""
        response = self.client.get("/api/mentors/filter?sort=invalid")
        self.assertEqual(response.status_code, 400)

        data = response.get_json()
        self.assertIn("error", data)
        self.assertEqual(data["error"], "Invalid sort field")

    def test_sort_mentors_invalid_order_value(self):
        """Test invalid order value returns HTTP 400 error."""
        response = self.client.get("/api/mentors/filter?sort=rating&order=invalid")
        self.assertEqual(response.status_code, 400)

        data = response.get_json()
        self.assertIn("error", data)
        self.assertEqual(data["error"], "Invalid sort order")

    # --- NSEP-26: View Mentor Details Tests ---

    def test_get_mentor_details_valid(self):
        """Test valid mentor ID returns HTTP 200 and complete details DTO."""
        response = self.client.get(f"/api/mentors/{self.mentor1.user_id}")
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertEqual(data["id"], self.mentor1.user_id)
        self.assertEqual(data["name"], "John Doe")
        self.assertEqual(data["bio"], "Experienced Python mentor")
        self.assertEqual(data["location"], "Chennai")
        self.assertIn("Python", data["skills"])
        self.assertIn("PyTorch", data["skills"])
        self.assertEqual(data["rating"], 4.5)
        self.assertEqual(data["review_count"], 2)
        self.assertIn("Monday 6 PM", data["availability"])
        self.assertIn("Wednesday 8 PM", data["availability"])
        self.assertEqual(data["profile_picture"], "http://example.com/john.jpg")

    def test_get_mentor_details_not_found(self):
        """Test non-existent mentor ID returns HTTP 404 Not Found error."""
        response = self.client.get("/api/mentors/99999")
        self.assertEqual(response.status_code, 404)

        data = response.get_json()
        self.assertIn("error", data)
        self.assertEqual(data["error"], "Mentor not found")

    def test_get_mentor_details_invalid_id(self):
        """Test invalid mentor ID (non-integer) returns HTTP 400 Bad Request error."""
        response = self.client.get("/api/mentors/abc")
        self.assertEqual(response.status_code, 400)

        data = response.get_json()
        self.assertIn("error", data)
        self.assertEqual(data["error"], "Invalid mentor ID")

    def test_get_mentor_details_multiple_skills(self):
        """Test mentor with multiple skills returns all skill names."""
        response = self.client.get(f"/api/mentors/{self.mentor1.user_id}")
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertEqual(len(data["skills"]), 2)
        self.assertCountEqual(data["skills"], ["Python", "PyTorch"])

    def test_get_mentor_details_no_reviews(self):
        """Test mentor with no reviews returns rating 0.0 and review_count 0."""
        response = self.client.get(f"/api/mentors/{self.mentor2.user_id}")
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertEqual(data["rating"], 0.0)
        self.assertEqual(data["review_count"], 0)

    def test_get_mentor_details_availability(self):
        """Test mentor availability retrieval formats day and start time."""
        response = self.client.get(f"/api/mentors/{self.mentor1.user_id}")
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertIsInstance(data["availability"], list)
        self.assertEqual(len(data["availability"]), 2)
        self.assertIn("Monday 6 PM", data["availability"])
        self.assertIn("Wednesday 8 PM", data["availability"])

    # --- NSEP-27: Save Favorite Mentors Tests ---

    def test_add_favorite_mentor(self):
        """Test adding a valid mentor to favorites returns HTTP 201 Created."""
        response = self.client.post(
            f"/api/mentors/{self.mentor1.user_id}/favorite",
            headers=self.auth_headers,
        )
        self.assertEqual(response.status_code, 201)

        data = response.get_json()
        self.assertIn("message", data)
        self.assertEqual(data["message"], "Mentor added to favorites")

    def test_add_duplicate_favorite_mentor(self):
        """Test adding an already favorited mentor returns HTTP 409 Conflict."""
        # Add first time
        self.client.post(
            f"/api/mentors/{self.mentor1.user_id}/favorite",
            headers=self.auth_headers,
        )

        # Add second time
        response = self.client.post(
            f"/api/mentors/{self.mentor1.user_id}/favorite",
            headers=self.auth_headers,
        )
        self.assertEqual(response.status_code, 409)

        data = response.get_json()
        self.assertIn("error", data)
        self.assertEqual(data["error"], "Mentor already added to favorites")

    def test_add_favorite_mentor_not_found(self):
        """Test adding non-existent mentor returns HTTP 404 Not Found."""
        response = self.client.post(
            "/api/mentors/99999/favorite",
            headers=self.auth_headers,
        )
        self.assertEqual(response.status_code, 404)

        data = response.get_json()
        self.assertIn("error", data)
        self.assertEqual(data["error"], "Mentor not found")

    def test_remove_favorite_mentor(self):
        """Test removing a favorite mentor returns HTTP 200 OK."""
        # First add favorite
        self.client.post(
            f"/api/mentors/{self.mentor1.user_id}/favorite",
            headers=self.auth_headers,
        )

        # Remove favorite
        response = self.client.delete(
            f"/api/mentors/{self.mentor1.user_id}/favorite",
            headers=self.auth_headers,
        )
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertIn("message", data)
        self.assertEqual(data["message"], "Mentor removed from favorites")

    def test_remove_non_existing_favorite(self):
        """Test removing a mentor that is not in favorites returns HTTP 404 Not Found."""
        response = self.client.delete(
            f"/api/mentors/{self.mentor1.user_id}/favorite",
            headers=self.auth_headers,
        )
        self.assertEqual(response.status_code, 404)

        data = response.get_json()
        self.assertIn("error", data)
        self.assertEqual(data["error"], "Favorite mentor not found")

    def test_get_user_favorites(self):
        """Test listing favorite mentors returns HTTP 200 and list of favorite mentor DTOs."""
        # Add mentor1 to favorites
        self.client.post(
            f"/api/mentors/{self.mentor1.user_id}/favorite",
            headers=self.auth_headers,
        )

        response = self.client.get("/api/users/me/favorites", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 1)

        fav_mentor = data[0]
        self.assertEqual(fav_mentor["id"], self.mentor1.user_id)
        self.assertEqual(fav_mentor["name"], "John Doe")
        self.assertEqual(fav_mentor["location"], "Chennai")
        self.assertEqual(fav_mentor["rating"], 4.5)
        self.assertIn("Python", fav_mentor["skills"])


if __name__ == "__main__":
    unittest.main()





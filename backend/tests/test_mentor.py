import pytest
from app.models.user import User
from app.models.skill import Skill
from app.models.user_skill import UserSkill
from app.models.review import Review
from app.models.availability import Availability
from datetime import time
from app.extensions import db

@pytest.fixture(scope="function")
def mentor_search_data(database, sample_society, sample_mentor, sample_learner):
    """Seed data specifically for testing mentor search and filtering."""
    # sample_mentor already exists from conftest. We add another mentor
    mentor2 = User(
        society_id=sample_society.society_id,
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
    database.session.add(mentor2)
    database.session.flush()

    skill_python = Skill(skill_name="Python", category="Programming")
    skill_pytorch = Skill(skill_name="PyTorch", category="Machine Learning")
    skill_web = Skill(skill_name="Python Web Development", category="Web")
    skill_java = Skill(skill_name="Java", category="Programming")
    database.session.add_all([skill_python, skill_pytorch, skill_web, skill_java])
    database.session.flush()

    us1 = UserSkill(user_id=sample_mentor.user_id, skill_id=skill_python.skill_id, experience_level="Expert")
    us2 = UserSkill(user_id=sample_mentor.user_id, skill_id=skill_pytorch.skill_id, experience_level="Intermediate")
    us3 = UserSkill(user_id=mentor2.user_id, skill_id=skill_web.skill_id, experience_level="Expert")
    us4 = UserSkill(user_id=sample_learner.user_id, skill_id=skill_python.skill_id, experience_level="Beginner")
    database.session.add_all([us1, us2, us3, us4])

    review1 = Review(
        session_id=1,
        learner_id=sample_learner.user_id,
        mentor_id=sample_mentor.user_id,
        rating=5,
        review_text="Great mentor!",
    )
    review2 = Review(
        session_id=2,
        learner_id=sample_learner.user_id,
        mentor_id=sample_mentor.user_id,
        rating=4,
        review_text="Good explanation.",
    )
    database.session.add_all([review1, review2])

    avail1 = Availability(
        user_id=sample_mentor.user_id,
        day_of_week="Monday",
        start_time=time(18, 0),
        end_time=time(20, 0),
    )
    avail2 = Availability(
        user_id=sample_mentor.user_id,
        day_of_week="Wednesday",
        start_time=time(20, 0),
        end_time=time(21, 0),
    )
    database.session.add_all([avail1, avail2])
    database.session.commit()

    return {
        "mentor1": sample_mentor,
        "mentor2": mentor2,
        "learner": sample_learner,
        "society": sample_society
    }

class TestMentorSearch:
    
    def test_search_mentors_valid(self, client, mentor_search_data):
        response = client.get("/api/mentors/search?skill=python")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        mentor_data = next((m for m in data if m["id"] == mentor_search_data["mentor1"].user_id), None)
        assert mentor_data is not None
        assert mentor_data["name"] == "Mary Mentor" # Changed from original test since we use sample_mentor
        assert "Python" in mentor_data["skills"]

    def test_search_mentors_no_results(self, client, mentor_search_data):
        response = client.get("/api/mentors/search?skill=Rust")
        assert response.status_code == 200
        assert response.get_json() == []

    def test_search_mentors_missing_parameter(self, client, database):
        response = client.get("/api/mentors/search")
        assert response.status_code == 400
        data = response.get_json()
        assert data["error"] == "skill query parameter is required"

    def test_search_mentors_empty_parameter(self, client, database):
        response = client.get("/api/mentors/search?skill=")
        assert response.status_code == 400
        data = response.get_json()
        assert data["error"] == "skill query parameter is required"

    def test_search_mentors_case_insensitive(self, client, mentor_search_data):
        for query in ["PYTHON", "python", "PyThOn"]:
            response = client.get(f"/api/mentors/search?skill={query}")
            assert response.status_code == 200
            data = response.get_json()
            mentor_ids = [m["id"] for m in data]
            assert mentor_search_data["mentor1"].user_id in mentor_ids

    def test_search_mentors_partial_match(self, client, mentor_search_data):
        response = client.get("/api/mentors/search?skill=py")
        assert response.status_code == 200
        data = response.get_json()
        mentor_ids = [m["id"] for m in data]
        assert mentor_search_data["mentor1"].user_id in mentor_ids
        assert mentor_search_data["mentor2"].user_id in mentor_ids

    def test_search_mentors_excludes_non_mentors(self, client, mentor_search_data):
        response = client.get("/api/mentors/search?skill=python")
        assert response.status_code == 200
        data = response.get_json()
        mentor_ids = [m["id"] for m in data]
        assert mentor_search_data["learner"].user_id not in mentor_ids

    def test_search_mentors_by_location_valid(self, client, mentor_search_data):
        response = client.get("/api/mentors/search/location?location=Mumbai") # sample_society is Mumbai
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        mentor_ids = [m["id"] for m in data]
        assert mentor_search_data["mentor1"].user_id in mentor_ids

    def test_search_mentors_by_location_partial(self, client, mentor_search_data):
        response = client.get("/api/mentors/search/location?location=mumb")
        assert response.status_code == 200
        data = response.get_json()
        mentor_ids = [m["id"] for m in data]
        assert mentor_search_data["mentor1"].user_id in mentor_ids

    def test_search_mentors_by_location_no_results(self, client, mentor_search_data):
        response = client.get("/api/mentors/search/location?location=Chennai")
        assert response.status_code == 200
        assert response.get_json() == []

    def test_filter_mentors_by_skill(self, client, mentor_search_data):
        response = client.get("/api/mentors/filter?skill=Python")
        assert response.status_code == 200
        data = response.get_json()
        mentor_ids = [m["id"] for m in data]
        assert mentor_search_data["mentor1"].user_id in mentor_ids

    def test_filter_mentors_by_minimum_rating(self, client, mentor_search_data):
        response = client.get("/api/mentors/filter?minimum_rating=4")
        assert response.status_code == 200
        data = response.get_json()
        mentor_ids = [m["id"] for m in data]
        assert mentor_search_data["mentor1"].user_id in mentor_ids

        response_high = client.get("/api/mentors/filter?minimum_rating=4.8")
        data_high = response_high.get_json()
        high_mentor_ids = [m["id"] for m in data_high]
        assert mentor_search_data["mentor1"].user_id not in high_mentor_ids

    def test_sort_mentors_by_rating_desc(self, client, mentor_search_data):
        response = client.get("/api/mentors/filter?sort=rating&order=desc")
        assert response.status_code == 200
        data = response.get_json()
        ratings = [m["rating"] for m in data]
        assert ratings == sorted(ratings, reverse=True)

    def test_get_mentor_details_valid(self, client, mentor_search_data):
        mentor_id = mentor_search_data["mentor1"].user_id
        response = client.get(f"/api/mentors/{mentor_id}")
        assert response.status_code == 200
        data = response.get_json()
        assert data["id"] == mentor_id
        assert data["name"] == "Mary Mentor"
        assert "Python" in data["skills"]
        assert data["rating"] == 4.5
        assert data["review_count"] == 2

    def test_get_mentor_details_not_found(self, client, database):
        response = client.get("/api/mentors/99999")
        assert response.status_code == 404
        assert response.get_json()["error"] == "Mentor not found"

class TestMentorFavorites:
    
    def test_add_favorite_mentor(self, client, mentor_search_data, auth_learner):
        mentor_id = mentor_search_data["mentor1"].user_id
        response = client.post(
            f"/api/mentors/{mentor_id}/favorite",
            headers=auth_learner["headers"],
        )
        assert response.status_code == 201
        assert response.get_json()["message"] == "Mentor added to favorites"

    def test_add_duplicate_favorite_mentor(self, client, mentor_search_data, auth_learner):
        mentor_id = mentor_search_data["mentor1"].user_id
        client.post(
            f"/api/mentors/{mentor_id}/favorite",
            headers=auth_learner["headers"],
        )
        response = client.post(
            f"/api/mentors/{mentor_id}/favorite",
            headers=auth_learner["headers"],
        )
        assert response.status_code == 409
        assert response.get_json()["error"] == "Mentor already added to favorites"

    def test_remove_favorite_mentor(self, client, mentor_search_data, auth_learner):
        mentor_id = mentor_search_data["mentor1"].user_id
        client.post(
            f"/api/mentors/{mentor_id}/favorite",
            headers=auth_learner["headers"],
        )
        response = client.delete(
            f"/api/mentors/{mentor_id}/favorite",
            headers=auth_learner["headers"],
        )
        assert response.status_code == 200
        assert response.get_json()["message"] == "Mentor removed from favorites"

    def test_get_user_favorites(self, client, mentor_search_data, auth_learner):
        mentor_id = mentor_search_data["mentor1"].user_id
        client.post(
            f"/api/mentors/{mentor_id}/favorite",
            headers=auth_learner["headers"],
        )
        response = client.get("/api/users/me/favorites", headers=auth_learner["headers"])
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["id"] == mentor_id

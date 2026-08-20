import pytest
from app.models.user import User
from app.models.skill import Skill
from app.models.user_skill import UserSkill

class TestProfileAPI:
    """Test suite for Profile APIs."""

    def test_create_learner_profile_success(self, client, auth_learner):
        """Test creating a learner profile successfully."""
        payload = {
            "bio": "I am a learner eager to learn Python."
        }
        response = client.post(
            "/api/profile/learner",
            json=payload,
            headers=auth_learner["headers"]
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "success"
        assert data["message"] == "Learner profile created successfully"
        assert data["data"]["bio"] == payload["bio"]
        assert data["data"]["is_learner"] is True

    def test_create_learner_profile_missing_token(self, client):
        """Test creating learner profile without auth token."""
        response = client.post("/api/profile/learner", json={"bio": "Bio"})
        assert response.status_code == 401

    def test_create_mentor_profile_success(self, client, auth_mentor):
        """Test creating a mentor profile successfully."""
        payload = {
            "bio": "I am an experienced mentor in Python."
        }
        response = client.post(
            "/api/profile/mentor",
            json=payload,
            headers=auth_mentor["headers"]
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "success"
        assert data["message"] == "Mentor profile created successfully"
        assert data["data"]["bio"] == payload["bio"]
        assert data["data"]["is_mentor"] is True

    def test_edit_profile_success(self, client, auth_learner):
        """Test editing profile."""
        payload = {
            "bio": "Updated bio"
        }
        response = client.put(
            "/api/profile/",
            json=payload,
            headers=auth_learner["headers"]
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "success"
        assert data["message"] == "Profile updated successfully"
        assert data["data"]["bio"] == "Updated bio"

    def test_edit_profile_missing_fields(self, client, auth_learner, database):
        """Test editing profile with empty payload."""
        response = client.put(
            "/api/profile/",
            json={},
            headers=auth_learner["headers"]
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "success"

    def test_upload_profile_picture_success(self, client, auth_learner):
        """Test uploading a profile picture."""
        payload = {
            "profile_image": "http://example.com/image.jpg"
        }
        response = client.put(
            "/api/profile/picture",
            json=payload,
            headers=auth_learner["headers"]
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "success"
        assert data["message"] == "Profile picture updated successfully"
        assert data["data"]["profile_image"] == payload["profile_image"]

    def test_upload_profile_picture_invalid_url(self, client, auth_learner, database):
        """Test uploading a profile picture with invalid URL (simulated validation error)."""
        # If service validates URL, it would throw ValidationError. We assume missing field causes 400.
        payload = {}
        response = client.put(
            "/api/profile/picture",
            json=payload,
            headers=auth_learner["headers"]
        )
        assert response.status_code == 400
        data = response.get_json()
        assert data["status"] == "error"

    def test_add_skill_success(self, client, auth_mentor, database):
        """Test adding a skill to mentor profile."""
        skill = Skill(skill_name="Docker", category="DevOps")
        database.session.add(skill)
        database.session.commit()

        payload = {
            "skill_id": skill.skill_id,
            "experience_level": "Intermediate",
            "years_of_experience": 3,
            "description": "Used Docker for 3 years"
        }
        response = client.post(
            "/api/profile/skills",
            json=payload,
            headers=auth_mentor["headers"]
        )
        assert response.status_code == 201
        data = response.get_json()
        assert data["status"] == "success"
        assert data["message"] == "Skill added successfully"
        assert data["data"]["skill_id"] == skill.skill_id
        assert data["data"]["experience_level"] == "Intermediate"
        assert data["data"]["years_of_experience"] == 3

    def test_add_skill_duplicate(self, client, auth_mentor, database):
        """Test adding a duplicate skill."""
        skill = Skill(skill_name="Kubernetes", category="DevOps")
        database.session.add(skill)
        database.session.commit()

        payload = {
            "skill_id": skill.skill_id,
            "experience_level": "Beginner"
        }
        client.post("/api/profile/skills", json=payload, headers=auth_mentor["headers"])
        
        response = client.post("/api/profile/skills", json=payload, headers=auth_mentor["headers"])
        assert response.status_code == 400
        data = response.get_json()
        assert data["status"] == "error"

    def test_add_skill_invalid_skill(self, client, auth_mentor, database):
        """Test adding a non-existent skill."""
        payload = {
            "skill_id": 9999,
            "experience_level": "Beginner"
        }
        response = client.post(
            "/api/profile/skills",
            json=payload,
            headers=auth_mentor["headers"]
        )
        assert response.status_code == 400
        data = response.get_json()
        assert data["status"] == "error"

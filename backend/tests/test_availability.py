import pytest
from app.models.availability import Availability
from datetime import time

class TestAvailabilityAPI:
    """Test suite for Availability APIs."""

    def test_set_mentor_availability_success(self, client, auth_mentor, database):
        """Test setting mentor availability successfully."""
        payload = {
            "day_of_week": "Monday",
            "start_time": "10:00",
            "end_time": "12:00"
        }
        response = client.post(
            "/api/availability/",
            json=payload,
            headers=auth_mentor["headers"]
        )
        assert response.status_code == 201
        data = response.get_json()
        assert data["status"] == "success"
        assert data["message"] == "Availability slot added successfully"
        assert data["data"]["day_of_week"] == "Monday"
        assert data["data"]["start_time"] == "10:00"
        assert data["data"]["end_time"] == "12:00"
        assert data["data"]["user_id"] == auth_mentor["user"].user_id

    def test_set_mentor_availability_invalid_time(self, client, auth_mentor, database):
        """Test setting availability with end_time before start_time."""
        payload = {
            "day_of_week": "Tuesday",
            "start_time": "14:00",
            "end_time": "12:00"
        }
        response = client.post(
            "/api/availability/",
            json=payload,
            headers=auth_mentor["headers"]
        )
        assert response.status_code == 400
        data = response.get_json()
        assert data["status"] == "error"

    def test_set_mentor_availability_missing_fields(self, client, auth_mentor, database):
        """Test setting availability with missing fields."""
        payload = {
            "day_of_week": "Wednesday"
        }
        response = client.post(
            "/api/availability/",
            json=payload,
            headers=auth_mentor["headers"]
        )
        assert response.status_code == 400
        data = response.get_json()
        assert data["status"] == "error"

    def test_view_available_slots_success(self, client, auth_learner, sample_mentor, database):
        """Test getting available slots for a mentor."""
        slot = Availability(
            user_id=sample_mentor.user_id,
            day_of_week="Thursday",
            start_time=time(14, 0),
            end_time=time(16, 0)
        )
        database.session.add(slot)
        database.session.commit()

        response = client.get(
            f"/api/availability/mentor/{sample_mentor.user_id}",
            headers=auth_learner["headers"]
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "success"
        assert data["message"] == "Available slots retrieved successfully"
        assert isinstance(data["data"], list)
        
        found = next((s for s in data["data"] if s["day_of_week"] == "Thursday"), None)
        assert found is not None
        assert found["start_time"] == "14:00"
        assert found["end_time"] == "16:00"

    def test_view_available_slots_invalid_mentor(self, client, auth_learner, database):
        """Test getting slots for a non-existent mentor."""
        response = client.get(
            "/api/availability/mentor/9999",
            headers=auth_learner["headers"]
        )
        # Service might throw ValidationError if mentor not found, returning 404
        assert response.status_code == 404
        data = response.get_json()
        assert data["status"] == "error"

import pytest
from app.models.session import Session
from app.models.availability import Availability
from app.models.skill import Skill
from datetime import datetime, timedelta, time

class TestSessionAPI:
    """Test suite for Session Booking APIs."""

    def test_book_session_success(self, client, auth_learner, sample_mentor, database):
        """Test booking a session successfully."""
        # Create availability slot and skill
        slot = Availability(
            user_id=sample_mentor.user_id,
            day_of_week="Friday",
            start_time=time(10, 0),
            end_time=time(11, 0)
        )
        skill = Skill(skill_name="Docker", category="DevOps")
        database.session.add_all([slot, skill])
        database.session.commit()

        payload = {
            "mentor_id": sample_mentor.user_id,
            "skill_id": skill.skill_id,
            "availability_id": slot.availability_id,
            "session_mode": "Online",
            "session_date": (datetime.utcnow() + timedelta(days=5)).date().isoformat(),
            "learner_note": "I want to learn Docker."
        }
        
        response = client.post(
            "/api/sessions/",
            json=payload,
            headers=auth_learner["headers"]
        )
        assert response.status_code == 201
        data = response.get_json()
        assert data["status"] == "success"
        assert data["message"] == "Booking request sent successfully"
        assert data["data"]["mentor_id"] == sample_mentor.user_id
        assert data["data"]["status"] == "Pending"

    def test_book_session_missing_fields(self, client, auth_learner):
        """Test booking a session with missing fields."""
        payload = {
            "mentor_id": 1
        }
        response = client.post(
            "/api/sessions/",
            json=payload,
            headers=auth_learner["headers"]
        )
        assert response.status_code == 400
        data = response.get_json()
        assert data["status"] == "error"

    def test_accept_booking_success(self, client, auth_mentor, sample_session):
        """Test accepting a booking request."""
        sample_session.status = "Pending"
        db = sample_session.query.session
        db.commit()

        response = client.put(
            f"/api/sessions/{sample_session.session_id}/accept",
            headers=auth_mentor["headers"]
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "success"
        assert data["message"] == "Booking accepted successfully"
        assert data["data"]["status"] == "Accepted"

    def test_reject_booking_success(self, client, auth_mentor, sample_session):
        """Test rejecting a booking request."""
        sample_session.status = "Pending"
        db = sample_session.query.session
        db.commit()

        response = client.put(
            f"/api/sessions/{sample_session.session_id}/reject",
            headers=auth_mentor["headers"]
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "success"
        assert data["message"] == "Booking rejected successfully"
        assert data["data"]["status"] == "Rejected"

    def test_cancel_booking_success(self, client, auth_learner, sample_session):
        """Test cancelling a booking request."""
        sample_session.status = "Accepted"
        db = sample_session.query.session
        db.commit()

        response = client.put(
            f"/api/sessions/{sample_session.session_id}/cancel",
            headers=auth_learner["headers"]
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "success"
        assert data["message"] == "Booking cancelled successfully"
        assert data["data"]["status"] == "Cancelled"

    def test_reschedule_session_success(self, client, auth_learner, sample_session, database):
        """Test rescheduling an active session."""
        sample_session.status = "Accepted"
        db = sample_session.query.session
        
        # Add new availability slot
        new_slot = Availability(
            user_id=sample_session.mentor_id,
            day_of_week="Saturday",
            start_time=time(14, 0),
            end_time=time(15, 0)
        )
        db.add(new_slot)
        db.commit()

        payload = {
            "availability_id": new_slot.availability_id,
            "session_date": (datetime.utcnow() + timedelta(days=6)).date().isoformat()
        }
        
        response = client.put(
            f"/api/sessions/{sample_session.session_id}/reschedule",
            json=payload,
            headers=auth_learner["headers"]
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "success"
        assert data["message"] == "Session rescheduled successfully"
        assert data["data"]["availability_id"] == new_slot.availability_id
        assert data["data"]["status"] == "Pending" # Rescheduling usually makes it pending again

    def test_view_booking_history_success(self, client, auth_learner, sample_session):
        """Test viewing booking history for the logged-in user."""
        response = client.get(
            "/api/sessions/history",
            headers=auth_learner["headers"]
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "success"
        assert data["message"] == "Booking history retrieved successfully"
        assert isinstance(data["data"], list)
        
        found = next((s for s in data["data"] if s["session_id"] == sample_session.session_id), None)
        assert found is not None

    def test_view_booking_history_with_status_filter(self, client, auth_learner, sample_session):
        """Test viewing booking history filtered by status."""
        sample_session.status = "Accepted"
        db = sample_session.query.session
        db.commit()

        response = client.get(
            "/api/sessions/history?status=Accepted",
            headers=auth_learner["headers"]
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "success"
        for s in data["data"]:
            assert s["status"] == "Accepted"

    def test_book_session_invalid_mentor(self, client, auth_learner, sample_mentor, database):
        payload = {
            "mentor_id": 9999,
            "skill_id": 1,
            "availability_id": 1,
            "session_mode": "Online",
            "session_date": "2030-01-01"
        }
        response = client.post("/api/sessions/", json=payload, headers=auth_learner["headers"])
        assert response.status_code == 400

    def test_accept_booking_not_mentor(self, client, auth_learner, sample_session):
        sample_session.status = "Pending"
        db = sample_session.query.session
        db.commit()
        response = client.put(f"/api/sessions/{sample_session.session_id}/accept", headers=auth_learner["headers"])
        assert response.status_code == 400

    def test_accept_booking_invalid_status(self, client, auth_mentor, sample_session):
        sample_session.status = "Cancelled"
        db = sample_session.query.session
        db.commit()
        response = client.put(f"/api/sessions/{sample_session.session_id}/accept", headers=auth_mentor["headers"])
        assert response.status_code == 400

    def test_reject_booking_invalid_status(self, client, auth_mentor, sample_session):
        sample_session.status = "Cancelled"
        db = sample_session.query.session
        db.commit()
        response = client.put(f"/api/sessions/{sample_session.session_id}/reject", headers=auth_mentor["headers"])
        assert response.status_code == 400

    def test_cancel_booking_invalid_status(self, client, auth_learner, sample_session):
        sample_session.status = "Cancelled"
        db = sample_session.query.session
        db.commit()
        response = client.put(f"/api/sessions/{sample_session.session_id}/cancel", headers=auth_learner["headers"])
        assert response.status_code == 400

    def test_reschedule_session_invalid_slot(self, client, auth_learner, sample_session):
        sample_session.status = "Accepted"
        db = sample_session.query.session
        db.commit()
        payload = {
            "availability_id": 9999,
            "session_date": "2030-01-01"
        }
        response = client.put(f"/api/sessions/{sample_session.session_id}/reschedule", json=payload, headers=auth_learner["headers"])
        assert response.status_code == 400

    def test_book_session_invalid_json(self, client, auth_learner):
        response = client.post("/api/sessions/", json=None, headers=auth_learner["headers"])
        assert response.status_code == 400

    def test_book_session_invalid_mode(self, client, auth_learner, sample_mentor, database):
        payload = {
            "mentor_id": sample_mentor.user_id,
            "skill_id": 1,
            "availability_id": 1,
            "session_mode": "Telepathy",
            "session_date": "2030-01-01"
        }
        response = client.post("/api/sessions/", json=payload, headers=auth_learner["headers"])
        assert response.status_code == 400

    def test_book_session_invalid_date_format(self, client, auth_learner, sample_mentor, database):
        payload = {
            "mentor_id": sample_mentor.user_id,
            "skill_id": 1,
            "availability_id": 1,
            "session_mode": "Online",
            "session_date": "01-01-2030"
        }
        response = client.post("/api/sessions/", json=payload, headers=auth_learner["headers"])
        assert response.status_code == 400

    def test_book_session_past_date(self, client, auth_learner, sample_mentor, database):
        payload = {
            "mentor_id": sample_mentor.user_id,
            "skill_id": 1,
            "availability_id": 1,
            "session_mode": "Online",
            "session_date": "2000-01-01"
        }
        response = client.post("/api/sessions/", json=payload, headers=auth_learner["headers"])
        assert response.status_code == 400

    def test_book_session_self_booking(self, client, auth_mentor, database):
        payload = {
            "mentor_id": auth_mentor["user"].user_id,
            "skill_id": 1,
            "availability_id": 1,
            "session_mode": "Online",
            "session_date": "2030-01-01"
        }
        response = client.post("/api/sessions/", json=payload, headers=auth_mentor["headers"])
        assert response.status_code == 400

    def test_book_session_invalid_skill(self, client, auth_learner, sample_mentor, database):
        payload = {
            "mentor_id": sample_mentor.user_id,
            "skill_id": 9999,
            "availability_id": 1,
            "session_mode": "Online",
            "session_date": "2030-01-01"
        }
        response = client.post("/api/sessions/", json=payload, headers=auth_learner["headers"])
        assert response.status_code == 400


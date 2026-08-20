import pytest
from app.models.favorite import Favorite
from app.models.user import User

class TestUserAPI:
    """Test suite for User APIs."""

    def test_get_my_favorites_success(self, client, auth_learner, sample_mentor, database):
        """Test getting favorite mentors for the authenticated learner."""
        favorite = Favorite(
            user_id=auth_learner["user"].user_id,
            mentor_id=sample_mentor.user_id
        )
        database.session.add(favorite)
        database.session.commit()

        response = client.get("/api/users/me/favorites", headers=auth_learner["headers"])
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["id"] == sample_mentor.user_id

    def test_get_my_favorites_empty(self, client, auth_learner):
        """Test getting favorites when none exist."""
        response = client.get("/api/users/me/favorites", headers=auth_learner["headers"])
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_get_my_favorites_unauthorized(self, client):
        """Test getting favorites without authentication."""
        response = client.get("/api/users/me/favorites")
        assert response.status_code == 401

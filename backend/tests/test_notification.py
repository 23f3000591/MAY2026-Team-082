import pytest

from app.models.notification import Notification

from app.services.notification_service import (
    create_notification_service,
    NOTIFICATION_TYPE_MESSAGE,
)


@pytest.fixture(scope="function")
def sample_notification(database, sample_learner):
    """Create a sample notification."""

    notification = create_notification_service(
        user_id=sample_learner.user_id,
        title="New Message",
        message="You received a new message.",
        notification_type=NOTIFICATION_TYPE_MESSAGE,
    )

    return notification


class TestNotification:

    def test_get_notifications_success(
        self,
        client,
        auth_learner,
        sample_notification,
    ):
        """Test retrieving notifications successfully."""

        response = client.get(
            "/api/notifications/",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert len(data["data"]) == 1
        assert data["data"][0]["title"] == "New Message"
        assert data["data"][0]["notification_type"] == NOTIFICATION_TYPE_MESSAGE

    def test_get_notifications_empty(
        self,
        client,
        auth_learner,
    ):
        """Test retrieving notifications when none exist."""

        response = client.get(
            "/api/notifications/",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert data["data"] == []

    def test_get_notifications_suspended_user(
        self,
        client,
        database,
        auth_learner,
    ):
        """Test suspended user cannot retrieve notifications."""

        auth_learner["user"].is_suspended = True
        database.session.commit()

        response = client.get(
            "/api/notifications/",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 403

        assert (
            response.get_json()["message"]
            == "Your account has been suspended. You cannot view notifications."
        )

    def test_mark_notification_read_success(
        self,
        client,
        auth_learner,
        sample_notification,
    ):
        """Test marking a notification as read."""

        response = client.put(
            f"/api/notifications/{sample_notification.notification_id}/read",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert data["data"]["is_read"] is True

        from app.extensions import db

        notification = db.session.get(
            Notification,
            sample_notification.notification_id,
        )

        assert notification.is_read is True

    def test_mark_notification_invalid_notification(
        self,
        client,
        auth_learner,
    ):
        """Test marking a non-existent notification."""

        response = client.put(
            "/api/notifications/999/read",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 404

        assert response.get_json()["message"] == "Notification not found."

    def test_mark_notification_unauthorized(
        self,
        client,
        auth_mentor,
        sample_notification,
    ):
        """Test updating another user's notification."""

        response = client.put(
            f"/api/notifications/{sample_notification.notification_id}/read",
            headers=auth_mentor["headers"],
        )

        assert response.status_code == 403

        assert (
            response.get_json()["message"]
            == "You are not authorized to update this notification."
        )

    def test_mark_notification_suspended_user(
        self,
        client,
        database,
        auth_learner,
        sample_notification,
    ):
        """Test suspended user cannot update notifications."""

        auth_learner["user"].is_suspended = True
        database.session.commit()

        response = client.put(
            f"/api/notifications/{sample_notification.notification_id}/read",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 403

        assert (
            response.get_json()["message"]
            == "Your account has been suspended. You cannot update notifications."
        )

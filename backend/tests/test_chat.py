import pytest


from app.extensions import db
from app.models.message import Message


@pytest.fixture(scope="function")
def sample_messages(database, sample_learner, sample_mentor):
    """Create sample chat messages."""

    message1 = Message(
        sender_id=sample_learner.user_id,
        receiver_id=sample_mentor.user_id,
        message="Hello Mentor!",
    )

    message2 = Message(
        sender_id=sample_mentor.user_id,
        receiver_id=sample_learner.user_id,
        message="Hello Learner!",
    )

    database.session.add_all([message1, message2])
    database.session.commit()

    return {
        "message1": message1,
        "message2": message2,
        "learner": sample_learner,
        "mentor": sample_mentor,
    }


class TestChat:
    def test_send_message_success(
        self,
        client,
        database,
        auth_learner,
        sample_mentor,
    ):
        """Test sending a message successfully."""

        response = client.post(
            "/api/chat/messages",
            headers=auth_learner["headers"],
            json={
                "receiver_id": sample_mentor.user_id,
                "message": "Hello Mentor!",
            },
        )

        assert response.status_code == 201

        data = response.get_json()

        assert data["status"] == "success"
        assert data["message"] == "Message sent successfully"
        assert data["data"]["sender_id"] == auth_learner["user"].user_id
        assert data["data"]["receiver_id"] == sample_mentor.user_id
        assert data["data"]["message"] == "Hello Mentor!"

        message = Message.query.filter_by(
            sender_id=auth_learner["user"].user_id,
            receiver_id=sample_mentor.user_id,
        ).first()

        assert message is not None

    def test_send_message_empty_message(
        self,
        client,
        auth_learner,
        sample_mentor,
    ):
        """Test sending an empty message."""

        response = client.post(
            "/api/chat/messages",
            headers=auth_learner["headers"],
            json={
                "receiver_id": sample_mentor.user_id,
                "message": "",
            },
        )

        assert response.status_code == 400

        data = response.get_json()

        assert data["status"] == "error"
        assert data["message"] == "Missing or invalid required fields: message"

    def test_send_message_missing_receiver(
        self,
        client,
        auth_learner,
    ):
        response = client.post(
            "/api/chat/messages",
            headers=auth_learner["headers"],
            json={
                "message": "Hello",
            },
        )

        assert response.status_code == 400

        assert (
            response.get_json()["message"]
            == "Missing or invalid required fields: receiver_id"
        )

    def test_send_message_invalid_receiver(
        self,
        client,
        auth_learner,
    ):
        response = client.post(
            "/api/chat/messages",
            headers=auth_learner["headers"],
            json={
                "receiver_id": 999,
                "message": "Hello",
            },
        )

        assert response.status_code == 404

        assert response.get_json()["message"] == "Receiver not found."

    def test_send_message_to_self(
        self,
        client,
        auth_learner,
    ):
        response = client.post(
            "/api/chat/messages",
            headers=auth_learner["headers"],
            json={
                "receiver_id": auth_learner["user"].user_id,
                "message": "Hello",
            },
        )

        assert response.status_code == 400

        assert (
            response.get_json()["message"] == "You cannot send a message to yourself."
        )

    def test_send_message_suspended_sender(
        self,
        client,
        database,
        auth_learner,
        sample_mentor,
    ):
        auth_learner["user"].is_suspended = True
        database.session.commit()

        response = client.post(
            "/api/chat/messages",
            headers=auth_learner["headers"],
            json={
                "receiver_id": sample_mentor.user_id,
                "message": "Hello",
            },
        )

        assert response.status_code == 403

        assert (
            response.get_json()["message"]
            == "Your account has been suspended. You cannot send messages."
        )

    def test_get_received_messages(
        self,
        client,
        auth_mentor,
        sample_messages,
    ):
        response = client.get(
            "/api/chat/messages",
            headers=auth_mentor["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert len(data["data"]) >= 1

    def test_get_received_messages_empty(
        self,
        client,
        auth_mentor,
    ):
        response = client.get(
            "/api/chat/messages",
            headers=auth_mentor["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert data["data"] == []

    def test_get_received_messages_suspended(
        self,
        client,
        database,
        auth_mentor,
    ):
        """Suspended User Cannot View Messages"""

        auth_mentor["user"].is_suspended = True
        database.session.commit()

        response = client.get(
            "/api/chat/messages",
            headers=auth_mentor["headers"],
        )

        assert response.status_code == 403

        assert (
            response.get_json()["message"]
            == "Your account has been suspended. You cannot view messages."
        )

    def test_get_conversation(
        self,
        client,
        auth_learner,
        sample_messages,
    ):
        response = client.get(
            f"/api/chat/conversations/{sample_messages['mentor'].user_id}",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert len(data["data"]) == 2

    def test_get_conversation_self(
        self,
        client,
        auth_learner,
    ):
        response = client.get(
            f"/api/chat/conversations/{auth_learner['user'].user_id}",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 400

        assert (
            response.get_json()["message"]
            == "You cannot view a conversation with yourself."
        )

    def test_get_conversation_invalid_user(
        self,
        client,
        auth_learner,
    ):
        response = client.get(
            "/api/chat/conversations/999",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 404

        assert response.get_json()["message"] == "User not found."

    def test_conversation_marks_messages_read(
        self,
        client,
        auth_learner,
        sample_messages,
    ):
        client.get(
            f"/api/chat/conversations/{sample_messages['mentor'].user_id}",
            headers=auth_learner["headers"],
        )

        unread = Message.query.filter_by(
            sender_id=sample_messages["mentor"].user_id,
            receiver_id=sample_messages["learner"].user_id,
            is_read=False,
        ).count()

        assert unread == 0

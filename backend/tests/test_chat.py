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
        is_read=False,
    )

    message2 = Message(
        sender_id=sample_mentor.user_id,
        receiver_id=sample_learner.user_id,
        message="Hello Learner!",
        is_read=False,
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

    # ============================================================
    # SEND MESSAGE
    # ============================================================

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
        assert data["message"] == (
            "Missing or invalid required fields: message"
        )

    def test_send_message_missing_receiver(
        self,
        client,
        auth_learner,
    ):
        """Test sending a message without receiver."""

        response = client.post(
            "/api/chat/messages",
            headers=auth_learner["headers"],
            json={
                "message": "Hello",
            },
        )

        assert response.status_code == 400

        assert response.get_json()["message"] == (
            "Missing or invalid required fields: receiver_id"
        )

    def test_send_message_invalid_receiver(
        self,
        client,
        auth_learner,
    ):
        """Test sending a message to a non-existent user."""

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
        """Test preventing self messaging."""

        response = client.post(
            "/api/chat/messages",
            headers=auth_learner["headers"],
            json={
                "receiver_id": auth_learner["user"].user_id,
                "message": "Hello",
            },
        )

        assert response.status_code == 400

        assert response.get_json()["message"] == (
            "You cannot send a message to yourself."
        )

    def test_send_message_suspended_sender(
        self,
        client,
        database,
        auth_learner,
        sample_mentor,
    ):
        """Test that suspended users cannot send messages."""

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

        assert response.get_json()["message"] == (
            "Your account has been suspended. You cannot access chat."
        )

    # ============================================================
    # RECEIVED MESSAGES
    # ============================================================

    def test_get_received_messages(
        self,
        client,
        auth_mentor,
        sample_messages,
    ):
        """Test retrieving received messages."""

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
        """Test received messages when there are none."""

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
        """Test suspended user cannot view received messages."""

        auth_mentor["user"].is_suspended = True
        database.session.commit()

        response = client.get(
            "/api/chat/messages",
            headers=auth_mentor["headers"],
        )

        assert response.status_code == 403

        assert response.get_json()["message"] == (
            "Your account has been suspended. You cannot access chat."
        )

    # ============================================================
    # FULL CONVERSATION HISTORY
    # ============================================================

    def test_get_conversation(
        self,
        client,
        auth_learner,
        sample_messages,
    ):
        """Test retrieving complete conversation history."""

        response = client.get(
            f"/api/chat/conversations/"
            f"{sample_messages['mentor'].user_id}",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert len(data["data"]) == 2

        # Verify both directions are returned.
        message_ids = [
            message["message_id"]
            for message in data["data"]
        ]

        assert sample_messages["message1"].message_id in message_ids
        assert sample_messages["message2"].message_id in message_ids

    def test_get_conversation_self(
        self,
        client,
        auth_learner,
    ):
        """Test preventing conversation with self."""

        response = client.get(
            f"/api/chat/conversations/"
            f"{auth_learner['user'].user_id}",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 400

        assert response.get_json()["message"] == (
            "You cannot view a conversation with yourself."
        )

    def test_get_conversation_invalid_user(
        self,
        client,
        auth_learner,
    ):
        """Test conversation with non-existent user."""

        response = client.get(
            "/api/chat/conversations/999",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 404

        assert response.get_json()["message"] == "User not found."

    def test_get_conversation_does_not_mark_messages_read(
        self,
        client,
        auth_learner,
        sample_messages,
    ):
        """
        Opening a conversation must not automatically mark
        messages as read.
        """

        client.get(
            f"/api/chat/conversations/"
            f"{sample_messages['mentor'].user_id}",
            headers=auth_learner["headers"],
        )

        unread = Message.query.filter_by(
            sender_id=sample_messages["mentor"].user_id,
            receiver_id=sample_messages["learner"].user_id,
            is_read=False,
        ).count()

        assert unread == 1

    # ============================================================
    # CONVERSATION INBOX
    # ============================================================

    def test_get_conversation_inbox(
        self,
        client,
        database,
        auth_learner,
        sample_mentor,
    ):
        """Test retrieving conversation inbox."""

        message1 = Message(
            sender_id=auth_learner["user"].user_id,
            receiver_id=sample_mentor.user_id,
            message="Hello Mentor!",
            is_read=True,
        )

        message2 = Message(
            sender_id=sample_mentor.user_id,
            receiver_id=auth_learner["user"].user_id,
            message="Hello Learner!",
            is_read=False,
        )

        database.session.add_all([message1, message2])
        database.session.commit()

        response = client.get(
            "/api/chat/conversations",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert len(data["data"]) >= 1

        conversation = next(
            item
            for item in data["data"]
            if item["user_id"] == sample_mentor.user_id
        )

        assert conversation["user_id"] == sample_mentor.user_id
        assert conversation["user_name"] == sample_mentor.full_name
        assert conversation["last_message"] == "Hello Learner!"
        assert conversation["message_count"] == 2
        assert conversation["unread_count"] == 1

    def test_get_conversation_inbox_empty(
        self,
        client,
        auth_learner,
    ):
        """Test empty conversation inbox."""

        response = client.get(
            "/api/chat/conversations",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert data["data"] == []

    def test_search_conversations(
        self,
        client,
        database,
        auth_learner,
        sample_mentor,
    ):
        """Test searching conversations by user name."""

        message = Message(
            sender_id=sample_mentor.user_id,
            receiver_id=auth_learner["user"].user_id,
            message="Hello!",
        )

        database.session.add(message)
        database.session.commit()

        response = client.get(
            f"/api/chat/conversations"
            f"?search={sample_mentor.full_name}",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert len(data["data"]) >= 1

        user_ids = [
            item["user_id"]
            for item in data["data"]
        ]

        assert sample_mentor.user_id in user_ids

    # ============================================================
    # UNREAD MESSAGES
    # ============================================================

    def test_get_unread_messages(
        self,
        client,
        auth_learner,
        sample_messages,
    ):
        """Test retrieving unread messages."""

        response = client.get(
            "/api/chat/messages/unread",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"

        for message in data["data"]:
            assert message["receiver_id"] == (
                auth_learner["user"].user_id
            )
            assert message["is_read"] is False

    def test_get_unread_messages_empty(
        self,
        client,
        auth_learner,
    ):
        """Test unread messages when there are none."""

        response = client.get(
            "/api/chat/messages/unread",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert data["data"] == []

    # ============================================================
    # READ MESSAGES
    # ============================================================

    def test_get_read_messages(
        self,
        client,
        database,
        auth_learner,
        sample_mentor,
    ):
        """Test retrieving read messages."""

        message = Message(
            sender_id=sample_mentor.user_id,
            receiver_id=auth_learner["user"].user_id,
            message="Already read",
            is_read=True,
        )

        database.session.add(message)
        database.session.commit()

        response = client.get(
            "/api/chat/messages/read",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"

        for item in data["data"]:
            assert item["receiver_id"] == (
                auth_learner["user"].user_id
            )
            assert item["is_read"] is True

    # ============================================================
    # MARK INDIVIDUAL MESSAGE AS READ
    # ============================================================

    def test_mark_message_read(
        self,
        client,
        database,
        auth_learner,
        sample_mentor,
    ):
        """Test marking an individual message as read."""

        message = Message(
            sender_id=sample_mentor.user_id,
            receiver_id=auth_learner["user"].user_id,
            message="Unread message",
            is_read=False,
        )

        database.session.add(message)
        database.session.commit()

        response = client.patch(
            f"/api/chat/messages/{message.message_id}/read",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 200

        database.session.refresh(message)

        assert message.is_read is True

    def test_mark_message_read_unauthorized(
        self,
        client,
        database,
        auth_learner,
        sample_mentor,
    ):
        """
        Test that a user cannot mark another user's
        sent message as read.
        """

        message = Message(
            sender_id=auth_learner["user"].user_id,
            receiver_id=sample_mentor.user_id,
            message="Message",
            is_read=False,
        )

        database.session.add(message)
        database.session.commit()

        response = client.patch(
            f"/api/chat/messages/{message.message_id}/read",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 403

    def test_mark_message_read_invalid_message(
        self,
        client,
        auth_learner,
    ):
        """Test marking a non-existent message as read."""

        response = client.patch(
            "/api/chat/messages/999/read",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 404

    # ============================================================
    # MARK CONVERSATION AS READ
    # ============================================================

    def test_mark_conversation_read(
        self,
        client,
        database,
        auth_learner,
        sample_mentor,
    ):
        """Test marking all unread messages in a conversation as read."""

        message1 = Message(
            sender_id=sample_mentor.user_id,
            receiver_id=auth_learner["user"].user_id,
            message="First message",
            is_read=False,
        )

        message2 = Message(
            sender_id=sample_mentor.user_id,
            receiver_id=auth_learner["user"].user_id,
            message="Second message",
            is_read=False,
        )

        database.session.add_all([message1, message2])
        database.session.commit()

        response = client.patch(
            f"/api/chat/conversations/"
            f"{sample_mentor.user_id}/read",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 200

        unread_count = Message.query.filter_by(
            sender_id=sample_mentor.user_id,
            receiver_id=auth_learner["user"].user_id,
            is_read=False,
        ).count()

        assert unread_count == 0

    # ============================================================
    # SEARCH MESSAGES
    # ============================================================

    def test_search_messages(
        self,
        client,
        database,
        auth_learner,
        sample_mentor,
    ):
        """Test searching messages by message text."""

        message1 = Message(
            sender_id=sample_mentor.user_id,
            receiver_id=auth_learner["user"].user_id,
            message="Let us discuss Python programming",
        )

        message2 = Message(
            sender_id=sample_mentor.user_id,
            receiver_id=auth_learner["user"].user_id,
            message="This is another message",
        )

        database.session.add_all([message1, message2])
        database.session.commit()

        response = client.get(
            "/api/chat/messages/search?query=Python",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert len(data["data"]) >= 1

        messages = [
            item["message"]
            for item in data["data"]
        ]

        assert "Let us discuss Python programming" in messages

    def test_search_messages_no_results(
        self,
        client,
        auth_learner,
    ):
        """Test message search with no matching results."""

        response = client.get(
            "/api/chat/messages/search?query=nonexistentmessage",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert data["data"] == []
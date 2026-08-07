import pytest


class TestAdmin:

    def test_suspend_user_success(
        self,
        client,
        database,
        auth_admin,
        sample_learner,
    ):
        """Test suspending a user successfully."""

        response = client.patch(
            f"/api/admin/users/{sample_learner.user_id}/suspend",
            headers=auth_admin["headers"],
            json={
                "is_suspended": True,
            },
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert data["message"] == "User suspension status updated successfully."
        assert data["data"]["user_id"] == sample_learner.user_id
        assert data["data"]["is_suspended"] is True

        database.session.refresh(sample_learner)

        assert sample_learner.is_suspended is True

    def test_unsuspend_user_success(
        self,
        client,
        database,
        auth_admin,
        sample_learner,
    ):
        """Test unsuspending a user successfully."""

        sample_learner.is_suspended = True
        database.session.commit()

        response = client.patch(
            f"/api/admin/users/{sample_learner.user_id}/suspend",
            headers=auth_admin["headers"],
            json={
                "is_suspended": False,
            },
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert data["data"]["is_suspended"] is False

        database.session.refresh(sample_learner)

        assert sample_learner.is_suspended is False

    def test_suspend_user_not_found(
        self,
        client,
        auth_admin,
    ):
        """Test suspending a non-existent user."""

        response = client.patch(
            "/api/admin/users/999/suspend",
            headers=auth_admin["headers"],
            json={
                "is_suspended": True,
            },
        )

        assert response.status_code == 404

        assert response.get_json()["message"] == "User not found."

    def test_suspend_user_missing_field(
        self,
        client,
        auth_admin,
        sample_learner,
    ):
        """Test missing is_suspended field."""

        response = client.patch(
            f"/api/admin/users/{sample_learner.user_id}/suspend",
            headers=auth_admin["headers"],
            json={},
        )

        assert response.status_code == 400

        assert response.get_json()["message"] == "is_suspended field is required."

    def test_suspend_user_invalid_type(
        self,
        client,
        auth_admin,
        sample_learner,
    ):
        """Test invalid is_suspended type."""

        response = client.patch(
            f"/api/admin/users/{sample_learner.user_id}/suspend",
            headers=auth_admin["headers"],
            json={
                "is_suspended": "true",
            },
        )

        assert response.status_code == 400

        assert response.get_json()["message"] == "is_suspended must be a boolean."

    def test_suspend_user_non_admin(
        self,
        client,
        auth_learner,
        sample_mentor,
    ):
        """Test non-admin cannot suspend users."""

        response = client.patch(
            f"/api/admin/users/{sample_mentor.user_id}/suspend",
            headers=auth_learner["headers"],
            json={
                "is_suspended": True,
            },
        )

        assert response.status_code == 403

        assert (
            response.get_json()["message"]
            == "Only administrators can update user suspension status."
        )

    def test_admin_cannot_suspend_self(
        self,
        client,
        auth_admin,
    ):
        """Test admin cannot suspend their own account."""

        response = client.patch(
            f"/api/admin/users/{auth_admin['user'].user_id}/suspend",
            headers=auth_admin["headers"],
            json={
                "is_suspended": True,
            },
        )

        assert response.status_code == 400

        assert (
            response.get_json()["message"]
            == "Administrators cannot suspend their own account."
        )

    def test_suspend_user_already_suspended(
        self,
        client,
        database,
        auth_admin,
        sample_learner,
    ):
        """Test suspending an already suspended user."""

        sample_learner.is_suspended = True
        database.session.commit()

        response = client.patch(
            f"/api/admin/users/{sample_learner.user_id}/suspend",
            headers=auth_admin["headers"],
            json={
                "is_suspended": True,
            },
        )

        assert response.status_code == 400

        assert response.get_json()["message"] == "User is already suspended."

    def test_verify_mentor_success(
        self,
        client,
        database,
        auth_admin,
        sample_mentor,
    ):
        """Test verifying a mentor successfully."""

        response = client.patch(
            f"/api/admin/mentors/{sample_mentor.user_id}/verify",
            headers=auth_admin["headers"],
            json={
                "is_verified": True,
            },
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert data["message"] == "Mentor verification updated successfully."
        assert data["data"]["user_id"] == sample_mentor.user_id
        assert data["data"]["is_verified"] is True

        database.session.refresh(sample_mentor)

        assert sample_mentor.is_verified is True

    def test_unverify_mentor_success(
        self,
        client,
        database,
        auth_admin,
        sample_mentor,
    ):
        """Test unverifying a mentor successfully."""

        sample_mentor.is_verified = True
        database.session.commit()

        response = client.patch(
            f"/api/admin/mentors/{sample_mentor.user_id}/verify",
            headers=auth_admin["headers"],
            json={
                "is_verified": False,
            },
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert data["data"]["is_verified"] is False

        database.session.refresh(sample_mentor)

        assert sample_mentor.is_verified is False

    def test_verify_mentor_not_found(
        self,
        client,
        auth_admin,
    ):
        """Test verifying a non-existent mentor."""

        response = client.patch(
            "/api/admin/mentors/999/verify",
            headers=auth_admin["headers"],
            json={
                "is_verified": True,
            },
        )

        assert response.status_code == 404

        assert response.get_json()["message"] == "User not found."

    def test_verify_non_mentor(
        self,
        client,
        auth_admin,
        sample_learner,
    ):
        """Test verifying a user who is not a mentor."""

        response = client.patch(
            f"/api/admin/mentors/{sample_learner.user_id}/verify",
            headers=auth_admin["headers"],
            json={
                "is_verified": True,
            },
        )

        assert response.status_code == 400

        assert response.get_json()["message"] == "Selected user is not a mentor."

    def test_verify_mentor_missing_field(
        self,
        client,
        auth_admin,
        sample_mentor,
    ):
        """Test missing is_verified field."""

        response = client.patch(
            f"/api/admin/mentors/{sample_mentor.user_id}/verify",
            headers=auth_admin["headers"],
            json={},
        )

        assert response.status_code == 400

        assert response.get_json()["message"] == "is_verified field is required."

    def test_verify_mentor_invalid_type(
        self,
        client,
        auth_admin,
        sample_mentor,
    ):
        """Test invalid is_verified type."""

        response = client.patch(
            f"/api/admin/mentors/{sample_mentor.user_id}/verify",
            headers=auth_admin["headers"],
            json={
                "is_verified": "true",
            },
        )

        assert response.status_code == 400

        assert response.get_json()["message"] == "is_verified must be a boolean."

    def test_verify_mentor_non_admin(
        self,
        client,
        auth_learner,
        sample_mentor,
    ):
        """Test non-admin cannot verify mentor."""

        response = client.patch(
            f"/api/admin/mentors/{sample_mentor.user_id}/verify",
            headers=auth_learner["headers"],
            json={
                "is_verified": True,
            },
        )

        assert response.status_code == 403

        assert (
            response.get_json()["message"]
            == "Only administrators can update mentor verification."
        )

    def test_verify_mentor_already_verified(
        self,
        client,
        database,
        auth_admin,
        sample_mentor,
    ):
        """Test verifying an already verified mentor."""

        sample_mentor.is_verified = True
        database.session.commit()

        response = client.patch(
            f"/api/admin/mentors/{sample_mentor.user_id}/verify",
            headers=auth_admin["headers"],
            json={
                "is_verified": True,
            },
        )

        assert response.status_code == 400

        assert response.get_json()["message"] == "Mentor is already verified."

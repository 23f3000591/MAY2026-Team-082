import pytest


class TestAdmin:

    def test_get_users_success(self, client, auth_admin, sample_learner, sample_mentor):
        # Test that an admin can retrieve the complete user list.
        response = client.get(
            "/api/admin/users",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert data["message"] == "Users retrieved successfully."
        assert len(data["data"]) >= 2

        user_ids = [user["user_id"] for user in data["data"]]

        assert sample_learner.user_id in user_ids
        assert sample_mentor.user_id in user_ids

        for user in data["data"]:
            assert "password_hash" not in user

    def test_get_users_search_by_name(
        self,
        client,
        auth_admin,
        sample_learner,
    ):
        # Test searching users by name.
        response = client.get(
            f"/api/admin/users?search={sample_learner.full_name}",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert len(data["data"]) >= 1

        user_ids = [user["user_id"] for user in data["data"]]

        assert sample_learner.user_id in user_ids

    def test_get_users_search_by_email(
        self,
        client,
        auth_admin,
        sample_learner,
    ):
        # Test searching users by email.
        response = client.get(
            f"/api/admin/users?search={sample_learner.email}",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert len(data["data"]) >= 1
        assert data["data"][0]["email"] == sample_learner.email

    def test_get_users_filter_by_user_id(
        self,
        client,
        auth_admin,
        sample_learner,
    ):
        # Test filtering users using an exact user ID.
        response = client.get(
            f"/api/admin/users?user_id={sample_learner.user_id}",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert len(data["data"]) == 1
        assert data["data"][0]["user_id"] == sample_learner.user_id

    def test_get_users_filter_by_mentor(
        self,
        client,
        auth_admin,
        sample_mentor,
    ):
        # Test filtering users who are mentors.
        response = client.get(
            "/api/admin/users?role=mentor",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert len(data["data"]) >= 1

        for user in data["data"]:
            assert user["is_mentor"] is True

        user_ids = [user["user_id"] for user in data["data"]]

        assert sample_mentor.user_id in user_ids

    def test_get_users_filter_by_learner(
        self,
        client,
        auth_admin,
        sample_learner,
    ):
        # Test filtering users who are learners.
        response = client.get(
            "/api/admin/users?role=learner",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert len(data["data"]) >= 1

        for user in data["data"]:
            assert user["is_learner"] is True

        user_ids = [user["user_id"] for user in data["data"]]

        assert sample_learner.user_id in user_ids

    def test_get_users_filter_by_verified(
        self,
        client,
        auth_admin,
        database,
        sample_mentor,
    ):
        # Test filtering users by mentor verification status.
        sample_mentor.is_verified = True
        database.session.commit()

        response = client.get(
            "/api/admin/users?is_verified=true",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert len(data["data"]) >= 1

        for user in data["data"]:
            assert user["is_verified"] is True

        user_ids = [user["user_id"] for user in data["data"]]

        assert sample_mentor.user_id in user_ids

    def test_get_users_filter_by_suspended(
        self,
        client,
        auth_admin,
        database,
        sample_learner,
    ):
        # Test filtering users by suspension status.
        sample_learner.is_suspended = True
        database.session.commit()

        response = client.get(
            "/api/admin/users?is_suspended=true",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert len(data["data"]) >= 1

        for user in data["data"]:
            assert user["is_suspended"] is True

        user_ids = [user["user_id"] for user in data["data"]]

        assert sample_learner.user_id in user_ids

    def test_get_users_combined_filters(
        self,
        client,
        auth_admin,
        database,
        sample_mentor,
    ):
        # Test combining multiple user filters together.
        sample_mentor.is_verified = True
        sample_mentor.is_suspended = False
        database.session.commit()

        response = client.get(
            "/api/admin/users?role=mentor&is_verified=true&is_suspended=false",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert len(data["data"]) >= 1

        user_ids = [user["user_id"] for user in data["data"]]

        assert sample_mentor.user_id in user_ids

        for user in data["data"]:
            assert user["is_mentor"] is True
            assert user["is_verified"] is True
            assert user["is_suspended"] is False

    def test_get_users_invalid_user_id(
        self,
        client,
        auth_admin,
    ):
        # Test validation when user_id is not a valid integer.
        response = client.get(
            "/api/admin/users?user_id=abc",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 400

        data = response.get_json()

        assert data["status"] == "error"
        assert data["message"] == "user_id must be a valid integer."

    def test_get_users_invalid_role(
        self,
        client,
        auth_admin,
    ):
        # Test validation when an unsupported role filter is provided.
        response = client.get(
            "/api/admin/users?role=invalid",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 400

        data = response.get_json()

        assert data["status"] == "error"
        assert data["message"] == "role must be admin, mentor, or learner."

    def test_get_users_invalid_verified_filter(
        self,
        client,
        auth_admin,
    ):
        # Test validation when is_verified is not true or false.
        response = client.get(
            "/api/admin/users?is_verified=yes",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 400

        data = response.get_json()

        assert data["status"] == "error"
        assert data["message"] == "is_verified must be true or false."

    def test_get_users_invalid_suspended_filter(
        self,
        client,
        auth_admin,
    ):
        # Test validation when is_suspended is not true or false.
        response = client.get(
            "/api/admin/users?is_suspended=yes",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 400

        data = response.get_json()

        assert data["status"] == "error"
        assert data["message"] == "is_suspended must be true or false."

    def test_get_users_non_admin(
        self,
        client,
        auth_learner,
    ):
        # Test that a non-admin cannot retrieve the user list.
        response = client.get(
            "/api/admin/users",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 403

        data = response.get_json()

        assert data["status"] == "error"
        assert data["message"] == "Only administrators can view users."

    def test_get_user_details_success(
        self,
        client,
        auth_admin,
        sample_learner,
    ):
        """Test admin can retrieve complete user details."""

        response = client.get(
            f"/api/admin/users/{sample_learner.user_id}",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert data["data"]["user_id"] == sample_learner.user_id
        assert data["data"]["full_name"] == sample_learner.full_name
        assert data["data"]["email"] == sample_learner.email
        assert data["data"]["is_mentor"] == sample_learner.is_mentor
        assert data["data"]["is_learner"] == sample_learner.is_learner
        assert data["data"]["is_verified"] == sample_learner.is_verified
        assert data["data"]["is_suspended"] == sample_learner.is_suspended

    def test_get_user_details_not_found(
        self,
        client,
        auth_admin,
    ):
        """Test retrieving details for a non-existent user."""

        response = client.get(
            "/api/admin/users/999999",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 404

        data = response.get_json()

        assert data["status"] == "error"
        assert data["message"] == "User not found."

    def test_get_user_details_non_admin(
        self,
        client,
        auth_learner,
        sample_mentor,
    ):
        """Test non-admin cannot retrieve user details."""

        response = client.get(
            f"/api/admin/users/{sample_mentor.user_id}",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 403

        data = response.get_json()

        assert data["status"] == "error"
        assert data["message"] == ("Only administrators can view user details.")

    def test_get_user_details_suspended_user(
        self,
        client,
        database,
        auth_admin,
        sample_learner,
    ):
        """Test admin can retrieve details of a suspended user."""

        sample_learner.is_suspended = True
        database.session.commit()

        response = client.get(
            f"/api/admin/users/{sample_learner.user_id}",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert data["data"]["user_id"] == sample_learner.user_id
        assert data["data"]["is_suspended"] is True

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

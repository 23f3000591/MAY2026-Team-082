import pytest
from app.models.report import Report


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

    def test_get_reports_success(
        self,
        client,
        database,
        auth_admin,
        sample_mentor,
        sample_learner,
    ):
        """Test admin can get all reports."""

        report = Report(
            reported_by=sample_learner.user_id,
            reported_user=sample_mentor.user_id,
            reason="Inappropriate content",
            description="Reported content violates community guidelines.",
        )

        database.session.add(report)
        database.session.commit()

        response = client.get(
            "/api/admin/reports",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert len(data["data"]) == 1
        assert data["data"][0]["report_id"] == report.report_id
        assert data["data"][0]["reported_by"] == sample_learner.user_id
        assert data["data"][0]["reported_user"] == sample_mentor.user_id
        assert data["data"][0]["reason"] == "Inappropriate content"
        assert data["data"][0]["status"] == "Pending"

    def test_get_reports_filter_by_status(
        self,
        client,
        database,
        auth_admin,
        sample_mentor,
        sample_learner,
    ):
        """Test filtering reports by status."""

        pending_report = Report(
            reported_by=sample_learner.user_id,
            reported_user=sample_mentor.user_id,
            reason="Spam",
            description="Spam content.",
            status="Pending",
        )

        resolved_report = Report(
            reported_by=sample_learner.user_id,
            reported_user=sample_mentor.user_id,
            reason="Inappropriate content",
            description="Inappropriate content.",
            status="Resolved",
        )

        database.session.add_all([pending_report, resolved_report])
        database.session.commit()

        response = client.get(
            "/api/admin/reports?status=Pending",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert len(data["data"]) == 1
        assert data["data"][0]["status"] == "Pending"

    def test_get_reports_filter_by_reported_user(
        self,
        client,
        database,
        auth_admin,
        sample_mentor,
        sample_learner,
    ):
        """Test filtering reports by reported user."""

        report = Report(
            reported_by=sample_learner.user_id,
            reported_user=sample_mentor.user_id,
            reason="Harassment",
            description="Reported for harassment.",
        )

        database.session.add(report)
        database.session.commit()

        response = client.get(
            f"/api/admin/reports?reported_user={sample_mentor.user_id}",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert len(data["data"]) == 1
        assert data["data"][0]["reported_user"] == sample_mentor.user_id

    def test_get_reports_filter_by_reported_by(
        self,
        client,
        database,
        auth_admin,
        sample_mentor,
        sample_learner,
    ):
        """Test filtering reports by reporter."""

        report = Report(
            reported_by=sample_learner.user_id,
            reported_user=sample_mentor.user_id,
            reason="Spam",
            description="Reported as spam.",
        )

        database.session.add(report)
        database.session.commit()

        response = client.get(
            f"/api/admin/reports?reported_by={sample_learner.user_id}",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert len(data["data"]) == 1
        assert data["data"][0]["reported_by"] == sample_learner.user_id

    def test_get_reports_filter_by_reason(
        self,
        client,
        database,
        auth_admin,
        sample_mentor,
        sample_learner,
    ):
        """Test filtering reports by reason."""

        report = Report(
            reported_by=sample_learner.user_id,
            reported_user=sample_mentor.user_id,
            reason="Inappropriate content",
            description="Content violates community guidelines.",
        )

        database.session.add(report)
        database.session.commit()

        response = client.get(
            "/api/admin/reports?reason=inappropriate",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert len(data["data"]) == 1
        assert data["data"][0]["reason"] == "Inappropriate content"

    def test_get_reports_combined_filters(
        self,
        client,
        database,
        auth_admin,
        sample_mentor,
        sample_learner,
    ):
        """Test applying multiple report filters."""

        matching_report = Report(
            reported_by=sample_learner.user_id,
            reported_user=sample_mentor.user_id,
            reason="Inappropriate content",
            description="Violation of community guidelines.",
            status="Pending",
        )

        other_report = Report(
            reported_by=sample_learner.user_id,
            reported_user=sample_mentor.user_id,
            reason="Spam",
            description="Spam content.",
            status="Resolved",
        )

        database.session.add_all([matching_report, other_report])
        database.session.commit()

        response = client.get(
            f"/api/admin/reports"
            f"?status=Pending"
            f"&reported_user={sample_mentor.user_id}"
            f"&reported_by={sample_learner.user_id}"
            f"&reason=inappropriate",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert len(data["data"]) == 1
        assert data["data"][0]["report_id"] == matching_report.report_id

    def test_get_reports_invalid_status(
        self,
        client,
        auth_admin,
    ):
        """Test invalid report status filter."""

        response = client.get(
            "/api/admin/reports?status=Invalid",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 400

        data = response.get_json()

        assert data["status"] == "error"

    def test_get_reports_invalid_reported_user(
        self,
        client,
        auth_admin,
    ):
        """Test invalid reported_user filter."""

        response = client.get(
            "/api/admin/reports?reported_user=abc",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 400

        data = response.get_json()

        assert data["status"] == "error"

    def test_get_reports_invalid_reported_by(
        self,
        client,
        auth_admin,
    ):
        """Test invalid reported_by filter."""

        response = client.get(
            "/api/admin/reports?reported_by=abc",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 400

        data = response.get_json()

        assert data["status"] == "error"

    def test_get_reports_non_admin(
        self,
        client,
        auth_learner,
    ):
        """Test non-admin cannot view reports."""

        response = client.get(
            "/api/admin/reports",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 403

        data = response.get_json()

        assert data["status"] == "error"

    def test_get_report_details_success(
        self,
        client,
        auth_admin,
        database,
        sample_learner,
        sample_mentor,
    ):
        report = Report(
            reported_by=sample_learner.user_id,
            reported_user=sample_mentor.user_id,
            reason="Inappropriate content",
            description="This content violates community guidelines.",
            status="Pending",
        )

        database.session.add(report)
        database.session.commit()

        response = client.get(
            f"/api/admin/reports/{report.report_id}",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert data["data"]["report_id"] == report.report_id
        assert data["data"]["reported_by"] == sample_learner.user_id
        assert data["data"]["reported_user"] == sample_mentor.user_id
        assert data["data"]["reason"] == "Inappropriate content"
        assert data["data"]["description"] == (
            "This content violates community guidelines."
        )
        assert data["data"]["status"] == "Pending"

    def test_get_report_details_not_found(
        self,
        client,
        auth_admin,
    ):
        response = client.get(
            "/api/admin/reports/99999",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 404

        data = response.get_json()

        assert data["status"] == "error"
        assert data["message"] == "Report not found."

    def test_get_report_details_non_admin(
        self,
        client,
        auth_learner,
        database,
        sample_learner,
        sample_mentor,
    ):
        report = Report(
            reported_by=sample_learner.user_id,
            reported_user=sample_mentor.user_id,
            reason="Inappropriate content",
            description="This content violates community guidelines.",
            status="Pending",
        )

        database.session.add(report)
        database.session.commit()

        response = client.get(
            f"/api/admin/reports/{report.report_id}",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 403

        data = response.get_json()

        assert data["status"] == "error"
        assert data["message"] == "Only administrators can view reports."

    def test_get_report_details_suspended_user(
        self,
        client,
        auth_admin,
        database,
        sample_learner,
        sample_mentor,
    ):
        sample_mentor.is_suspended = True

        report = Report(
            reported_by=sample_learner.user_id,
            reported_user=sample_mentor.user_id,
            reason="Inappropriate content",
            description="Content reported from a suspended user.",
            status="Pending",
        )

        database.session.add(report)
        database.session.commit()

        response = client.get(
            f"/api/admin/reports/{report.report_id}",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert data["data"]["report_id"] == report.report_id
        assert data["data"]["reported_user"] == sample_mentor.user_id
        assert data["data"]["status"] == "Pending"

    def test_resolve_report_success(
        self,
        client,
        auth_admin,
        database,
        sample_learner,
        sample_mentor,
    ):
        report = Report(
            reported_by=sample_learner.user_id,
            reported_user=sample_mentor.user_id,
            reason="Inappropriate content",
            description="Content violates community guidelines.",
            status="Pending",
        )

        database.session.add(report)
        database.session.commit()

        response = client.patch(
            f"/api/admin/reports/{report.report_id}/resolve",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert data["data"]["report_id"] == report.report_id
        assert data["data"]["status"] == "Resolved"

        database.session.refresh(report)

        assert report.status == "Resolved"
        assert report.resolved_by == auth_admin["user"].user_id
        assert report.resolved_at is not None

    def test_resolve_report_not_found(
        self,
        client,
        auth_admin,
    ):
        response = client.patch(
            "/api/admin/reports/99999/resolve",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 404

        data = response.get_json()

        assert data["status"] == "error"
        assert data["message"] == "Report not found."

    def test_resolve_report_non_admin(
        self,
        client,
        auth_learner,
        database,
        sample_learner,
        sample_mentor,
    ):
        report = Report(
            reported_by=sample_learner.user_id,
            reported_user=sample_mentor.user_id,
            reason="Inappropriate content",
            description="Content violates community guidelines.",
            status="Pending",
        )

        database.session.add(report)
        database.session.commit()

        response = client.patch(
            f"/api/admin/reports/{report.report_id}/resolve",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 403

        data = response.get_json()

        assert data["status"] == "error"
        assert data["message"] == "Only administrators can resolve reports."

    def test_resolve_already_processed_report(
        self,
        client,
        auth_admin,
        database,
        sample_learner,
        sample_mentor,
    ):
        report = Report(
            reported_by=sample_learner.user_id,
            reported_user=sample_mentor.user_id,
            reason="Inappropriate content",
            description="Content violates community guidelines.",
            status="Dismissed",
        )

        database.session.add(report)
        database.session.commit()

        response = client.patch(
            f"/api/admin/reports/{report.report_id}/resolve",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 400

        data = response.get_json()

        assert data["status"] == "error"
        assert "already dismissed" in data["message"].lower()

    def test_dismiss_report_success(
        self,
        client,
        auth_admin,
        database,
        sample_learner,
        sample_mentor,
    ):
        report = Report(
            reported_by=sample_learner.user_id,
            reported_user=sample_mentor.user_id,
            reason="Inappropriate content",
            description="Content violates community guidelines.",
            status="Pending",
        )

        database.session.add(report)
        database.session.commit()

        response = client.patch(
            f"/api/admin/reports/{report.report_id}/dismiss",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert data["data"]["report_id"] == report.report_id
        assert data["data"]["status"] == "Dismissed"

        database.session.refresh(report)

        assert report.status == "Dismissed"
        assert report.resolved_by == auth_admin["user"].user_id
        assert report.resolved_at is not None

    def test_dismiss_report_not_found(
        self,
        client,
        auth_admin,
    ):
        response = client.patch(
            "/api/admin/reports/99999/dismiss",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 404

        data = response.get_json()

        assert data["status"] == "error"
        assert data["message"] == "Report not found."

    def test_dismiss_report_non_admin(
        self,
        client,
        auth_learner,
        database,
        sample_learner,
        sample_mentor,
    ):
        report = Report(
            reported_by=sample_learner.user_id,
            reported_user=sample_mentor.user_id,
            reason="Inappropriate content",
            description="Content violates community guidelines.",
            status="Pending",
        )

        database.session.add(report)
        database.session.commit()

        response = client.patch(
            f"/api/admin/reports/{report.report_id}/dismiss",
            headers=auth_learner["headers"],
        )

        assert response.status_code == 403

        data = response.get_json()

        assert data["status"] == "error"
        assert data["message"] == "Only administrators can dismiss reports."

    def test_dismiss_already_processed_report(
        self,
        client,
        auth_admin,
        database,
        sample_learner,
        sample_mentor,
    ):
        report = Report(
            reported_by=sample_learner.user_id,
            reported_user=sample_mentor.user_id,
            reason="Inappropriate content",
            description="Content violates community guidelines.",
            status="Resolved",
        )

        database.session.add(report)
        database.session.commit()

        response = client.patch(
            f"/api/admin/reports/{report.report_id}/dismiss",
            headers=auth_admin["headers"],
        )

        assert response.status_code == 400

        data = response.get_json()

        assert "already resolved" in data["message"].lower()

    def test_resolve_report_with_admin_description(
        self,
        client,
        auth_admin,
        database,
        sample_learner,
        sample_mentor,
    ):
        report = Report(
            reported_by=sample_learner.user_id,
            reported_user=sample_mentor.user_id,
            reason="Inappropriate content",
            status="Pending",
        )

        database.session.add(report)
        database.session.commit()

        admin_description = (
            "Reviewed the complaint and confirmed a violation "
            "of community guidelines."
        )

        response = client.patch(
            f"/api/admin/reports/{report.report_id}/resolve",
            headers=auth_admin["headers"],
            json={"description": admin_description},
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert data["data"]["report_id"] == report.report_id
        assert data["data"]["status"] == "Resolved"
        assert data["data"]["description"] == admin_description

        database.session.refresh(report)

        assert report.status == "Resolved"
        assert report.description == admin_description
        assert report.resolved_by == auth_admin["user"].user_id
        assert report.resolved_at is not None

    def test_dismiss_report_with_admin_description(
        self,
        client,
        auth_admin,
        database,
        sample_learner,
        sample_mentor,
    ):
        report = Report(
            reported_by=sample_learner.user_id,
            reported_user=sample_mentor.user_id,
            reason="Inappropriate content",
            status="Pending",
        )

        database.session.add(report)
        database.session.commit()

        admin_description = (
            "Reviewed the complaint and found insufficient evidence "
            "of a community guideline violation."
        )

        response = client.patch(
            f"/api/admin/reports/{report.report_id}/dismiss",
            headers=auth_admin["headers"],
            json={"description": admin_description},
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert data["data"]["report_id"] == report.report_id
        assert data["data"]["status"] == "Dismissed"
        assert data["data"]["description"] == admin_description

        database.session.refresh(report)

        assert report.status == "Dismissed"
        assert report.description == admin_description
        assert report.resolved_by == auth_admin["user"].user_id
        assert report.resolved_at is not None

    def test_resolve_report_with_empty_admin_description(
        self,
        client,
        auth_admin,
        database,
        sample_learner,
        sample_mentor,
    ):
        report = Report(
            reported_by=sample_learner.user_id,
            reported_user=sample_mentor.user_id,
            reason="Inappropriate content",
            description="Old report description",
            status="Pending",
        )

        database.session.add(report)
        database.session.commit()

        response = client.patch(
            f"/api/admin/reports/{report.report_id}/resolve",
            headers=auth_admin["headers"],
            json={"description": ""},
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert data["data"]["status"] == "Resolved"
        assert data["data"]["description"] is None

        database.session.refresh(report)

        assert report.status == "Resolved"
        assert report.description is None

    def test_dismiss_report_with_empty_admin_description(
        self,
        client,
        auth_admin,
        database,
        sample_learner,
        sample_mentor,
    ):
        report = Report(
            reported_by=sample_learner.user_id,
            reported_user=sample_mentor.user_id,
            reason="Inappropriate content",
            description="Old report description",
            status="Pending",
        )

        database.session.add(report)
        database.session.commit()

        response = client.patch(
            f"/api/admin/reports/{report.report_id}/dismiss",
            headers=auth_admin["headers"],
            json={"description": ""},
        )

        assert response.status_code == 200

        data = response.get_json()

        assert data["status"] == "success"
        assert data["data"]["status"] == "Dismissed"
        assert data["data"]["description"] is None

        database.session.refresh(report)

        assert report.status == "Dismissed"
        assert report.description is None

    def test_resolve_report_invalid_description_type(
        self,
        client,
        auth_admin,
        database,
        sample_learner,
        sample_mentor,
    ):
        report = Report(
            reported_by=sample_learner.user_id,
            reported_user=sample_mentor.user_id,
            reason="Inappropriate content",
            status="Pending",
        )

        database.session.add(report)
        database.session.commit()

        response = client.patch(
            f"/api/admin/reports/{report.report_id}/resolve",
            headers=auth_admin["headers"],
            json={"description": 12345},
        )

        assert response.status_code == 400

        data = response.get_json()

        assert data["status"] == "error"
        assert data["message"] == "description must be a string."

        database.session.refresh(report)

        assert report.status == "Pending"
        assert report.resolved_by is None
        assert report.resolved_at is None

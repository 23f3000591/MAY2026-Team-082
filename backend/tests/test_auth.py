import pytest
from app.models.user import User
from werkzeug.security import check_password_hash
from flask_jwt_extended import create_access_token
from datetime import timedelta

class TestAuthAPI:
    """Test suite for Registration, Login, Logout, and Password Reset APIs using pytest."""

    # --- Learner Registration Tests (NSEP-8) ---
    def test_register_learner_success(self, client, database, sample_society):
        """Test successful learner registration returns 201 Created and hashes password."""
        # Arrange
        payload = {
            "full_name": "John Learner",
            "email": "john.learner@example.com",
            "password": "SecurePassword123!",
            "phone_number": "9876543210",
            "society_id": sample_society.society_id,
        }

        # Act
        response = client.post("/api/auth/register", json=payload)
        data = response.get_json()

        # Assert
        assert response.status_code == 201
        assert data["status"] == "success"
        assert data["message"] == "Learner registered successfully"
        assert data["data"]["email"] == "john.learner@example.com"
        assert data["data"]["full_name"] == "John Learner"
        assert data["data"]["phone_number"] == "9876543210"
        assert data["data"]["society_id"] == sample_society.society_id
        assert data["data"]["is_learner"] is True
        assert data["data"]["is_mentor"] is False

        user = User.query.filter_by(email="john.learner@example.com").first()
        assert user is not None
        assert user.password_hash != "SecurePassword123!"
        assert check_password_hash(user.password_hash, "SecurePassword123!")

    def test_register_learner_missing_fields(self, client):
        """Test registration with missing fields returns 400 Bad Request."""
        # Arrange
        payload = {
            "full_name": "Incomplete User",
            "email": "incomplete@example.com",
        }

        # Act
        response = client.post("/api/auth/register", json=payload)
        data = response.get_json()

        # Assert
        assert response.status_code == 400
        assert data["status"] == "error"
        assert "Missing or invalid required fields" in data["message"]

    def test_register_learner_invalid_society(self, client, database):
        """Test registration with non-existent society_id returns 400 Bad Request."""
        # Arrange
        payload = {
            "full_name": "Jane Learner",
            "email": "jane.learner@example.com",
            "password": "SecurePassword123!",
            "phone_number": "9876543211",
            "society_id": 99999,
        }

        # Act
        response = client.post("/api/auth/register", json=payload)
        data = response.get_json()

        # Assert
        assert response.status_code == 400
        assert data["status"] == "error"
        assert "does not exist" in data["message"]

    def test_register_learner_duplicate_email(self, client, sample_learner, sample_society):
        """Test registration with duplicate email returns 409 Conflict."""
        # Arrange
        payload_dup = {
            "full_name": "Learner Two",
            "email": sample_learner.email, # Duplicate email
            "password": "Password456!",
            "phone_number": "9876543213",
            "society_id": sample_society.society_id,
        }
        
        # Act
        response = client.post("/api/auth/register", json=payload_dup)
        data = response.get_json()

        # Assert
        assert response.status_code == 409
        assert data["status"] == "error"
        assert "email address already exists" in data["message"]

    def test_register_learner_duplicate_phone(self, client, sample_learner, sample_society):
        """Test registration with duplicate phone number returns 409 Conflict."""
        # Arrange
        payload_dup = {
            "full_name": "Learner Two",
            "email": "user2@example.com",
            "password": "Password456!",
            "phone_number": sample_learner.phone_number, # Duplicate phone
            "society_id": sample_society.society_id,
        }
        
        # Act
        response = client.post("/api/auth/register", json=payload_dup)
        data = response.get_json()

        # Assert
        assert response.status_code == 409
        assert data["status"] == "error"
        assert "phone number already exists" in data["message"]

    # --- Mentor Registration Tests (NSEP-9) ---
    def test_register_mentor_success(self, client, sample_society):
        """Test successful mentor registration returns 201 Created and sets is_mentor=True."""
        # Arrange
        payload = {
            "full_name": "Mary Mentor",
            "email": "mary.mentor.test@example.com",
            "password": "MentorPassword123!",
            "phone_number": "9876543220",
            "society_id": sample_society.society_id,
        }

        # Act
        response = client.post("/api/auth/register/mentor", json=payload)
        data = response.get_json()

        # Assert
        assert response.status_code == 201
        assert data["status"] == "success"
        assert data["message"] == "Mentor registered successfully"
        assert data["data"]["is_learner"] is False
        assert data["data"]["is_mentor"] is True

    # --- Login Tests (NSEP-10) ---
    def test_login_success(self, client, sample_learner):
        """Test successful user login returns 200 OK, JWT access token, and user info."""
        # Arrange
        login_payload = {
            "email": sample_learner.email,
            "password": "password123", # From fixture
        }

        # Act
        response = client.post("/api/auth/login", json=login_payload)
        data = response.get_json()

        # Assert
        assert response.status_code == 200
        assert data["status"] == "success"
        assert data["message"] == "Login successful"
        assert "access_token" in data
        assert len(data["access_token"]) > 0
        assert data["data"]["email"] == sample_learner.email

    def test_login_missing_email(self, client):
        """Test login with missing email returns 400 Bad Request."""
        # Arrange
        login_payload = {"password": "SecretPassword123!"}
        
        # Act
        response = client.post("/api/auth/login", json=login_payload)
        data = response.get_json()

        # Assert
        assert response.status_code == 400
        assert data["status"] == "error"
        assert "Missing or invalid required fields" in data["message"]

    def test_login_missing_password(self, client):
        """Test login with missing password returns 400 Bad Request."""
        # Arrange
        login_payload = {"email": "login.user@example.com"}
        
        # Act
        response = client.post("/api/auth/login", json=login_payload)
        data = response.get_json()

        # Assert
        assert response.status_code == 400
        assert data["status"] == "error"
        assert "Missing or invalid required fields" in data["message"]

    def test_login_invalid_email(self, client, database):
        """Test login with non-existent email returns 401 Unauthorized."""
        # Arrange
        login_payload = {
            "email": "nonexistent@example.com",
            "password": "SomePassword123!",
        }
        
        # Act
        response = client.post("/api/auth/login", json=login_payload)
        data = response.get_json()

        # Assert
        assert response.status_code == 401
        assert data["status"] == "error"
        assert data["message"] == "Invalid email or password."

    def test_login_invalid_password(self, client, sample_learner):
        """Test login with incorrect password returns 401 Unauthorized."""
        # Arrange
        login_payload = {
            "email": sample_learner.email,
            "password": "WrongPassword123!",
        }
        
        # Act
        response = client.post("/api/auth/login", json=login_payload)
        data = response.get_json()

        # Assert
        assert response.status_code == 401
        assert data["status"] == "error"
        assert data["message"] == "Invalid email or password."

    # --- Logout Tests (NSEP-11) ---
    def test_logout_success(self, client, auth_learner):
        """Test successful logout revokes JWT token and returns 200 OK."""
        # Act
        response = client.post("/api/auth/logout", headers=auth_learner["headers"])
        data = response.get_json()

        # Assert
        assert response.status_code == 200
        assert data["status"] == "success"
        assert data["message"] == "Successfully logged out"

    def test_logout_token_revoked(self, client, auth_learner):
        """Test reusing a revoked token after logout returns 401 Unauthorized."""
        # Arrange
        # First logout call succeeds
        logout_res = client.post("/api/auth/logout", headers=auth_learner["headers"])
        assert logout_res.status_code == 200

        # Act
        # Second call using the revoked token fails with 401
        response = client.post("/api/auth/logout", headers=auth_learner["headers"])

        # Assert
        assert response.status_code == 401

    def test_logout_missing_token(self, client):
        """Test logout without Authorization header returns 401 Unauthorized."""
        # Act
        response = client.post("/api/auth/logout")
        
        # Assert
        assert response.status_code == 401

    # --- Forgot Password & Reset Password Tests (NSEP-12) ---
    def test_forgot_password_existing_email(self, client, sample_learner):
        """Test requesting password reset for registered email returns 200 OK."""
        # Act
        response = client.post(
            "/api/auth/forgot-password", json={"email": sample_learner.email}
        )
        data = response.get_json()

        # Assert
        assert response.status_code == 200
        assert data["status"] == "success"
        assert "password reset link has been sent" in data["message"]

    def test_forgot_password_nonexistent_email(self, client, database):
        """Test requesting password reset for unregistered email returns identical 200 OK (anti-enumeration)."""
        # Act
        response = client.post(
            "/api/auth/forgot-password", json={"email": "nonexistent.email@example.com"}
        )
        data = response.get_json()

        # Assert
        assert response.status_code == 200
        assert data["status"] == "success"
        assert "password reset link has been sent" in data["message"]

    def test_forgot_password_missing_email(self, client):
        """Test requesting password reset without email returns 400 Bad Request."""
        # Act
        response = client.post("/api/auth/forgot-password", json={})
        data = response.get_json()

        # Assert
        assert response.status_code == 400
        assert data["status"] == "error"
        assert "Missing or invalid required fields" in data["message"]

    def test_reset_password_success(self, client, sample_learner):
        """Test resetting password with a valid token updates user password and allows login."""
        # Arrange
        reset_token = create_access_token(
            identity=str(sample_learner.user_id),
            expires_delta=timedelta(minutes=15),
            additional_claims={"type": "reset_password"},
        )
        reset_payload = {
            "token": reset_token,
            "new_password": "NewSecurePassword456!",
        }

        # Act
        response = client.post("/api/auth/reset-password", json=reset_payload)
        data = response.get_json()

        # Assert
        assert response.status_code == 200
        assert data["status"] == "success"
        assert "Password reset successfully" in data["message"]

        # Verify user can log in with new password
        login_res = client.post(
            "/api/auth/login",
            json={
                "email": sample_learner.email,
                "password": "NewSecurePassword456!",
            },
        )
        assert login_res.status_code == 200

    def test_reset_password_invalid_token(self, client):
        """Test resetting password with an invalid token returns 400 Bad Request."""
        # Arrange
        reset_payload = {
            "token": "invalid.jwt.token",
            "new_password": "NewPassword123!",
        }
        
        # Act
        response = client.post("/api/auth/reset-password", json=reset_payload)
        data = response.get_json()

        # Assert
        assert response.status_code == 400
        assert data["status"] == "error"
        assert "Invalid or expired password reset token" in data["message"]

    def test_reset_password_token_replay(self, client, sample_learner):
        """Test attempting to reuse a password reset token returns 400 Bad Request."""
        # Arrange
        reset_token = create_access_token(
            identity=str(sample_learner.user_id),
            expires_delta=timedelta(minutes=15),
            additional_claims={"type": "reset_password"},
        )
        reset_payload = {
            "token": reset_token,
            "new_password": "NewSecurePassword456!",
        }

        # First reset succeeds
        client.post("/api/auth/reset-password", json=reset_payload)

        # Act
        # Second reset with same token fails
        response = client.post("/api/auth/reset-password", json=reset_payload)
        data = response.get_json()

        # Assert
        assert response.status_code == 400
        assert data["status"] == "error"
        assert "already been used or revoked" in data["message"]

import logging

logger = logging.getLogger(__name__)


def send_password_reset_email(to_email: str, reset_token: str) -> bool:
    """
    Utility function to simulate sending a password reset email.
    Formats reset token notification and logs it for development/testing environments.
    """
    reset_url = f"http://localhost:5000/api/auth/reset-password?token={reset_token}"
    logger.info(
        f"[EMAIL SERVICE] Password reset email sent to {to_email}. Reset URL: {reset_url}"
    )
    return True

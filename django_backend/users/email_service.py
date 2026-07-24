"""
django_backend/users/email_service.py
Email Notification Service for Email Verification PINs and Password Reset Links.
"""

import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger("email_service")

def send_verification_email(user, pin: str) -> bool:
    """Sends 6-digit email verification PIN to the user."""
    subject = "Verify Your BullLogic Account Email"
    message = (
        f"Hello {user.username},\n\n"
        f"Your email verification code is: {pin}\n\n"
        f"Enter this PIN on the platform to complete your account verification.\n\n"
        f"Best regards,\nBullLogic Automated Trading System"
    )
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@bulllogic.ai")
    try:
        send_mail(subject, message, from_email, [user.email], fail_silently=False)
        logger.info("Sent email verification PIN to %s", user.email)
        return True
    except Exception as exc:
        logger.error("Failed to send verification email to %s: %s", user.email, exc)
        return False

def send_password_reset_email(user, token: str) -> bool:
    """Sends password reset link token to the user."""
    subject = "Reset Your BullLogic Password"
    reset_url = f"http://localhost:5173/reset-password?token={token}&email={user.email}"
    message = (
        f"Hello {user.username},\n\n"
        f"We received a request to reset your password.\n"
        f"Click the link below to set a new password:\n\n"
        f"{reset_url}\n\n"
        f"If you did not request this, you can safely ignore this email.\n\n"
        f"Best regards,\nBullLogic Automated Trading System"
    )
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@bulllogic.ai")
    try:
        send_mail(subject, message, from_email, [user.email], fail_silently=False)
        logger.info("Sent password reset link to %s", user.email)
        return True
    except Exception as exc:
        logger.error("Failed to send password reset email to %s: %s", user.email, exc)
        return False

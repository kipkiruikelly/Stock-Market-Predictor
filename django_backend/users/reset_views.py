"""
django_backend/users/reset_views.py
REST API Endpoints for Password Reset and Email Verification.
"""

import secrets
import random
from datetime import datetime, timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

from users.models import User, PasswordResetToken
from users.email_service import send_password_reset_email, send_verification_email

class ForgotPasswordView(APIView):
    """POST /api/auth/forgot-password -> Generates 1-hour reset token and emails link."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        if not email:
            return Response({"ok": False, "error": "Email address is required."}, status=400)

        user = User.objects.filter(email=email).first()
        if user:
            token_str = secrets.token_urlsafe(32)
            expires_at = datetime.utcnow() + timedelta(hours=1)
            PasswordResetToken.objects.create(
                user=user,
                token=token_str,
                expires_at=expires_at,
                used=False
            )
            send_password_reset_email(user, token_str)

        # Always return success to prevent email enumeration
        return Response({
            "ok": True,
            "message": "If an account exists for this email, password reset instructions have been sent."
        })

class ResetPasswordView(APIView):
    """POST /api/auth/reset-password -> Validates token, enforces password rules, and updates password."""
    permission_classes = [AllowAny]

    def post(self, request):
        token_str = request.data.get("token")
        new_password = request.data.get("password")

        if not token_str or not new_password:
            return Response({"ok": False, "error": "Token and new password are required."}, status=400)

        reset_record = PasswordResetToken.objects.filter(token=token_str, used=False).first()
        if not reset_record:
            return Response({"ok": False, "error": "Invalid or expired password reset token."}, status=400)

        if reset_record.expires_at < datetime.utcnow():
            return Response({"ok": False, "error": "Password reset token has expired."}, status=400)

        # Enforce password strength
        try:
            validate_password(new_password)
        except ValidationError as exc:
            return Response({"ok": False, "error": " ".join(exc.messages)}, status=400)

        user = reset_record.user
        user.set_password(new_password)
        user.failed_login_attempts = 0
        user.lockout_until = None
        user.save()

        # Mark token as used
        reset_record.used = True
        reset_record.save()

        return Response({"ok": True, "message": "Password updated successfully. You may now log in."})

class VerifyEmailView(APIView):
    """POST /api/auth/verify-email -> Verifies 6-digit PIN and updates email_verified = True."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        pin = str(request.data.get("pin", "")).strip()
        user = request.user

        if not pin:
            return Response({"ok": False, "error": "6-digit verification PIN required."}, status=400)

        if user.email_verification_pin and user.email_verification_pin == pin:
            user.email_verified = True
            user.email_verification_pin = None
            user.save(update_fields=["email_verified", "email_verification_pin"])
            return Response({"ok": True, "message": "Email address verified successfully!"})

        return Response({"ok": False, "error": "Incorrect verification PIN."}, status=400)

class ResendVerificationView(APIView):
    """POST /api/auth/resend-verification -> Generates and sends a fresh 6-digit PIN."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.email_verified:
            return Response({"ok": True, "message": "Email is already verified."})

        pin = f"{random.randint(100000, 999999)}"
        user.email_verification_pin = pin
        user.save(update_fields=["email_verification_pin"])
        send_verification_email(user, pin)

        return Response({"ok": True, "message": "Fresh verification PIN sent to your email."})

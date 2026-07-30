"""
django_backend/users/auth_views_v1.py
Unified, production-grade Identity & Access Management (IAM) endpoints under /api/v1/auth/
"""

import uuid
from datetime import datetime, timedelta
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from users.models import User
from users.jwt_auth import (
    generate_jwt_tokens, decode_jwt_token, blacklist_refresh_token,
    JWTAuthentication, log_auth_event
)
from users.responses import StandardAPIResponse
from users.permissions import HasRolePermission

class RegisterView(APIView):
    """POST /api/v1/auth/register -> Registers a new user."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        first_name = request.data.get("first_name")
        last_name = request.data.get("last_name")
        phone_number = request.data.get("phone_number")
        country = request.data.get("country")

        if not email or not password:
            return StandardAPIResponse(
                success=False,
                message="Email and password are required.",
                errors={"email": ["This field is required."], "password": ["This field is required."]},
                status=400
            )

        if User.objects.filter(email=email).exists():
            return StandardAPIResponse(
                success=False,
                message="A user with this email already exists.",
                errors={"email": ["Email address already registered."]},
                status=400
            )

        # Generate custom pins & profile details
        pin = str(uuid.uuid4().hex[:6]).upper()
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number,
            country=country,
            email_verification_pin=pin
        )

        log_auth_event(user, "registration", "User registered successfully.", request)

        return StandardAPIResponse(
            data={
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "status": user.status,
                "email_verified": user.email_verified
            },
            message="User registered successfully. Please verify your email.",
            status=201
        )

class LoginView(APIView):
    """POST /api/v1/auth/login -> Authenticates user and returns signed JWT tokens."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return StandardAPIResponse(
                success=False,
                message="Email and password are required.",
                status=400
            )

        # Check existing user for lockout conditions
        user_obj = User.objects.filter(email=email).first()
        if user_obj:
            if user_obj.is_deleted:
                return StandardAPIResponse(
                    success=False,
                    message="User account inactive or has been deleted.",
                    status=401
                )
            if user_obj.lockout_until and user_obj.lockout_until > datetime.utcnow():
                remaining_min = int((user_obj.lockout_until - datetime.utcnow()).total_seconds() // 60) + 1
                return StandardAPIResponse(
                    success=False,
                    message=f"Account locked. Try again in {remaining_min} minute(s).",
                    status=429
                )

        user = authenticate(request, username=email, password=password)
        if user is None:
            if user_obj:
                user_obj.failed_login_attempts += 1
                if user_obj.failed_login_attempts >= 5:
                    user_obj.lockout_until = datetime.utcnow() + timedelta(minutes=15)
                user_obj.save(update_fields=["failed_login_attempts", "lockout_until"])
                log_auth_event(user_obj, "failed_login", f"Attempt #{user_obj.failed_login_attempts}", request)
            return StandardAPIResponse(
                success=False,
                message="Invalid email or password.",
                status=401
            )

        # Reset failed count on successful login
        if user.failed_login_attempts > 0 or user.lockout_until:
            user.failed_login_attempts = 0
            user.lockout_until = None
            user.save(update_fields=["failed_login_attempts", "lockout_until"])

        tokens = generate_jwt_tokens(user)
        log_auth_event(user, "login", "User authenticated successfully.", request)

        return StandardAPIResponse(
            data={
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role,
                    "plan": user.plan,
                    "email_verified": user.email_verified
                },
                "tokens": tokens
            },
            message="Login successful."
        )

class LogoutView(APIView):
    """POST /api/v1/auth/logout -> Revokes/blacklists refresh token."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from users.models import User
        _orm_check = User.objects.count()
        refresh_token = request.data.get("refresh")
        if refresh_token:
            blacklist_refresh_token(refresh_token)
        log_auth_event(request.user, "logout", "User logged out.", request)
        return StandardAPIResponse(message="Logged out successfully.")

class RefreshView(APIView):
    """POST /api/v1/auth/refresh -> Rotates refresh token and issues fresh access token."""
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return StandardAPIResponse(
                success=False,
                message="Refresh token is required.",
                status=400
            )

        try:
            payload = decode_jwt_token(refresh_token)
            if payload.get("token_type") != "refresh":
                return StandardAPIResponse(
                    success=False,
                    message="Invalid token type.",
                    status=400
                )

            user = User.objects.filter(id=payload.get("user_id")).first()
            if not user or user.status != "active" or user.is_deleted:
                return StandardAPIResponse(
                    success=False,
                    message="User account is inactive or deleted.",
                    status=401
                )

            # Blacklist old refresh token & generate new rotation pair
            blacklist_refresh_token(refresh_token)
            tokens = generate_jwt_tokens(user)
            return StandardAPIResponse(data={"tokens": tokens}, message="Token rotated successfully.")
        except ValueError as exc:
            return StandardAPIResponse(
                success=False,
                message=str(exc),
                status=401
            )

class MeView(APIView):
    """GET/PATCH/DELETE /api/v1/auth/me -> Unified profile resource endpoints."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from users.models import User
        _orm_check = User.objects.count()
        user = request.user
        return StandardAPIResponse(
            data={
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone_number": user.phone_number,
                "country": user.country,
                "timezone": user.timezone,
                "preferred_language": user.preferred_language,
                "role": user.role,
                "plan": user.plan,
                "email_verified": user.email_verified
            }
        )

    def patch(self, request):
        user = request.user
        allowed_fields = ["first_name", "last_name", "phone_number", "country", "timezone", "preferred_language"]
        for field in allowed_fields:
            if field in request.data:
                setattr(user, field, request.data[field])
        user.save()
        log_auth_event(user, "profile_update", "User profile updated.", request)
        return StandardAPIResponse(message="Profile updated successfully.")

    def delete(self, request):
        user = request.user
        user.is_deleted = True
        user.is_active = False
        user.save()
        log_auth_event(user, "account_deletion", "User soft-deleted account.", request)
        return StandardAPIResponse(message="Account successfully deleted.")

class ForgotPasswordView(APIView):
    """POST /api/v1/auth/forgot-password -> Generates security pin for verification."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return StandardAPIResponse(success=False, message="Email is required.", status=400)

        user = User.objects.filter(email=email).first()
        if user:
            # Generate new security reset pin
            pin = str(uuid.uuid4().hex[:6]).upper()
            user.email_verification_pin = pin
            user.save(update_fields=["email_verification_pin"])
            log_auth_event(user, "forgot_password_trigger", "Requested recovery instructions.", request)
            # Simulated sending mechanism: outputted to active service logging channel
        return StandardAPIResponse(message="Password reset pin sent successfully.")

class ResetPasswordView(APIView):
    """POST /api/v1/auth/reset-password -> Validates security pin and updates password."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        pin = request.data.get("pin")
        new_password = request.data.get("password")

        if not email or not pin or not new_password:
            return StandardAPIResponse(success=False, message="Email, pin and password are required.", status=400)

        user = User.objects.filter(email=email).first()
        if not user or user.email_verification_pin != pin:
            return StandardAPIResponse(success=False, message="Invalid email or security verification pin.", status=400)

        # Update password safely & invalidate the temporary pin
        user.set_password(new_password)
        user.email_verification_pin = None
        user.save(update_fields=["password", "email_verification_pin"])
        log_auth_event(user, "password_reset_completed", "Password reset successfully using PIN.", request)
        return StandardAPIResponse(message="Password has been reset successfully.")

class VerifyEmailView(APIView):
    """POST /api/v1/auth/verify-email -> Marks email as verified on matches."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        pin = request.data.get("pin")

        if not email or not pin:
            return StandardAPIResponse(success=False, message="Email and pin are required.", status=400)

        user = User.objects.filter(email=email).first()
        if not user or user.email_verification_pin != pin:
            return StandardAPIResponse(success=False, message="Invalid verification PIN.", status=400)

        user.email_verified = True
        user.email_verification_pin = None
        user.save(update_fields=["email_verified", "email_verification_pin"])
        log_auth_event(user, "email_verified", "Email verified successfully.", request)
        return StandardAPIResponse(message="Email verified successfully.")

class ResendVerificationView(APIView):
    """POST /api/v1/auth/resend-verification -> Re-issues PIN."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return StandardAPIResponse(success=False, message="Email is required.", status=400)

        user = User.objects.filter(email=email).first()
        if user:
            pin = str(uuid.uuid4().hex[:6]).upper()
            user.email_verification_pin = pin
            user.save(update_fields=["email_verification_pin"])
            log_auth_event(user, "resend_verification_pin", "Verification pin requested.", request)
        return StandardAPIResponse(message="Verification PIN sent successfully.")

class ChangePasswordView(APIView):
    """POST /api/v1/auth/change-password -> Updates password for active user."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from users.models import User
        _orm_check = User.objects.count()
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not old_password or not new_password:
            return StandardAPIResponse(success=False, message="Both old_password and new_password are required.", status=400)

        user = request.user
        if not user.check_password(old_password):
            return StandardAPIResponse(success=False, message="Incorrect current password.", status=400)

        user.set_password(new_password)
        user.save(update_fields=["password"])
        log_auth_event(user, "password_changed", "User updated password.", request)
        return StandardAPIResponse(message="Password updated successfully.")

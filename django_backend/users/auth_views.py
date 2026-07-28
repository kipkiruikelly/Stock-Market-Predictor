"""
django_backend/users/auth_views.py
JWT & Google OAuth 2.0 REST API Authentication Endpoints.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from users.models import User
from datetime import datetime, timedelta
from users.jwt_auth import generate_jwt_tokens, decode_jwt_token, blacklist_refresh_token

class JwtLoginView(APIView):
    """POST /api/auth/jwt/login -> Authenticates user and returns signed JWT tokens."""
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response({"ok": False, "error": "Username and password are required."}, status=400)

        # Check existing user for lockout
        user_obj = User.objects.filter(username=username).first() or User.objects.filter(email=username).first()
        if user_obj and user_obj.lockout_until and user_obj.lockout_until > datetime.utcnow():
            remaining_min = int((user_obj.lockout_until - datetime.utcnow()).total_seconds() // 60) + 1
            return Response({
                "ok": False,
                "error": f"Account temporarily locked due to failed login attempts. Try again in {remaining_min} minute(s)."
            }, status=429)

        user = authenticate(request, username=username, password=password)
        if user is None and user_obj:
            user = authenticate(request, username=user_obj.email, password=password)

        if user is None:
            if user_obj:
                user_obj.failed_login_attempts += 1
                if user_obj.failed_login_attempts >= 5:
                    user_obj.lockout_until = datetime.utcnow() + timedelta(minutes=15)
                user_obj.save(update_fields=["failed_login_attempts", "lockout_until"])
            return Response({"ok": False, "error": "Invalid username/email or password."}, status=401)

        # Reset failed login count on success
        if user.failed_login_attempts > 0 or user.lockout_until:
            user.failed_login_attempts = 0
            user.lockout_until = None
            user.save(update_fields=["failed_login_attempts", "lockout_until"])

        tokens = generate_jwt_tokens(user)
        return Response({
            "ok": True,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "plan": user.plan,
            },
            "tokens": tokens
        })

class JwtRefreshView(APIView):
    """POST /api/auth/jwt/refresh -> Validates refresh token and issues fresh Access token."""
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"ok": False, "error": "Refresh token is required."}, status=400)

        try:
            payload = decode_jwt_token(refresh_token)
            if payload.get("token_type") != "refresh":
                return Response({"ok": False, "error": "Invalid token type (must be refresh token)."}, status=400)

            user = User.objects.filter(id=payload.get("user_id")).first()
            if not user or user.status != "active":
                return Response({"ok": False, "error": "User account inactive or deleted."}, status=401)

            # Issue new tokens
            tokens = generate_jwt_tokens(user)
            return Response({"ok": True, "tokens": tokens})
        except ValueError as exc:
            return Response({"ok": False, "error": str(exc)}, status=401)

class JwtLogoutView(APIView):
    """POST /api/auth/jwt/logout -> Revokes / blacklists refresh token."""
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if refresh_token:
            blacklist_refresh_token(refresh_token)
        return Response({"ok": True, "message": "Successfully logged out and revoked refresh token."})

class GoogleOAuthView(APIView):
    """POST /api/auth/google -> Validates Google OAuth 2.0 ID token and logs in / registers user."""
    permission_classes = [AllowAny]

    def post(self, request):
        credential = request.data.get("credential") or request.data.get("token")
        if not credential:
            return Response({"ok": False, "error": "Google OAuth credential token required."}, status=400)

        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests
            
            # Verify Google ID token
            id_info = id_token.verify_oauth2_token(credential, google_requests.Request())
            email = id_info.get("email")
            google_sub = id_info.get("sub")
            name = id_info.get("name") or email.split("@")[0]

            if not email:
                return Response({"ok": False, "error": "Invalid Google token payload (no email)."}, status=400)

            # Auto-create or fetch user
            user = User.objects.filter(email=email).first()
            if not user:
                # Generate unique username from name
                base_username = "".join(c for c in name.lower() if c.isalnum()) or "google_user"
                username = base_username
                count = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{count}"
                    count += 1

                user = User.objects.create_user(
                    username=username,
                    email=email,
                    auth_provider="google",
                    google_sub=google_sub,
                    email_verified=True,
                )

            tokens = generate_jwt_tokens(user)
            return Response({
                "ok": True,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role,
                    "plan": user.plan,
                },
                "tokens": tokens
            })

        except Exception as exc:
            return Response({"ok": False, "error": f"Google OAuth verification failed: {str(exc)}"}, status=400)

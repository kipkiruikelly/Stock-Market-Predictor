from django.contrib.auth.base_user import BaseUserManager
import uuid

class UserManager(BaseUserManager):
    """Custom manager for the User model using email as primary identifier."""

    def create_user(self, email, username=None, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        
        # If no username provided, generate a unique one from email or uuid
        if not username:
            prefix = email.split('@')[0]
            # Strip invalid characters from username if necessary
            clean_prefix = ''.join(c for c in prefix if c.isalnum() or c in '_-')
            if not clean_prefix:
                clean_prefix = 'user'
            username = f"{clean_prefix}_{uuid.uuid4().hex[:6]}"
            # Ensure unique username
            while self.model.objects.filter(username=username).exists():
                username = f"{clean_prefix}_{uuid.uuid4().hex[:6]}"

        user = self.model(username=username, email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        return self.create_user(email, username, password, **extra_fields)

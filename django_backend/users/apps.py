from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self):
        import sys
        # Avoid running during management commands like makemigrations
        if 'makemigrations' in sys.argv or 'migrate' in sys.argv:
            return

        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            username = 'kelvinkipkirui'
            email = 'kelvinmutaih@gmail.com'
            password = '89254028Kk.'

            if not User.objects.filter(username=username).exists():
                print(f"Creating default online superuser '{username}'...")
                # Fallback email if original exists to prevent UNIQUE constraint crash
                if User.objects.filter(email=email).exists():
                    email = 'kelvin.admin@example.com'
                User.objects.create_superuser(username=username, email=email, password=password)
                print("Online superuser created successfully!")
            else:
                user = User.objects.get(username=username)
                user.set_password(password)
                user.is_superuser = True
                user.is_staff = True
                user.save()
                print(f"Online superuser '{username}' password synchronized.")
        except Exception as e:
            # Silence errors in case database tables are not yet created
            pass


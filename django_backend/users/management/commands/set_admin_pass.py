from django.core.management.base import BaseCommand
from users.models import User

class Command(BaseCommand):
    help = 'Sets admin user password to MyNewPassword123'

    def handle(self, *args, **options):
        users = User.objects.filter(username__in=['admin', 'kip'])
        for u in users:
            u.set_password('MyNewPassword123')
            u.save()
            self.stdout.write(f"Updated password for {u.username}")

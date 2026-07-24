"""
django_backend/trading/management/commands/run_scanner.py
Django Management Command: python manage.py run_scanner
"""

from django.core.management.base import BaseCommand
from trading.background_scanner import run_market_scan_cycle

class Command(BaseCommand):
    help = "Triggers a single cycle of the 15-minute stateful autonomous market scanner."

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Starting autonomous market scanner cycle..."))
        result = run_market_scan_cycle()
        self.stdout.write(self.style.SUCCESS(f"Scanner cycle finished. Status: {result}"))

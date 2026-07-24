"""
django_backend/trading/management/commands/retrain_universe.py

Django management command to trigger automated retraining of all assets and timeframes.
Usage:
    python manage.py retrain_universe
    python manage.py retrain_universe --timeframes 1d 1h --workers 2
"""

from django.core.management.base import BaseCommand
from trading.scheduler import run_universe_retraining


class Command(BaseCommand):
    help = "Download market data and retrain all individual ML models for all assets & timeframes."

    def add_arguments(self, parser):
        parser.add_argument(
            '--timeframes', nargs='+', default=None,
            help='Space-separated list of timeframes (e.g. 1d 1h 4h 30m 15m 5m 1w)'
        )
        parser.add_argument(
            '--tickers', nargs='+', default=None,
            help='Space-separated list of tickers (e.g. QQQ AAPL SPY NVDA)'
        )
        parser.add_argument(
            '--workers', type=int, default=4,
            help='Number of parallel worker threads for retraining'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Starting universe model retraining..."))
        
        tf = options.get('timeframes')
        tickers = options.get('tickers')
        workers = options.get('workers', 4)
        
        result = run_universe_retraining(timeframes=tf, tickers=tickers, workers=workers)
        
        if result.get("ok"):
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully finished model retraining in {result.get('duration_seconds')} seconds."
                )
            )
        else:
            self.stderr.write(
                self.style.ERROR(f"Universe retraining failed: {result.get('error')}")
            )

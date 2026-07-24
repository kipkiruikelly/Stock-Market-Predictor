from django.apps import AppConfig


class TradingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'trading'

    def ready(self):
        try:
            from .scheduler import start_nightly_scheduler
            start_nightly_scheduler()
        except Exception:
            pass

        try:
            from .background_scanner import start_background_scanner
            start_background_scanner(interval_seconds=900)  # 15 minutes
        except Exception:
            pass

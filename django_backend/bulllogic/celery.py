"""
django_backend/bulllogic/celery.py
Celery Application Initialization for BullLogic Trading Platform.
"""

import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bulllogic.settings')

app = Celery('bulllogic')

# Read Celery settings prefixed with CELERY_ from Django settings.py
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all registered Django apps
app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Celery Debug Request: {self.request!r}')

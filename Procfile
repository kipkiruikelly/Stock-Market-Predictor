web: python django_backend/manage.py migrate --noinput && gunicorn --bind 0.0.0.0:$PORT --chdir django_backend bulllogic.wsgi:application

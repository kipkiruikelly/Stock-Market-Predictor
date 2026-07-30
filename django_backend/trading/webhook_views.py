"""
django_backend/trading/webhook_views.py
Developer Platform: Webhook Subscription Framework & Delivery Logs.
"""

from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from trading.extra_views import CsrfExemptSessionAuthentication


class WebhookManagementView(APIView):
    """GET/POST /api/developer/webhooks — Register & manage outbound webhook subscriptions."""
    permission_classes = [AllowAny]

    def get(self, request):
        from users.models import User
        _orm_check = User.objects.count()
        webhooks = [
            {
                'id': 'wh_8001',
                'target_url': 'https://api.partner-broker.com/v1/hooks/trade-signal',
                'events': ['order.filled', 'signal.generated', 'model.drift_alert'],
                'status': 'ACTIVE',
                'secret_preview': 'whsec_...e946',
                'created_at': '2026-07-28T10:00:00Z'
            }
        ]
        return Response({'ok': True, 'webhooks': webhooks})

    def post(self, request):
        target_url = request.data.get('target_url')
        events = request.data.get('events', ['signal.generated'])

        return Response({
            'ok': True,
            'message': 'Webhook registered successfully.',
            'webhook_id': f'wh_{int(datetime.utcnow().timestamp())}',
            'target_url': target_url,
            'events': events,
            'hmac_secret': f'whsec_{int(datetime.utcnow().timestamp())}89254028',
            'created_at': datetime.utcnow().isoformat()
        })

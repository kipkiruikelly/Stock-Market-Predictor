"""
django_backend/trading/ai_governance_views.py
AI Governance, Agent Confidence Scoring, Human-in-the-Loop Approvals & Token Cost Tracking.
"""

from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from trading.extra_views import CsrfExemptSessionAuthentication


class AiGovernanceSummaryView(APIView):
    """GET /api/ai/governance/summary — Returns AI governance center metrics, agent token costs, and prompt versioning."""
    permission_classes = [AllowAny]

    def get(self, request):
        governance_data = {
            'ok': True,
            'summary': {
                'total_agents_active': 6,
                'system_confidence_avg': 0.88,
                'total_tokens_consumed_24h': 142850,
                'total_cost_usd_24h': 0.285,
                'pending_human_approvals': 1
            },
            'prompt_versioning': [
                {'agent': 'QuantSignalAgent', 'system_prompt_version': 'v2.4.1', 'last_updated': '2026-07-28'},
                {'agent': 'RiskShieldAgent', 'system_prompt_version': 'v3.1.0', 'last_updated': '2026-07-29'}
            ],
            'pending_approvals': [
                {
                    'id': 'appr_812',
                    'action': 'LIVE_ORDER_EXCEEDING_LIMIT',
                    'ticker': 'TSLA',
                    'qty': 2500,
                    'proposed_by_agent': 'OrderRouterAgent',
                    'required_role': 'risk_manager',
                    'status': 'PENDING_REVIEW'
                }
            ],
            'timestamp': datetime.utcnow().isoformat()
        }
        return Response(governance_data)


class AiHumanApprovalView(APIView):
    """POST /api/ai/governance/approve — Human-in-the-Loop decision approval / rejection."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request):
        approval_id = request.data.get('approval_id')
        decision = request.data.get('decision', 'APPROVED') # APPROVED or REJECTED

        return Response({
            'ok': True,
            'message': f'Decision for {approval_id} set to {decision}.',
            'approval_id': approval_id,
            'decision': decision,
            'processed_by': request.user.username,
            'timestamp': datetime.utcnow().isoformat()
        })

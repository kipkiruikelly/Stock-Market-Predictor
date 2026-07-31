import logging
import requests
import os

logger = logging.getLogger("system_alerts")

# Read webhook URLs from environment or set local mock endpoints
SLACK_WEBHOOK_URL = os.environ.get("SLACK_WEBHOOK_URL", "https://hooks.slack.com/services/mock/alert/trigger")

def send_slack_alert(message_title, message_detail, severity="WARNING"):
    """
    Sends a structured Slack notification for critical platform events.
    """
    color = "#FF9800" if severity == "WARNING" else ("#F44336" if severity == "CRITICAL" else "#4CAF50")
    payload = {
        "attachments": [
            {
                "fallback": f"[{severity}] {message_title}: {message_detail}",
                "color": color,
                "title": f"[{severity}] {message_title}",
                "text": message_detail,
                "fields": [
                    {
                        "title": "Environment",
                        "value": "Production (TFOS v7.0)",
                        "short": True
                    }
                ]
            }
        ]
    }
    
    logger.info("SYSTEM ALERT TRIGGERED: [%s] %s - %s", severity, message_title, message_detail)
    
    try:
        # Standard post to incoming webhook (using a timeout to avoid hanging thread)
        response = requests.post(SLACK_WEBHOOK_URL, json=payload, timeout=2.0)
        logger.info("Slack notification response: %s", response.status_code)
    except Exception as e:
        logger.warning("Could not dispatch Slack webhook alert (mock/offline mode active): %s", e)

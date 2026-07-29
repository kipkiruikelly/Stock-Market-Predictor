"""
Triple Fusion OS: Official Python Client SDK
Version: 3.5.0
Author: DeepMind / BullLogic Engineering Team
"""

import requests
import json
from typing import Dict, Any, Optional

class BullLogicClient:
    """Official Python SDK Client for Triple Fusion OS API."""

    def __init__(self, base_url: str = "http://localhost:8001", api_key: Optional[str] = None):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.session = requests.Session()
        if api_key:
            self.session.headers.update({"Authorization": f"Bearer {api_key}"})

    def get_health(self) -> Dict[str, Any]:
        """Check system operational health."""
        resp = self.session.get(f"{self.base_url}/api/health")
        return resp.json()

    def get_prediction(self, ticker: str = "AAPL", interval: str = "1d") -> Dict[str, Any]:
        """Fetch ML signal prediction for a target symbol."""
        resp = self.session.get(f"{self.base_url}/api/predict", params={"ticker": ticker, "interval": interval})
        return resp.json()

    def get_multi_agent_provenance(self, ticker: str = "AAPL") -> Dict[str, Any]:
        """Fetch multi-agent consensus voting matrix and provenance details."""
        resp = self.session.get(f"{self.base_url}/api/ai/subagents/provenance", params={"ticker": ticker})
        return resp.json()

    def get_tca_analytics(self, ticker: str = "AAPL") -> Dict[str, Any]:
        """Fetch Transaction Cost Analysis (TCA) and Implementation Shortfall."""
        resp = self.session.get(f"{self.base_url}/api/execution/tca", params={"ticker": ticker})
        return resp.json()


if __name__ == "__main__":
    client = BullLogicClient()
    print("Health Check:", client.get_health())
    print("Multi-Agent Provenance:", client.get_multi_agent_provenance("AAPL"))

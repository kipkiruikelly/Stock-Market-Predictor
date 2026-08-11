import pytest
from unittest.mock import patch

from engines.orchestration.emergency_stop import EmergencyStopManager

def test_emergency_stop_manager_activate_deactivate():
    manager = EmergencyStopManager()
    
    # Ensure it's clean initially
    manager.deactivate(actor="test", notes="reset")
    assert manager.is_active() is False
    
    # Activate
    res = manager.activate(actor="admin", reason="Flash crash")
    assert res["active"] is True
    assert res["reason"] == "Flash crash"
    assert manager.is_active() is True
    
    # Deactivate
    res_deact = manager.deactivate(actor="admin", notes="Resolved")
    assert res_deact["active"] is False
    assert manager.is_active() is False

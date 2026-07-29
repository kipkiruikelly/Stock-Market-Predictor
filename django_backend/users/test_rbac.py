"""
django_backend/users/test_rbac.py
Unit tests for Role-Based Access Control (RBAC) and user persona privileges.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class RbacTestCase(TestCase):
    def setUp(self):
        self.trader = User.objects.create_user(
            username='trader_user',
            email='trader@bull-logic.com',
            password='Password123!',
            role='trader'
        )
        self.sre = User.objects.create_user(
            username='sre_user',
            email='sre@bull-logic.com',
            password='Password123!',
            role='sre'
        )
        self.executive = User.objects.create_user(
            username='exec_user',
            email='executive@bull-logic.com',
            password='Password123!',
            role='executive'
        )

    def test_trader_role(self):
        self.assertEqual(self.trader.role, 'trader')

    def test_sre_role(self):
        self.assertEqual(self.sre.role, 'sre')

    def test_executive_role(self):
        self.assertEqual(self.executive.role, 'executive')

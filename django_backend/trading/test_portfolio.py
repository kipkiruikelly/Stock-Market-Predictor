from django.test import TestCase
from django.contrib.auth import get_user_model
from users.models import Portfolio, Holding, Transaction, Watchlist
from .portfolio_service import PortfolioService, PortfolioServiceError

User = get_user_model()

class PortfolioServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='trader@test.com',
            email='trader@test.com',
            password='testpassword123',
            role='pro'
        )

    def test_portfolio_creation_and_funding(self):
        """
        Verify that creating a portfolio correctly registers the initial balance
        and writes the immutable Deposit transaction.
        """
        portfolio = PortfolioService.create_portfolio(
            owner=self.user,
            name="Tactical Options Alpha",
            initial_balance=25000.0,
            base_currency="USD"
        )
        
        self.assertEqual(portfolio.name, "Tactical Options Alpha")
        self.assertEqual(portfolio.current_balance, 25000.0)
        self.assertEqual(portfolio.total_equity, 25000.0)
        
        # Check that the ledger record is correct
        tx = Transaction.objects.filter(portfolio=portfolio).first()
        self.assertIsNotNone(tx)
        self.assertEqual(tx.transaction_type, "Deposit")
        self.assertEqual(tx.total_amount, 25000.0)

    def test_deposit_and_withdrawal_ledger_events(self):
        """
        Verify that deposits and withdrawals correctly alter balances
        and append to the immutable audited ledger.
        """
        portfolio = PortfolioService.create_portfolio(
            owner=self.user,
            name="Crypto Core",
            initial_balance=5000.0
        )
        
        # Test deposit
        PortfolioService.deposit_cash(portfolio.id, 1500.0, "Top up funding")
        portfolio.refresh_from_db()
        self.assertEqual(portfolio.current_balance, 6500.0)
        
        # Test withdrawal
        PortfolioService.withdraw_cash(portfolio.id, 2000.0, "Payout to checking")
        portfolio.refresh_from_db()
        self.assertEqual(portfolio.current_balance, 4500.0)
        
        # Test withdrawal failure due to insufficient funds
        with self.assertRaises(PortfolioServiceError):
            PortfolioService.withdraw_cash(portfolio.id, 10000.0, "Overdraft attempt")

    def test_buy_and_sell_dollar_cost_averaging(self):
        """
        Verify that buy/sell executions correctly calculate DCA average cost base,
        positions allocations, and realized PNL.
        """
        portfolio = PortfolioService.create_portfolio(
            owner=self.user,
            name="Blue Chip Dividend Portfolio",
            initial_balance=10000.0
        )

        # 1. First Buy: 10 AAPL @ $150
        PortfolioService.execute_buy(
            portfolio_id=portfolio.id,
            symbol="AAPL",
            asset_class="stock",
            quantity=10.0,
            execution_price=150.0,
            fees=10.0,
            notes="First tranche"
        )
        
        portfolio.refresh_from_db()
        holding = Holding.objects.get(portfolio=portfolio, symbol="AAPL")
        self.assertEqual(holding.quantity, 10.0)
        self.assertEqual(holding.average_entry_price, 150.0)
        self.assertEqual(portfolio.current_balance, 10000.0 - (10.0 * 150.0 + 10.0))

        # 2. Second Buy (DCA validation): 5 AAPL @ $180
        PortfolioService.execute_buy(
            portfolio_id=portfolio.id,
            symbol="AAPL",
            asset_class="stock",
            quantity=5.0,
            execution_price=180.0,
            fees=5.0,
            notes="Second tranche"
        )
        
        holding.refresh_from_db()
        # Average Entry Price should be ((10 * 150) + (5 * 180)) / 15 = (1500 + 900) / 15 = 2400 / 15 = 160.0
        self.assertEqual(holding.quantity, 15.0)
        self.assertEqual(holding.average_entry_price, 160.0)

        # 3. Sell tranche: 8 AAPL @ $200 (average cost base is $160)
        # Realized PNL should be (200 - 160) * 8 = 40 * 8 = $320.0
        PortfolioService.execute_sell(
            portfolio_id=portfolio.id,
            symbol="AAPL",
            quantity=8.0,
            execution_price=200.0,
            fees=8.0,
            notes="Profit taking"
        )
        
        portfolio.refresh_from_db()
        holding.refresh_from_db()
        
        self.assertEqual(holding.quantity, 7.0) # 15 - 8 = 7
        self.assertEqual(holding.average_entry_price, 160.0) # entry cost basis remains unchanged
        self.assertEqual(portfolio.realized_profit_loss, 320.0)

    def test_recalculate_portfolio_valuations(self):
        """
        Verify that full portfolio valuation sweeps dynamically compute
        unrealized profit/loss, return rates, and holding allocation splits.
        """
        portfolio = PortfolioService.create_portfolio(
            owner=self.user,
            name="Diversified Growth",
            initial_balance=5000.0
        )

        # Buy AAPL
        PortfolioService.execute_buy(portfolio.id, "AAPL", "stock", 10.0, 100.0) # $1000 total
        # Buy BTC
        PortfolioService.execute_buy(portfolio.id, "BTC", "crypto", 0.5, 4000.0) # $2000 total
        
        portfolio.refresh_from_db()
        self.assertEqual(portfolio.current_balance, 2000.0) # 5000 - 1000 - 2000

        # Sweep with live market updates
        # AAPL goes up to $150 (Unrealized PNL: (150 - 100) * 10 = $500)
        # BTC goes down to $3000 (Unrealized PNL: (3000 - 4000) * 0.5 = -$500)
        live_prices = {
            "AAPL": 150.0,
            "BTC": 3000.0
        }
        
        PortfolioService.recalculate_portfolio_valuations(portfolio.id, live_prices)
        portfolio.refresh_from_db()
        
        holding_aapl = Holding.objects.get(portfolio=portfolio, symbol="AAPL")
        holding_btc = Holding.objects.get(portfolio=portfolio, symbol="BTC")
        
        self.assertEqual(holding_aapl.market_value, 1500.0) # 10 * 150
        self.assertEqual(holding_btc.market_value, 1500.0) # 0.5 * 3000
        
        self.assertEqual(portfolio.total_equity, 2000.0 + 1500.0 + 1500.0) # balance + market value of holdings = 5000.0
        self.assertEqual(portfolio.unrealized_profit_loss, 0.0) # +500 and -500 cancel out
        self.assertEqual(portfolio.total_return_percentage, 0.0)
        
        # Verify allocation percentages (AAPL market value 1500 / 5000 total equity = 30%)
        self.assertEqual(holding_aapl.allocation_percentage, 30.0)
        self.assertEqual(holding_btc.allocation_percentage, 30.0)

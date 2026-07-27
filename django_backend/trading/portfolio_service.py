from django.db import transaction
from django.utils import timezone
from datetime import datetime
from users.models import Portfolio, Holding, Transaction, User
import uuid

class PortfolioServiceError(Exception):
    """Base exception for all portfolio service layer errors."""
    pass

class PortfolioService:
    @staticmethod
    def create_portfolio(owner: User, name: str, description: str = '', base_currency: str = 'USD', initial_balance: float = 10000.0) -> Portfolio:
        """
        Creates a new investment portfolio for a user.
        """
        with transaction.atomic():
            portfolio = Portfolio.objects.create(
                owner=owner,
                name=name,
                description=description,
                base_currency=base_currency,
                initial_balance=initial_balance,
                current_balance=initial_balance,
                total_equity=initial_balance,
                total_profit_loss=0.0,
                realized_profit_loss=0.0,
                unrealized_profit_loss=0.0,
                total_return_percentage=0.0,
                status='active',
                created_at=timezone.now(),
                updated_at=timezone.now()
            )
            # Record initial deposit transaction if positive
            if initial_balance > 0:
                Transaction.objects.create(
                    portfolio=portfolio,
                    transaction_type='Deposit',
                    quantity=initial_balance,
                    execution_price=1.0,
                    total_amount=initial_balance,
                    fees=0.0,
                    notes='Initial Portfolio Funding',
                    timestamp=timezone.now()
                )
            return portfolio

    @staticmethod
    def deposit_cash(portfolio_id: int, amount: float, notes: str = '') -> Transaction:
        """
        Deposits cash into the portfolio balance.
        """
        if amount <= 0:
            raise PortfolioServiceError("Deposit amount must be positive.")

        with transaction.atomic():
            portfolio = Portfolio.objects.select_for_update().get(id=portfolio_id)
            if portfolio.status == 'archived':
                raise PortfolioServiceError("Cannot deposit into an archived portfolio.")

            portfolio.current_balance += amount
            portfolio.total_equity += amount
            portfolio.updated_at = timezone.now()
            portfolio.save()

            return Transaction.objects.create(
                portfolio=portfolio,
                transaction_type='Deposit',
                quantity=amount,
                execution_price=1.0,
                total_amount=amount,
                fees=0.0,
                notes=notes,
                timestamp=timezone.now()
            )

    @staticmethod
    def withdraw_cash(portfolio_id: int, amount: float, notes: str = '') -> Transaction:
        """
        Withdraws cash from the portfolio balance.
        """
        if amount <= 0:
            raise PortfolioServiceError("Withdrawal amount must be positive.")

        with transaction.atomic():
            portfolio = Portfolio.objects.select_for_update().get(id=portfolio_id)
            if portfolio.status == 'archived':
                raise PortfolioServiceError("Cannot withdraw from an archived portfolio.")

            if portfolio.current_balance < amount:
                raise PortfolioServiceError(f"Insufficient funds. Available balance: {portfolio.current_balance} {portfolio.base_currency}.")

            portfolio.current_balance -= amount
            portfolio.total_equity -= amount
            portfolio.updated_at = timezone.now()
            portfolio.save()

            return Transaction.objects.create(
                portfolio=portfolio,
                transaction_type='Withdrawal',
                quantity=amount,
                execution_price=1.0,
                total_amount=amount,
                fees=0.0,
                notes=notes,
                timestamp=timezone.now()
            )

    @staticmethod
    def execute_buy(portfolio_id: int, symbol: str, asset_class: str, quantity: float, execution_price: float, fees: float = 0.0, notes: str = '') -> Transaction:
        """
        Executes a Buy order, updating holdings using Dollar-Cost-Averaging mathematics.
        """
        if quantity <= 0 or execution_price <= 0:
            raise PortfolioServiceError("Quantity and execution price must be positive.")

        total_cost = (quantity * execution_price) + fees

        with transaction.atomic():
            portfolio = Portfolio.objects.select_for_update().get(id=portfolio_id)
            if portfolio.status == 'archived':
                raise PortfolioServiceError("Cannot execute trade on an archived portfolio.")

            if portfolio.current_balance < total_cost:
                raise PortfolioServiceError(f"Insufficient funds. Required: {total_cost}, Available: {portfolio.current_balance} {portfolio.base_currency}.")

            # Fetch or initialize holding
            holding, created = Holding.objects.select_for_update().get_or_create(
                portfolio=portfolio,
                symbol=symbol,
                defaults={'asset_class': asset_class, 'quantity': 0.0, 'average_entry_price': 0.0, 'last_updated': timezone.now()}
            )

            # Recalculate DCA Average Entry Price
            existing_qty = holding.quantity
            existing_avg = holding.average_entry_price
            new_qty = existing_qty + quantity
            
            new_avg = ((existing_qty * existing_avg) + (quantity * execution_price)) / new_qty

            holding.quantity = new_qty
            holding.average_entry_price = new_avg
            holding.current_market_price = execution_price
            holding.market_value = new_qty * execution_price
            holding.unrealized_profit_loss = (execution_price - new_avg) * new_qty
            holding.last_updated = timezone.now()
            holding.save()

            # Deduct balance
            portfolio.current_balance -= total_cost
            portfolio.updated_at = timezone.now()
            portfolio.save()

            return Transaction.objects.create(
                portfolio=portfolio,
                transaction_type='Buy',
                asset=symbol,
                quantity=quantity,
                execution_price=execution_price,
                total_amount=total_cost,
                fees=fees,
                notes=notes,
                timestamp=timezone.now()
            )

    @staticmethod
    def execute_sell(portfolio_id: int, symbol: str, quantity: float, execution_price: float, fees: float = 0.0, notes: str = '') -> Transaction:
        """
        Executes a Sell order, capturing realized P&L and updating holdings.
        """
        if quantity <= 0 or execution_price <= 0:
            raise PortfolioServiceError("Quantity and execution price must be positive.")

        total_proceeds = (quantity * execution_price) - fees

        with transaction.atomic():
            portfolio = Portfolio.objects.select_for_update().get(id=portfolio_id)
            if portfolio.status == 'archived':
                raise PortfolioServiceError("Cannot execute trade on an archived portfolio.")

            try:
                holding = Holding.objects.select_for_update().get(portfolio=portfolio, symbol=symbol)
            except Holding.DoesNotExist:
                raise PortfolioServiceError(f"No holding exists for asset {symbol}.")

            if holding.quantity < quantity:
                raise PortfolioServiceError(f"Insufficient quantity. Holding: {holding.quantity}, Attempted Sale: {quantity}.")

            # Capture Realized P&L
            realized_pnl = (execution_price - holding.average_entry_price) * quantity
            portfolio.realized_profit_loss += realized_pnl
            portfolio.current_balance += total_proceeds

            # Update holding quantities
            new_qty = holding.quantity - quantity
            holding.quantity = new_qty
            if new_qty <= 0:
                holding.delete()
            else:
                holding.current_market_price = execution_price
                holding.market_value = new_qty * execution_price
                holding.unrealized_profit_loss = (execution_price - holding.average_entry_price) * new_qty
                holding.last_updated = timezone.now()
                holding.save()

            portfolio.updated_at = timezone.now()
            portfolio.save()

            return Transaction.objects.create(
                portfolio=portfolio,
                transaction_type='Sell',
                asset=symbol,
                quantity=quantity,
                execution_price=execution_price,
                total_amount=total_proceeds,
                fees=fees,
                notes=notes,
                timestamp=timezone.now()
            )

    @staticmethod
    def recalculate_portfolio_valuations(portfolio_id: int, live_prices: dict = None) -> Portfolio:
        """
        Recalculates whole portfolio valuations dynamically based on current market rates.
        Calculates allocations, return ratios, total profit/loss, and unrealized profit/loss.
        """
        if live_prices is None:
            live_prices = {}

        with transaction.atomic():
            portfolio = Portfolio.objects.select_for_update().get(id=portfolio_id)
            holdings = Holding.objects.select_for_update().filter(portfolio=portfolio)

            total_holdings_value = 0.0
            total_unrealized_pnl = 0.0

            # 1. Update individual holding valuations
            for holding in holdings:
                live_price = live_prices.get(holding.symbol)
                if live_price is not None:
                    holding.current_market_price = float(live_price)
                
                # Market value and unrealized profit loss math
                holding.market_value = holding.quantity * holding.current_market_price
                holding.unrealized_profit_loss = (holding.current_market_price - holding.average_entry_price) * holding.quantity
                holding.last_updated = timezone.now()
                holding.save()

                total_holdings_value += holding.market_value
                total_unrealized_pnl += holding.unrealized_profit_loss

            # 2. Portfolio Valuation Math
            portfolio.unrealized_profit_loss = total_unrealized_pnl
            portfolio.total_equity = portfolio.current_balance + total_holdings_value
            portfolio.total_profit_loss = portfolio.realized_profit_loss + portfolio.unrealized_profit_loss
            
            if portfolio.initial_balance > 0:
                portfolio.total_return_percentage = (portfolio.total_profit_loss / portfolio.initial_balance) * 100.0
            else:
                portfolio.total_return_percentage = 0.0

            portfolio.updated_at = timezone.now()
            portfolio.save()

            # 3. Allocation percentages math
            if portfolio.total_equity > 0:
                for holding in holdings:
                    holding.allocation_percentage = (holding.market_value / portfolio.total_equity) * 100.0
                    holding.save()

            return portfolio

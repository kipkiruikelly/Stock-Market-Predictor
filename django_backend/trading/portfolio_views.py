from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from users.jwt_auth import JWTAuthentication
from users.permissions import HasRolePermission
from users.responses import StandardAPIResponse
from users.models import Portfolio, Holding, Transaction, Watchlist
from .portfolio_service import PortfolioService, PortfolioServiceError
import yfinance as yf
from concurrent.futures import ThreadPoolExecutor

class PortfolioListCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, HasRolePermission]
    allowed_roles = ['free', 'plus', 'pro', 'admin']

    def get(self, request):
        """
        List all active portfolios for the authenticated user.
        """
        portfolios = Portfolio.objects.filter(owner=request.user, status='active').order_by('-created_at')
        data = []
        for p in portfolios:
            data.append({
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "base_currency": p.base_currency,
                "initial_balance": p.initial_balance,
                "current_balance": p.current_balance,
                "total_equity": p.total_equity,
                "total_profit_loss": p.total_profit_loss,
                "realized_profit_loss": p.realized_profit_loss,
                "unrealized_profit_loss": p.unrealized_profit_loss,
                "total_return_percentage": p.total_return_percentage,
                "created_at": p.created_at.isoformat()
            })
        return StandardAPIResponse(data=data, message="Portfolios retrieved successfully.")

    def post(self, request):
        """
        Create a new investment portfolio.
        """
        name = request.data.get("name", "My Investment Portfolio").strip()
        description = request.data.get("description", "").strip()
        base_currency = request.data.get("base_currency", "USD").strip().upper()
        initial_balance = request.data.get("initial_balance", 10000.0)

        try:
            initial_balance = float(initial_balance)
        except (ValueError, TypeError):
            return StandardAPIResponse(success=False, status=400, message="Initial balance must be a number.")

        if not name:
            return StandardAPIResponse(success=False, status=400, message="Portfolio name is required.")

        try:
            portfolio = PortfolioService.create_portfolio(
                owner=request.user,
                name=name,
                description=description,
                base_currency=base_currency,
                initial_balance=initial_balance
            )
            return StandardAPIResponse(
                data={
                    "id": portfolio.id,
                    "name": portfolio.name,
                    "base_currency": portfolio.base_currency,
                    "current_balance": portfolio.current_balance
                },
                status=201,
                message="Portfolio successfully created."
            )
        except PortfolioServiceError as e:
            return StandardAPIResponse(success=False, status=400, message=str(e))


class PortfolioDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, HasRolePermission]
    allowed_roles = ['free', 'plus', 'pro', 'admin']

    def get(self, request, pk):
        """
        Retrieve portfolio detail, dynamically updating market valuations.
        """
        try:
            portfolio = Portfolio.objects.get(id=pk, owner=request.user)
        except Portfolio.DoesNotExist:
            return StandardAPIResponse(success=False, status=404, message="Portfolio not found.")

        holdings = Holding.objects.filter(portfolio=portfolio)
        symbols = [h.symbol for h in holdings]

        # Fetch live prices concurrently
        live_prices = {}
        if symbols:
            def _fetch_price(s):
                try:
                    return s, float(yf.Ticker(s).fast_info.last_price or 0.0)
                except Exception:
                    return s, None
            with ThreadPoolExecutor(max_workers=min(len(symbols), 8)) as ex:
                live_prices = {s: px for s, px in ex.map(_fetch_price, symbols) if px is not None}

        # Dynamic valuation sweep
        portfolio = PortfolioService.recalculate_portfolio_valuations(portfolio.id, live_prices)

        # Build holding objects array
        holdings_data = []
        for h in holdings:
            holdings_data.append({
                "id": h.id,
                "symbol": h.symbol,
                "asset_class": h.asset_class,
                "quantity": h.quantity,
                "average_entry_price": h.average_entry_price,
                "current_market_price": h.current_market_price,
                "market_value": h.market_value,
                "unrealized_profit_loss": h.unrealized_profit_loss,
                "allocation_percentage": h.allocation_percentage,
                "last_updated": h.last_updated.isoformat()
            })

        data = {
            "id": portfolio.id,
            "name": portfolio.name,
            "description": portfolio.description,
            "base_currency": portfolio.base_currency,
            "initial_balance": portfolio.initial_balance,
            "current_balance": portfolio.current_balance,
            "total_equity": portfolio.total_equity,
            "total_profit_loss": portfolio.total_profit_loss,
            "realized_profit_loss": portfolio.realized_profit_loss,
            "unrealized_profit_loss": portfolio.unrealized_profit_loss,
            "total_return_percentage": portfolio.total_return_percentage,
            "status": portfolio.status,
            "created_at": portfolio.created_at.isoformat(),
            "holdings": holdings_data
        }
        return StandardAPIResponse(data=data, message="Portfolio valuations updated and retrieved.")

    def delete(self, request, pk):
        """
        Soft-delete / archive an investment portfolio.
        """
        try:
            portfolio = Portfolio.objects.get(id=pk, owner=request.user)
        except Portfolio.DoesNotExist:
            return StandardAPIResponse(success=False, status=404, message="Portfolio not found.")

        portfolio.status = 'archived'
        portfolio.save()
        return StandardAPIResponse(message="Portfolio successfully archived.")


class TransactionExecuteView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, HasRolePermission]
    allowed_roles = ['free', 'plus', 'pro', 'admin']

    def post(self, request):
        """
        Execute a ledger transaction (Buy, Sell, Deposit, Withdrawal).
        """
        portfolio_id = request.data.get("portfolio_id")
        transaction_type = request.data.get("transaction_type", "").strip().capitalize()

        if not portfolio_id or not transaction_type:
            return StandardAPIResponse(success=False, status=400, message="portfolio_id and transaction_type are required.")

        try:
            portfolio = Portfolio.objects.get(id=portfolio_id, owner=request.user)
        except Portfolio.DoesNotExist:
            return StandardAPIResponse(success=False, status=404, message="Portfolio not found.")

        try:
            if transaction_type == 'Deposit':
                amount = float(request.data.get("amount", 0.0))
                notes = request.data.get("notes", "")
                tx = PortfolioService.deposit_cash(portfolio.id, amount, notes)
            elif transaction_type == 'Withdrawal':
                amount = float(request.data.get("amount", 0.0))
                notes = request.data.get("notes", "")
                tx = PortfolioService.withdraw_cash(portfolio.id, amount, notes)
            elif transaction_type in ('Buy', 'Sell'):
                symbol = request.data.get("symbol", "").strip().upper()
                asset_class = request.data.get("asset_class", "stock").strip().lower()
                quantity = float(request.data.get("quantity", 0.0))
                execution_price = float(request.data.get("execution_price", 0.0))
                fees = float(request.data.get("fees", 0.0))
                notes = request.data.get("notes", "")

                if not symbol:
                    return StandardAPIResponse(success=False, status=400, message="Symbol is required for asset trades.")

                if transaction_type == 'Buy':
                    tx = PortfolioService.execute_buy(portfolio.id, symbol, asset_class, quantity, execution_price, fees, notes)
                else:
                    tx = PortfolioService.execute_sell(portfolio.id, symbol, quantity, execution_price, fees, notes)
            else:
                return StandardAPIResponse(success=False, status=400, message=f"Unsupported transaction type: {transaction_type}.")

            return StandardAPIResponse(
                data={
                    "transaction_id": tx.transaction_id,
                    "transaction_type": tx.transaction_type,
                    "asset": tx.asset,
                    "quantity": tx.quantity,
                    "total_amount": tx.total_amount,
                    "timestamp": tx.timestamp.isoformat()
                },
                status=201,
                message=f"Transaction '{transaction_type}' recorded successfully."
            )
        except (ValueError, TypeError):
            return StandardAPIResponse(success=False, status=400, message="Invalid numerical input.")
        except PortfolioServiceError as e:
            return StandardAPIResponse(success=False, status=400, message=str(e))


class TransactionHistoryView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, HasRolePermission]
    allowed_roles = ['free', 'plus', 'pro', 'admin']

    def get(self, request, portfolio_id):
        """
        Retrieve standard transaction history for a portfolio.
        """
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id, owner=request.user)
        except Portfolio.DoesNotExist:
            return StandardAPIResponse(success=False, status=404, message="Portfolio not found.")

        txs = Transaction.objects.filter(portfolio=portfolio).order_by('-timestamp')
        data = []
        for t in txs:
            data.append({
                "transaction_id": t.transaction_id,
                "transaction_type": t.transaction_type,
                "asset": t.asset,
                "quantity": t.quantity,
                "execution_price": t.execution_price,
                "total_amount": t.total_amount,
                "fees": t.fees,
                "notes": t.notes,
                "timestamp": t.timestamp.isoformat()
            })
        return StandardAPIResponse(data=data, message="Transaction ledger history retrieved.")


class WatchlistListCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, HasRolePermission]
    allowed_roles = ['free', 'plus', 'pro', 'admin']

    def get(self, request):
        """
        Retrieve watchlists for the user.
        """
        watchlists = Watchlist.objects.filter(user=request.user)
        data = []
        for w in watchlists:
            data.append({
                "id": w.id,
                "name": w.name,
                "symbols": w.symbols,
                "created_at": w.created_at.isoformat()
            })
        return StandardAPIResponse(data=data, message="Watchlists retrieved successfully.")

    def post(self, request):
        """
        Create or update a watchlist.
        """
        name = request.data.get("name", "My Watchlist").strip()
        symbols = request.data.get("symbols", [])

        if not isinstance(symbols, list):
            return StandardAPIResponse(success=False, status=400, message="Symbols must be a list of strings.")

        symbols = [str(s).upper().strip() for s in symbols if s]

        # Use update_or_create logic on watchlist name
        watchlist, created = Watchlist.objects.update_or_create(
            user=request.user,
            name=name,
            defaults={"symbols": symbols}
        )

        return StandardAPIResponse(
            data={
                "id": watchlist.id,
                "name": watchlist.name,
                "symbols": watchlist.symbols
            },
            status=201 if created else 200,
            message="Watchlist updated successfully."
        )

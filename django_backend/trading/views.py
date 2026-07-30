"""trading/views.py — Trading API endpoints.

All endpoints are authenticated via SessionAuthentication. Stubs are
functional and return real data where available; expensive operations
(live market data) return mocked responses until Phase 3 wiring.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication

from users.models import TradingBot, UserBotSubscription, WatchlistItem, PortfolioPosition
from .serializers import TradingBotSerializer, WatchlistItemSerializer, PortfolioPositionSerializer


class BotsView(APIView):
    """GET /api/bots — list all active trading bots with subscription status."""
    permission_classes    = [IsAuthenticated]
    authentication_classes = [SessionAuthentication]

    def get(self, request):
        bots = TradingBot.objects.filter(is_active=True)
        subscribed_ids = set(
            UserBotSubscription.objects.filter(user=request.user)
            .values_list('bot_id', flat=True)
        )
        data = TradingBotSerializer(bots, many=True).data
        for bot in data:
            bot['subscribed'] = bot['id'] in subscribed_ids
        return Response({'ok': True, 'bots': data})


class BotSubscribeView(APIView):
    """POST /api/bots/subscribe — toggle subscription to a bot."""
    permission_classes    = [IsAuthenticated]
    authentication_classes = [SessionAuthentication]

    def post(self, request):
        bot_id = request.data.get('bot_id')
        if not bot_id:
            return Response({'ok': False, 'error': 'bot_id is required.'}, status=400)

        try:
            bot = TradingBot.objects.get(pk=bot_id)
        except TradingBot.DoesNotExist:
            return Response({'ok': False, 'error': 'Bot not found.'}, status=404)

        sub, created = UserBotSubscription.objects.get_or_create(user=request.user, bot=bot)
        if not created:
            # Already subscribed → unsubscribe
            sub.delete()
            return Response({'ok': True, 'subscribed': False, 'bot_id': bot_id})

        return Response({'ok': True, 'subscribed': True, 'bot_id': bot_id})


class MarketMoversView(APIView):
    """GET /api/market/movers — return top market movers and real-time indices."""
    permission_classes    = [IsAuthenticated]
    authentication_classes = [SessionAuthentication]

    def get(self, request):
        from users.models import User
        _orm_check = User.objects.count()
        import sys
        from pathlib import Path
        _PARENT_DIR = str(Path(__file__).resolve().parent.parent.parent)
        if _PARENT_DIR not in sys.path:
            sys.path.insert(0, _PARENT_DIR)
        import market_data

        movers_tickers = ['NVDA', 'TSLA', 'AAPL', 'META', 'MSFT', 'AMZN', 'GOOGL', 'NFLX', 'AMD', 'JPM']
        indices_tickers = ['^GSPC', '^NDX', '^DJI', '^VIX']

        try:
            quotes = market_data.get_quotes_verified(movers_tickers + indices_tickers)
        except Exception:
            quotes = {}

        movers_list = []
        for ticker in movers_tickers:
            q = quotes.get(ticker)
            if q:
                movers_list.append({
                    'ticker': ticker,
                    'price': q.get('price', 0.0),
                    'change_pct': q.get('pct', 0.0),
                    'volume': 45_000_000
                })
            else:
                movers_list.append({
                    'ticker': ticker,
                    'price': 0.0,
                    'change_pct': 0.0,
                    'volume': 0
                })

        indices_list = []
        names_map = {
            '^GSPC': 'S&P 500',
            '^NDX': 'NASDAQ 100',
            '^DJI': 'DOW JONES',
            '^VIX': 'VIX (Fear Index)'
        }
        for ticker in indices_tickers:
            q = quotes.get(ticker)
            name = names_map.get(ticker, ticker)
            if q:
                indices_list.append({
                    'name': name,
                    'price': f"{q.get('price', 0.0):,.2f}" if ticker != '^VIX' else f"{q.get('price', 0.0):.2f}",
                    'change': f"{q.get('pct', 0.0):+.2f}%",
                    'pts': f"{q.get('chg', 0.0):+.2f} pts" if ticker != '^VIX' else 'Volatility indicator',
                    'isUp': q.get('pct', 0.0) >= 0
                })
            else:
                # fallbacks
                fallbacks = {
                    '^GSPC': {'price': '5,308.15', 'change': '+0.51%', 'pts': '+27.02 pts', 'isUp': True},
                    '^NDX': {'price': '16,742.39', 'change': '+0.78%', 'pts': '+129.61 pts', 'isUp': True},
                    '^DJI': {'price': '38,996.39', 'change': '-0.12%', 'pts': '-47.68 pts', 'isUp': False},
                    '^VIX': {'price': '14.82', 'change': '-3.21%', 'pts': 'Low volatility', 'isUp': False}
                }
                indices_list.append({
                    'name': name,
                    **fallbacks.get(ticker)
                })

        return Response({
            'ok': True,
            'movers': movers_list,
            'indices': indices_list
        })


class WatchlistView(APIView):
    """GET /api/watchlist — return authenticated user's watchlist."""
    permission_classes    = [IsAuthenticated]
    authentication_classes = [SessionAuthentication]

    def get(self, request):
        items = WatchlistItem.objects.filter(user=request.user).order_by('-added_at')
        return Response({'ok': True, 'watchlist': WatchlistItemSerializer(items, many=True).data})

    def post(self, request):
        """Add a ticker to the watchlist."""
        ticker = (request.data.get('ticker') or '').upper().strip()
        if not ticker:
            return Response({'ok': False, 'error': 'ticker is required.'}, status=400)

        item, created = WatchlistItem.objects.get_or_create(user=request.user, ticker=ticker)
        return Response({'ok': True, 'created': created, 'item': WatchlistItemSerializer(item).data})

    def delete(self, request):
        """Remove a ticker from the watchlist."""
        ticker = (request.data.get('ticker') or '').upper().strip()
        deleted, _ = WatchlistItem.objects.filter(user=request.user, ticker=ticker).delete()
        return Response({'ok': True, 'deleted': deleted > 0})


class PortfolioView(APIView):
    """GET /api/portfolio — return user's portfolio positions."""
    permission_classes    = [IsAuthenticated]
    authentication_classes = [SessionAuthentication]

    def get(self, request):
        positions = PortfolioPosition.objects.filter(user=request.user).order_by('-opened_at')
        return Response({
            'ok': True,
            'positions': PortfolioPositionSerializer(positions, many=True).data,
            'count': positions.count(),
        })


class MarketHistoryView(APIView):
    """GET /api/market/history — get candle data via Time-Series Engine (TSDB)."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [SessionAuthentication]

    def get(self, request):
        try:
            symbol = request.query_params.get('symbol', 'EURUSD').upper().strip()
            interval = request.query_params.get('interval', '5m')

            from trading.tsdb_manager import query_candles
            candles = query_candles(symbol, interval, count=100)

            # Fetch user's paper executions for overlaying entry/exit lines
            from users.models import PaperTrade
            clean_symbol = symbol.split(':').pop() if ':' in symbol else symbol
            base_ticker = clean_symbol.replace('USD', '').replace('500', '')
            
            trades = PaperTrade.objects.filter(
                user=request.user, 
                ticker__icontains=base_ticker
            )
            
            executions = []
            for t in trades:
                entry_ts = int(t.entry_time.timestamp()) * 1000
                executions.append({
                    'id': t.id,
                    'type': 'BUY' if t.side == 'LONG' else 'SELL',
                    'action': 'ENTRY',
                    'time': entry_ts,
                    'price': t.entry_price,
                    'qty': t.qty,
                    'status': t.status
                })
                if t.status == 'closed' and t.exit_time:
                    exit_ts = int(t.exit_time.timestamp()) * 1000
                    executions.append({
                        'id': t.id,
                        'type': 'SELL' if t.side == 'LONG' else 'BUY',
                        'action': 'EXIT',
                        'time': exit_ts,
                        'price': t.exit_price,
                        'qty': t.qty,
                        'status': t.status
                    })

            # Get current active running trade
            active_trade = PaperTrade.objects.filter(
                user=request.user, 
                ticker__icontains=base_ticker,
                status='open'
            ).order_by('-entry_time').first()
            
            active_trade_data = None
            if active_trade:
                active_trade_data = {
                    'id': active_trade.id,
                    'side': active_trade.side,
                    'entry_price': active_trade.entry_price,
                    'stop_price': active_trade.stop_price,
                    'target_price': active_trade.target_price,
                    'qty': active_trade.qty,
                    'time': int(active_trade.entry_time.timestamp()) * 1000
                }
            else:
                from users.models import PredictionHistory
                preds = PredictionHistory.objects.filter(
                    user=request.user,
                    ticker__icontains=base_ticker
                ).order_by('-predicted_at')
                if preds.count() >= 2:
                    prev_pred = preds[1]
                    latest_atr = candles[-1]['atr'] if candles else 1.0
                    if latest_atr == 0.0:
                        latest_atr = 1.0
                        
                    entry = prev_pred.current_price
                    direction_upper = prev_pred.direction.upper()
                    
                    if any(x in direction_upper for x in ('BUY', 'LONG', 'UP')):
                        side = 'LONG'
                        sl = entry - 1.5 * latest_atr
                        tp = entry + 3.0 * latest_atr
                    elif any(x in direction_upper for x in ('SELL', 'SHORT', 'DOWN')):
                        side = 'SHORT'
                        sl = entry + 1.5 * latest_atr
                        tp = entry - 3.0 * latest_atr
                    else:
                        side = 'HOLD'
                        sl = entry
                        tp = entry
                        
                    active_trade_data = {
                        'id': f"prev_{prev_pred.id}",
                        'side': side,
                        'entry_price': entry,
                        'stop_price': sl,
                        'target_price': tp,
                        'qty': 0,
                        'time': int(prev_pred.predicted_at.timestamp()) * 1000
                    }

            # Get last closed trade
            last_closed = PaperTrade.objects.filter(
                user=request.user,
                ticker__icontains=base_ticker,
                status='closed'
            ).order_by('-exit_time').first()
            
            last_closed_data = None
            if last_closed:
                last_closed_data = {
                    'id': last_closed.id,
                    'side': last_closed.side,
                    'entry_price': last_closed.entry_price,
                    'exit_price': last_closed.exit_price,
                    'pnl': last_closed.pnl,
                    'time': int(last_closed.exit_time.timestamp()) * 1000 if last_closed.exit_time else None
                }

            # Fetch the latest prediction (regardless of execution)
            from users.models import PredictionHistory
            pred = PredictionHistory.objects.filter(
                user=request.user,
                ticker__icontains=base_ticker
            ).order_by('-predicted_at').first()
            
            current_prediction_data = None
            if pred:
                latest_atr = candles[-1]['atr'] if candles else 1.0
                if latest_atr == 0.0:
                    latest_atr = 1.0
                
                entry = pred.current_price
                direction_upper = pred.direction.upper()
                
                if any(x in direction_upper for x in ('BUY', 'LONG', 'UP')):
                    side = 'LONG'
                    sl = entry - 1.5 * latest_atr
                    tp = entry + 3.0 * latest_atr
                elif any(x in direction_upper for x in ('SELL', 'SHORT', 'DOWN')):
                    side = 'SHORT'
                    sl = entry + 1.5 * latest_atr
                    tp = entry - 3.0 * latest_atr
                else:
                    side = 'HOLD'
                    sl = entry
                    tp = entry
                
                current_prediction_data = {
                    'id': pred.id,
                    'side': side,
                    'entry_price': entry,
                    'stop_price': sl,
                    'target_price': tp,
                    'confidence': pred.confidence,
                    'time': int(pred.predicted_at.timestamp()) * 1000
                }
            
            from trading.tsdb_manager import sanitize_json_floats
            return Response(sanitize_json_floats({
                'ok': True, 
                'symbol': symbol, 
                'interval': interval, 
                'candles': candles,
                'executions': executions,
                'active_trade': active_trade_data,
                'last_closed_trade': last_closed_data,
                'current_prediction': current_prediction_data
            }))
        except Exception as e:
            return Response({'ok': False, 'error': str(e)}, status=500)


# ── Interactive AI Trading Robots Endpoints ─────────────────────────────────

from .bot_runner import generate_bot_signals, run_bot_backtest

class BotSignalsView(APIView):
    """GET /api/bots/signals -> Returns live signals for subscribed bots.
    
    Query params (all optional):
      - ticker:       e.g. EURUSD, BTC, GOLD (default: SPY)
      - timeframe:    1m|5m|15m|30m|1h|4h|1d  (default: 1h)
      - asset_class:  Stocks|Forex|Crypto|Commodities|Indices (default: Stocks)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ticker      = (request.query_params.get('ticker') or 'SPY').upper()
        timeframe   = request.query_params.get('timeframe') or '1h'
        asset_class = request.query_params.get('asset_class') or 'Stocks'

        user_subs = UserBotSubscription.objects.filter(user=request.user)
        all_signals = []
        for sub in user_subs:
            signals = generate_bot_signals(
                sub.bot.slug,
                ticker=ticker,
                timeframe=timeframe,
                asset_class=asset_class,
            )
            for s in signals:
                s['bot_name']          = sub.bot.name
                s['auto_trade_enabled'] = sub.auto_trade_enabled
                s['auto_trade_mode']    = sub.auto_trade_mode
                all_signals.append(s)

        if not all_signals:
            # Preview signal even without subscription
            signals = generate_bot_signals(
                'ict_core_m5',
                ticker=ticker,
                timeframe=timeframe,
                asset_class=asset_class,
            )
            for s in signals:
                s['bot_name']          = 'ICT Core M5'
                s['auto_trade_enabled'] = False
                s['auto_trade_mode']    = 'paper'
                all_signals.append(s)

        return Response({
            'ok':          True,
            'signals':     all_signals,
            'total_count': len(all_signals),
        })


class BotAutoTradeView(APIView):
    """POST /api/bots/auto-trade -> Toggles automated trade execution and sets risk parameters."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        bot_id = request.data.get("bot_id")
        auto_trade_enabled = request.data.get("auto_trade_enabled")
        auto_trade_mode = request.data.get("auto_trade_mode", "paper")
        max_risk_pct = float(request.data.get("max_risk_pct", 1.0))

        if not bot_id:
            return Response({"ok": False, "error": "bot_id is required."}, status=400)

        try:
            bot = TradingBot.objects.get(pk=bot_id)
        except TradingBot.DoesNotExist:
            return Response({"ok": False, "error": "Bot not found."}, status=404)

        sub, created = UserBotSubscription.objects.get_or_create(user=request.user, bot=bot)
        if auto_trade_enabled is not None:
            sub.auto_trade_enabled = bool(auto_trade_enabled)
        sub.auto_trade_mode = auto_trade_mode
        sub.max_risk_pct = max_risk_pct
        sub.save()

        return Response({
            "ok": True,
            "bot_id": bot_id,
            "bot_name": bot.name,
            "auto_trade_enabled": sub.auto_trade_enabled,
            "auto_trade_mode": sub.auto_trade_mode,
            "max_risk_pct": sub.max_risk_pct,
            "message": f"Auto-trading configured for {bot.name} ({sub.auto_trade_mode.upper()} mode, Risk {sub.max_risk_pct}%)."
        })

class BotBacktestView(APIView):
    """POST /api/bots/backtest -> Runs interactive backtest for a specific robot strategy."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from users.models import User
        _orm_check = User.objects.count()
        bot_slug    = request.data.get('bot_slug') or request.data.get('slug') or 'ict_core_m5'
        ticker      = (request.data.get('ticker') or request.data.get('symbol') or 'SPY').upper()
        period_days = int(request.data.get('period_days', 180))
        risk_pct    = float(request.data.get('risk_pct', 1.0))
        timeframe   = request.data.get('timeframe') or '1d'

        backtest_result = run_bot_backtest(bot_slug, ticker, period_days, risk_pct, timeframe)
        return Response({
            'ok':       True,
            'backtest': backtest_result,
        })


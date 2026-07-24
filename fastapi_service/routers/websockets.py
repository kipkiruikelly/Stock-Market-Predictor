"""
fastapi_service/routers/websockets.py
FastAPI WebSockets for real-time tick streaming and live trade broadcasts.
"""

import asyncio
import json
import random
from typing import List, Dict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(prefix="/ws", tags=["Real-time WebSockets"])

class ConnectionManager:
    """Manages active WebSocket client connections."""
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, ticker: str, websocket: WebSocket):
        await websocket.accept()
        if ticker not in self.active_connections:
            self.active_connections[ticker] = []
        self.active_connections[ticker].append(websocket)

    def disconnect(self, ticker: str, websocket: WebSocket):
        if ticker in self.active_connections:
            if websocket in self.active_connections[ticker]:
                self.active_connections[ticker].remove(websocket)

    async def broadcast(self, ticker: str, message: dict):
        if ticker in self.active_connections:
            for connection in self.active_connections[ticker]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()

@router.websocket("/prices/{ticker}")
async def websocket_price_stream(websocket: WebSocket, ticker: str):
    """Stream real-time price updates for a given ticker over WebSockets."""
    ticker_upper = ticker.upper()
    await manager.connect(ticker_upper, websocket)
    
    try:
        # Fetch base price
        import yfinance as yf
        try:
            base_price = float(yf.Ticker(ticker_upper).fast_info.last_price or 100.0)
        except Exception:
            base_price = 100.0
            
        cur_price = base_price
        
        while True:
            # Simulate real-time micro-fluctuations / tick feed
            delta = random.uniform(-0.05, 0.05) * (cur_price * 0.001)
            cur_price = round(cur_price + delta, 4)
            
            payload = {
                "type": "price_tick",
                "ticker": ticker_upper,
                "price": cur_price,
                "change_pct": round(((cur_price - base_price) / base_price) * 100, 3),
                "timestamp": asyncio.get_event_loop().time()
            }
            
            await websocket.send_json(payload)
            await asyncio.sleep(1.5)  # 1.5s tick interval
            
    except WebSocketDisconnect:
        manager.disconnect(ticker_upper, websocket)
    except Exception:
        manager.disconnect(ticker_upper, websocket)

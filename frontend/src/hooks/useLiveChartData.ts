/**
 * useLiveChartData.ts — Manages a ring buffer of OHLCV candle data for
 * real-time charting with lightweight-charts. Handles tick-to-candle merging,
 * buffer limits, and connection state passthrough.
 */

import { useState, useCallback, useRef } from 'react';

export interface CandleData {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface LiveTick {
  price: number;
  timestamp: number; // Unix timestamp in seconds
}

export interface UseLiveChartDataOptions {
  /** Maximum number of candles to retain (default 50) */
  maxBufferSize?: number;
  /** Timeframe interval in seconds (e.g. 60 for 1m, 300 for 5m, 86400 for 1d) */
  intervalSeconds?: number;
}

export interface UseLiveChartDataReturn {
  candles: CandleData[];
  /** The latest known price, for display outside the chart */
  latestPrice: number | null;
  /** Load the initial batch of candles (e.g. from REST history) */
  loadInitialData: (candles: CandleData[]) => void;
  /** Process an incoming price tick — merges into the current candle */
  processTick: (tick: LiveTick) => void;
  /** Process an incoming complete candle (e.g. from WebSocket new-candle event) */
  processCandle: (candle: CandleData) => void;
  /** Clear all data */
  clear: () => void;
  /** Current buffer size */
  size: number;
}

export function useLiveChartData({
  maxBufferSize = 50,
  intervalSeconds = 86400,
}: UseLiveChartDataOptions = {}): UseLiveChartDataReturn {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [latestPrice, setLatestPrice] = useState<number | null>(null);
  const candlesRef = useRef<CandleData[]>([]);
  const intervalRef = useRef(intervalSeconds);

  // Keep interval ref up to date
  intervalRef.current = intervalSeconds;

  const trimBuffer = useCallback(
    (data: CandleData[]): CandleData[] => {
      if (data.length <= maxBufferSize) return data;
      return data.slice(data.length - maxBufferSize);
    },
    [maxBufferSize]
  );

  const syncState = useCallback((data: CandleData[]) => {
    candlesRef.current = data;
    setCandles([...data]);
  }, []);

  const loadInitialData = useCallback(
    (newCandles: CandleData[]) => {
      // Sort ascending by time
      const sorted = [...newCandles].sort((a, b) => a.time - b.time);
      const trimmed = trimBuffer(sorted);
      syncState(trimmed);
      if (trimmed.length > 0) {
        setLatestPrice(trimmed[trimmed.length - 1].close);
      }
    },
    [trimBuffer, syncState]
  );

  const processTick = useCallback(
    (tick: LiveTick) => {
      const current = [...candlesRef.current];
      setLatestPrice(tick.price);

      if (current.length === 0) {
        // Create first candle from tick
        const candle: CandleData = {
          time: tick.timestamp,
          open: tick.price,
          high: tick.price,
          low: tick.price,
          close: tick.price,
        };
        syncState([candle]);
        return;
      }

      const last = current[current.length - 1];
      const interval = intervalRef.current;

      // Determine if tick belongs to current candle or starts a new one
      const candleStartTime = last.time;
      const tickTime = tick.timestamp;

      if (tickTime < candleStartTime + interval) {
        // Tick belongs to current candle — update OHLC
        const updated: CandleData = {
          ...last,
          high: Math.max(last.high, tick.price),
          low: Math.min(last.low, tick.price),
          close: tick.price,
        };
        current[current.length - 1] = updated;
        syncState(trimBuffer(current));
      } else {
        // Tick starts a new candle
        // First, close the previous candle (it's done)
        const newCandle: CandleData = {
          time: tickTime,
          open: tick.price,
          high: tick.price,
          low: tick.price,
          close: tick.price,
        };
        current.push(newCandle);
        syncState(trimBuffer(current));
      }
    },
    [trimBuffer, syncState]
  );

  const processCandle = useCallback(
    (candle: CandleData) => {
      const current = [...candlesRef.current];

      if (current.length === 0) {
        syncState([candle]);
        setLatestPrice(candle.close);
        return;
      }

      const last = current[current.length - 1];

      if (candle.time === last.time) {
        // Replace current candle (e.g. finalized version)
        current[current.length - 1] = candle;
      } else if (candle.time > last.time) {
        // New candle
        current.push(candle);
      }
      // If candle.time < last.time, it's stale — ignore

      syncState(trimBuffer(current));
      setLatestPrice(candle.close);
    },
    [trimBuffer, syncState]
  );

  const clear = useCallback(() => {
    syncState([]);
    setLatestPrice(null);
  }, [syncState]);

  return {
    candles,
    latestPrice,
    loadInitialData,
    processTick,
    processCandle,
    clear,
    size: candles.length,
  };
}

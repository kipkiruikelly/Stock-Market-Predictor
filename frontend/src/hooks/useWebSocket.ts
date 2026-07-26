/**
 * useWebSocket.ts — Reusable WebSocket hook with connection state machine,
 * auto-reconnect with exponential backoff, and clean lifecycle management.
 *
 * Connection states: 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
 *
 * Uses refs for all callbacks and a stable connect function to avoid
 * circular useCallback dependencies between connect and scheduleReconnect.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface UseWebSocketOptions {
  /** Full WebSocket URL, e.g. ws://localhost:8002/ws/candles/AAPL?interval=1d */
  url: string | null;
  /** Called with parsed JSON when a message arrives */
  onMessage: (data: any) => void;
  /** Called when connection state changes */
  onStateChange?: (state: ConnectionState) => void;
  /** Base delay for exponential backoff in ms (default 1000) */
  reconnectBaseMs?: number;
  /** Maximum backoff delay in ms (default 30000) */
  reconnectMaxMs?: number;
  /** Maximum reconnect attempts before giving up (default Infinity) */
  maxReconnectAttempts?: number;
  /** Whether to enable auto-reconnect (default true) */
  autoReconnect?: boolean;
}

export interface UseWebSocketReturn {
  connectionState: ConnectionState;
  sendMessage: (data: any) => void;
  disconnect: () => void;
  reconnectAttempt: number;
}

export function useWebSocket({
  url,
  onMessage,
  onStateChange,
  reconnectBaseMs = 1000,
  reconnectMaxMs = 30000,
  maxReconnectAttempts = Infinity,
  autoReconnect = true,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  // ── Refs (stable across renders) ──────────────────────────────────────
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const intentionalCloseRef = useRef(false);
  const mountedRef = useRef(true);

  // Keep latest callbacks + url + options in refs so the stable connect
  // function never needs to be recreated.
  const onMessageRef = useRef(onMessage);
  const onStateChangeRef = useRef(onStateChange);
  const urlRef = useRef(url);
  const autoReconnectRef = useRef(autoReconnect);
  const maxReconnectAttemptsRef = useRef(maxReconnectAttempts);
  const reconnectBaseMsRef = useRef(reconnectBaseMs);
  const reconnectMaxMsRef = useRef(reconnectMaxMs);

  onMessageRef.current = onMessage;
  onStateChangeRef.current = onStateChange;
  urlRef.current = url;
  autoReconnectRef.current = autoReconnect;
  maxReconnectAttemptsRef.current = maxReconnectAttempts;
  reconnectBaseMsRef.current = reconnectBaseMs;
  reconnectMaxMsRef.current = reconnectMaxMs;

  // ── Stable state setter ───────────────────────────────────────────────
  const setState = useCallback((state: ConnectionState) => {
    setConnectionState(state);
    onStateChangeRef.current?.(state);
  }, []);

  // ── Stable helpers ────────────────────────────────────────────────────
  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  // ── Stable connect (reads everything from refs — never stale) ─────────
  const connect = useCallback(() => {
    const currentUrl = urlRef.current;
    if (!currentUrl || !mountedRef.current) return;

    // Close any existing connection
    if (wsRef.current) {
      const ws = wsRef.current;
      ws.onopen = null;
      ws.onclose = null;
      ws.onerror = null;
      ws.onmessage = null;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      wsRef.current = null;
    }

    clearReconnectTimer();
    setState('connecting');

    try {
      const ws = new WebSocket(currentUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        reconnectAttemptRef.current = 0;
        setReconnectAttempt(0);
        setState('connected');
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          onMessageRef.current(data);
        } catch {
          onMessageRef.current({ _raw: event.data });
        }
      };

      ws.onerror = () => {
        // onclose will fire after this
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        wsRef.current = null;

        if (intentionalCloseRef.current) {
          intentionalCloseRef.current = false;
          setState('disconnected');
          return;
        }

        // Attempt reconnect if configured
        if (!autoReconnectRef.current) {
          setState('disconnected');
          return;
        }

        if (reconnectAttemptRef.current >= maxReconnectAttemptsRef.current) {
          setState('disconnected');
          return;
        }

        setState('reconnecting');
        const delay = Math.min(
          reconnectBaseMsRef.current * Math.pow(2, reconnectAttemptRef.current),
          reconnectMaxMsRef.current
        );
        const jitter = delay * 0.2 * (Math.random() * 2 - 1);
        const actualDelay = Math.round(delay + jitter);

        reconnectTimerRef.current = setTimeout(() => {
          if (!mountedRef.current) return;
          reconnectAttemptRef.current += 1;
          setReconnectAttempt(reconnectAttemptRef.current);
          connect(); // stable — refers to the same connect via useCallback([])
        }, actualDelay);
      };
    } catch {
      // Constructor threw (invalid URL) — schedule reconnect
      if (autoReconnectRef.current && reconnectAttemptRef.current < maxReconnectAttemptsRef.current) {
        setState('reconnecting');
        reconnectTimerRef.current = setTimeout(() => {
          if (!mountedRef.current) return;
          reconnectAttemptRef.current += 1;
          setReconnectAttempt(reconnectAttemptRef.current);
          connect();
        }, reconnectBaseMsRef.current);
      }
    }
  }, [clearReconnectTimer, setState]); // stable — no variable deps, all read from refs

  // ── Stable disconnect ─────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true;
    clearReconnectTimer();

    if (wsRef.current) {
      const ws = wsRef.current;
      ws.onopen = null;
      ws.onclose = null;
      ws.onerror = null;
      ws.onmessage = null;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      wsRef.current = null;
    }

    reconnectAttemptRef.current = 0;
    setReconnectAttempt(0);
    setState('disconnected');
  }, [clearReconnectTimer, setState]);

  // ── Stable send ───────────────────────────────────────────────────────
  const sendMessage = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }, []);

  // ── Effect: connect/disconnect on URL change ──────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    intentionalCloseRef.current = false;
    reconnectAttemptRef.current = 0;

    if (url) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      clearReconnectTimer();
      if (wsRef.current) {
        const ws = wsRef.current;
        ws.onopen = null;
        ws.onclose = null;
        ws.onerror = null;
        ws.onmessage = null;
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
        wsRef.current = null;
      }
    };
  }, [url, connect, clearReconnectTimer]);

  return { connectionState, sendMessage, disconnect, reconnectAttempt };
}

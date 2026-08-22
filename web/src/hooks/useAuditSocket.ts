import { useEffect, useState, useCallback, useRef } from "react";
import { WSMessage } from "@agentbreak/shared";

const WS_URL = import.meta.env.VITE_WS_URL || 
  (import.meta.env.PROD ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}` : "ws://localhost:3000");

export interface SocketState {
  connected: boolean;
  messages: WSMessage[];
  clear: () => void;
}

export function useAuditSocket(): SocketState {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      setConnected(true);
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WSMessage;
        // The server sends ACK messages when it receives messages from the client.
        // We can ignore them here, but we'll store all other events.
        if ((msg as any).type !== "ACK") {
          setMessages((prev) => [...prev, msg]);
        }
      } catch (e) {
        console.error("Failed to parse WS message", e);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      console.log("WebSocket disconnected, reconnecting in 2s...");
      setTimeout(connect, 2000);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      ws.close();
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect on unmount
        wsRef.current.close();
      }
    };
  }, [connect]);

  const clear = useCallback(() => {
    setMessages([]);
  }, []);

  return { connected, messages, clear };
}

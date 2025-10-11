import { useEffect, useRef, useState, createContext, useContext, ReactNode } from "react";

interface WebSocketContextType {
  ws: WebSocket | null;
  isConnected: boolean;
  subscribe: (callback: (data: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  ws: null,
  isConnected: false,
  subscribe: () => () => {},
});

export function WebSocketProvider({ children, userId }: { children: ReactNode; userId?: string }) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const subscribersRef = useRef<Set<(data: any) => void>>(new Set());

  useEffect(() => {
    if (!userId) {
      console.log("WebSocket: No userId, skipping connection");
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const hostname = window.location.hostname;
    const port = window.location.port;
    const host = port ? `${hostname}:${port}` : hostname;
    const wsUrl = `${protocol}//${host}/ws`;
    
    console.log("WebSocket: Connecting to", wsUrl, "for user", userId);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected for user:", userId);
      setIsConnected(true);
      // Register user for notifications
      ws.send(JSON.stringify({ type: "register", userId }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data);
        subscribersRef.current.forEach((callback) => callback(data));
      } catch (error) {
        console.error("WebSocket message parse error:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      console.log("WebSocket: Cleaning up connection");
      ws.close();
    };
  }, [userId]);

  const subscribe = (callback: (data: any) => void) => {
    subscribersRef.current.add(callback);
    return () => {
      subscribersRef.current.delete(callback);
    };
  };

  return (
    <WebSocketContext.Provider value={{ ws: wsRef.current, isConnected, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}

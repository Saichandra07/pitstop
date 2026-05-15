import { createContext, useContext, useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import { useAuth } from "./AuthContext";

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const { token } = useAuth();
  const clientRef     = useRef(null);
  const registeredRef = useRef([]);  // source of truth: all desired { destination, callback }
  const activeRef     = useRef(new Map()); // STOMP sub handles for the current connection

  const publish = useCallback((destination, body) => {
    const client = clientRef.current;
    if (client?.connected) {
      client.publish({ destination, body: JSON.stringify(body) });
    }
  }, []);

  const subscribe = useCallback((destination, callback) => {
    const entry = { destination, callback };
    registeredRef.current.push(entry);

    // Subscribe immediately if already connected
    const client = clientRef.current;
    if (client?.connected) {
      const sub = client.subscribe(destination, callback);
      activeRef.current.set(destination, sub);
    }

    return () => {
      registeredRef.current = registeredRef.current.filter(e => e !== entry);
      activeRef.current.get(destination)?.unsubscribe();
      activeRef.current.delete(destination);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      clientRef.current?.deactivate();
      clientRef.current = null;
      return;
    }

    const client = new Client({
      brokerURL: "ws://localhost:8080/ws",
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 2000,
      onConnect: () => {
        // Re-apply every registered subscription on every connect/reconnect.
        // Using registeredRef (not pendingRef) ensures subs survive reconnects.
        activeRef.current.clear();
        for (const { destination, callback } of registeredRef.current) {
          const sub = client.subscribe(destination, callback);
          activeRef.current.set(destination, sub);
        }
      },
      onDisconnect: () => {
        activeRef.current.clear();
      },
      onStompError: (frame) => {
        console.warn("STOMP error", frame);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      activeRef.current.clear();
    };
  }, [token]);

  return (
    <WebSocketContext.Provider value={{ subscribe, publish }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => useContext(WebSocketContext);

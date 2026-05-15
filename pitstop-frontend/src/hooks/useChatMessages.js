import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import api from "../api/axios";

export function useChatMessages(jobId) {
  const { subscribe, publish } = useWebSocket();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!jobId) return;

    api.get(`/jobs/${jobId}/messages`)
      .then(r => setMessages(r.data))
      .catch(() => {});

    const unsub = subscribe(`/topic/job/${jobId}/chat`, (frame) => {
      const msg = JSON.parse(frame.body);
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
    });

    return unsub;
  }, [jobId, subscribe]);

  const send = useCallback((body) => {
    if (!body?.trim()) return;
    publish(`/app/jobs/${jobId}/chat`, { body: body.trim() });
  }, [jobId, publish]);

  const markRead = useCallback(() => {
    if (!jobId) return;
    api.post(`/jobs/${jobId}/messages/read`).catch(() => {});
  }, [jobId]);

  return { messages, send, markRead };
}

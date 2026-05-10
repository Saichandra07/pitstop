import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useWebSocket } from "./WebSocketContext";
import api from "../api/axios";

const BroadcastContext = createContext();

export function BroadcastProvider({ children }) {
  const { user } = useAuth();
  const { subscribe } = useWebSocket();

  const [broadcasts, setBroadcasts]         = useState([]);
  const [abandonedJobOffer, setAbandonedJobOffer] = useState(null);
  const [snackbar, setSnackbar]             = useState(null);

  const receivedAtsRef = useRef({});  // { [broadcastId]: timestamp }
  const mechActedRef   = useRef({});  // { [broadcastId]: true }
  const snackbarTimer  = useRef(null);

  const showSnackbar = useCallback((message, type = "info") => {
    clearTimeout(snackbarTimer.current);
    setSnackbar({ message, type });
    snackbarTimer.current = setTimeout(() => setSnackbar(null), 3000);
  }, []);

  const poll = useCallback(async () => {
    if (user?.role !== "MECHANIC") return;
    try {
      const res      = await api.get("/jobs/broadcast/pending");
      const incoming = res.data || [];
      const newIds   = new Set(incoming.map(b => b.broadcastId));

      // Detect broadcasts that disappeared without mechanic action → user cancelled
      for (const prevId of Object.keys(receivedAtsRef.current).map(Number)) {
        if (!newIds.has(prevId) && !mechActedRef.current[prevId]) {
          showSnackbar("An SOS request was withdrawn by the user", "info");
        }
      }

      // Preserve existing receivedAt timestamps; anchor new ones to sentAt from server
      // so the timer is based on broadcast creation time, not when the frontend first saw it.
      const nextAts = {};
      for (const b of incoming) {
        nextAts[b.broadcastId] = receivedAtsRef.current[b.broadcastId] ?? new Date(b.sentAt).getTime();
      }
      receivedAtsRef.current = nextAts;

      // Prune mechActed to only current broadcasts
      const nextActed = {};
      for (const b of incoming) {
        if (mechActedRef.current[b.broadcastId]) nextActed[b.broadcastId] = true;
      }
      mechActedRef.current = nextActed;

      setBroadcasts(incoming.map(b => ({ ...b, _receivedAt: nextAts[b.broadcastId] })));
    } catch {
      setBroadcasts([]);
    }
  }, [user?.role]);

  // Initial fetch + 30s fallback poll (safety net when WS drops silently)
  useEffect(() => {
    if (user?.role !== "MECHANIC") return;
    poll();
    const id = setInterval(poll, 30000);
    return () => clearInterval(id);
  }, [user?.role, poll]);

  // WebSocket subscription — trigger immediate poll on any broadcast event
  useEffect(() => {
    if (!user?.id || user?.role !== "MECHANIC") return;
    const unsub = subscribe(`/topic/account/${user.id}/broadcast`, () => {
      poll();
    });
    return () => unsub?.();
  }, [user?.id, user?.role, subscribe, poll]);

  const handleAccept = useCallback(async (jobId, broadcastId, onSuccess) => {
    mechActedRef.current[broadcastId] = true;
    try {
      await api.post(`/jobs/${jobId}/accept`);
      setBroadcasts([]);
      receivedAtsRef.current = {};
      mechActedRef.current   = {};
      showSnackbar("Job accepted! Head to the user's location.", "success");
      if (onSuccess) await onSuccess();
      return { success: true };
    } catch (err) {
      const status = err.response?.status;
      if (status === 409 || status === 403 || status === 404) {
        setBroadcasts(prev => prev.filter(b => b.broadcastId !== broadcastId));
        showSnackbar("This request is no longer available", "info");
      } else {
        showSnackbar(err.response?.data?.message || "Could not accept job", "error");
      }
      return { success: false };
    }
  }, [showSnackbar]);

  const handleDecline = useCallback(async (jobId, broadcastId) => {
    mechActedRef.current[broadcastId] = true;
    try {
      await api.post(`/jobs/${jobId}/decline`);
      setBroadcasts(prev => prev.filter(b => b.broadcastId !== broadcastId));
    } catch (err) {
      const status = err.response?.status;
      if (status === 409 || status === 404) {
        setBroadcasts(prev => prev.filter(b => b.broadcastId !== broadcastId));
      } else {
        showSnackbar(err.response?.data?.message || "Could not decline", "error");
      }
    }
  }, [showSnackbar]);

  // Called by dedicated "Abandon job" button — shows offer screen after response.
  const handleAbandon = useCallback(async (jobId) => {
    try {
      const res  = await api.post(`/jobs/${jobId}/mechanic-abandon`);
      const data = res.data;
      if (data.showOffer) setAbandonedJobOffer(data);
      return data;
    } catch {
      showSnackbar("Could not abandon job", "error");
      return null;
    }
  }, [showSnackbar]);

  const handleTakeBack = useCallback(async (jobId, onSuccess) => {
    try {
      await api.post(`/jobs/${jobId}/mechanic-take-back`);
      setAbandonedJobOffer(null);
      showSnackbar("You're back on the job!", "success");
      if (onSuccess) await onSuccess();
      return { success: true };
    } catch (err) {
      setAbandonedJobOffer(null);
      if (err.response?.status === 409) {
        showSnackbar("Someone else got it — you're back online", "info");
      } else {
        showSnackbar("Could not take back job", "error");
      }
      return { success: false };
    }
  }, [showSnackbar]);

  const handleMoveOn = useCallback(async (jobId) => {
    try { await api.post(`/jobs/${jobId}/mechanic-move-on`); } catch { /* best-effort */ }
    setAbandonedJobOffer(null);
  }, []);

  // Called when mechanic goes offline — clears tracking refs so the next empty poll
  // is not mistaken for a user-cancelled broadcast.
  const clearBroadcastTracking = useCallback(() => {
    receivedAtsRef.current = {};
    mechActedRef.current   = {};
    setBroadcasts([]);
  }, []);

  return (
    <BroadcastContext.Provider value={{
      broadcasts,
      abandonedJobOffer, setAbandonedJobOffer,
      snackbar,
      handleAccept, handleDecline,
      handleAbandon, handleTakeBack, handleMoveOn,
      clearBroadcastTracking,
    }}>
      {children}
    </BroadcastContext.Provider>
  );
}

export function useBroadcast() {
  return useContext(BroadcastContext);
}

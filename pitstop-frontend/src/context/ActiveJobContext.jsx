import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useWebSocket } from "./WebSocketContext";
import api from "../api/axios";

const ActiveJobContext = createContext();

const ACTIVE_STATUSES = ["PENDING", "ACCEPTED", "ARRIVAL_REQUESTED", "IN_PROGRESS", "COMPLETION_REQUESTED"];

export function ActiveJobProvider({ children }) {
  const { user } = useAuth();
  const { subscribe } = useWebSocket();
  const role = user?.role;

  const [activeJob, setActiveJob]                       = useState(null);
  const [cancelledJob, setCancelledJob]                 = useState(null);   // user: system cancellation
  const [rebroadcastBanner, setRebroadcastBanner]       = useState(false);  // user: mechanic abandoned mid-job
  const [jobCancelledByUser, setJobCancelledByUser]     = useState(false);  // mechanic: user cancelled mid-job
  const [jobCompletedSuccessfully, setJobCompletedSuccessfully] = useState(false); // mechanic: user confirmed job done
  const [activeJobLoading, setActiveJobLoading]         = useState(false);
  const [snackbar, setSnackbar]                         = useState(null);
  const [justCompletedJobId, setJustCompletedJobId]     = useState(null);   // user: triggers RatingPrompt

  const snackbarTimer      = useRef(null);
  const prevStatusRef      = useRef(null);   // user-side: previous job status
  const prevActiveJobRef   = useRef(null);   // mechanic-side: previous job object
  const expectingJobEndRef = useRef(false);  // mechanic: we triggered the job end (not user)

  const showSnackbar = useCallback((message, type = "info") => {
    clearTimeout(snackbarTimer.current);
    setSnackbar({ message, type });
    snackbarTimer.current = setTimeout(() => setSnackbar(null), 3000);
  }, []);

  const fetchActiveJob = useCallback(async () => {
    if (!role || role === "ADMIN") return;

    if (role === "MECHANIC") {
      try {
        const res = await api.get("/jobs/mechanic/active");
        const job = res.data?.id ? res.data : null;
        // Job disappeared without mechanic action — distinguish completion from cancellation
        if (prevActiveJobRef.current?.id && !job && !expectingJobEndRef.current) {
          if (prevActiveJobRef.current.status === "COMPLETION_REQUESTED") {
            // Previous status was COMPLETION_REQUESTED → user confirmed, job done
            setJobCompletedSuccessfully(true);
          } else {
            // Poll may have missed intermediate statuses (e.g. rapid transitions in testing).
            // Look up the actual final status to distinguish COMPLETED from CANCELLED.
            const prevId = prevActiveJobRef.current.id;
            api.get(`/jobs/${prevId}`)
              .then(r => {
                if (r.data?.status === "COMPLETED") setJobCompletedSuccessfully(true);
                else setJobCancelledByUser(true);
              })
              .catch(() => setJobCancelledByUser(true));
          }
        }
        prevActiveJobRef.current = job;
        setActiveJob(job);
      } catch { setActiveJob(null); }

    } else if (role === "USER") {
      try {
        const res  = await api.get("/jobs/my/active");
        const jobs = res.data;
        const found = Array.isArray(jobs)
          ? jobs.find(j => ACTIVE_STATUSES.includes(j.status))
          : ACTIVE_STATUSES.includes(jobs?.status) ? jobs : null;

        // Detect system cancellation: was PENDING, now gone → check history for reason
        if (!found && prevStatusRef.current === "PENDING") {
          try {
            const histRes = await api.get("/jobs/my/history");
            const recent  = (histRes.data || [])[0];
            if (recent?.status === "CANCELLED" &&
                recent.cancellationReason &&
                recent.cancellationReason !== "USER_CANCELLED") {
              setCancelledJob(recent);
            }
          } catch {}
        }

        // Mechanic abandoned: was ACCEPTED/IN_PROGRESS, now back to PENDING
        if (found?.status === "PENDING" &&
            (prevStatusRef.current === "ACCEPTED" || prevStatusRef.current === "IN_PROGRESS")) {
          setRebroadcastBanner(true);
        }
        // Clear banner once job leaves PENDING or disappears
        if (prevStatusRef.current === "PENDING" && (!found || found.status !== "PENDING")) {
          setRebroadcastBanner(false);
        }

        prevStatusRef.current = found?.status ?? null;
        setActiveJob(found || null);
      } catch { setActiveJob(null); }
    }
  }, [role]);

  // Initial fetch + 30s fallback poll (safety net when WS drops silently)
  useEffect(() => {
    if (!role || role === "ADMIN") return;
    fetchActiveJob();
    const id = setInterval(fetchActiveJob, 30000);
    return () => clearInterval(id);
  }, [role, fetchActiveJob]);

  // WebSocket subscription — trigger immediate refetch on any job-update event
  useEffect(() => {
    if (!user?.id || !role || role === "ADMIN") return;
    const unsub = subscribe(`/topic/account/${user.id}/job-update`, () => {
      fetchActiveJob();
    });
    return () => unsub?.();
  }, [user?.id, role, subscribe, fetchActiveJob]);

  const handleJobStatus = useCallback(async (jobId, status) => {
    setActiveJobLoading(true);
    expectingJobEndRef.current = true;
    try {
      await api.patch(`/jobs/${jobId}/status?status=${status}`);
      await fetchActiveJob();
      if (status === "COMPLETED") showSnackbar("Job marked complete 🎉", "success");
    } catch {
      showSnackbar("Failed to update job status", "error");
    } finally {
      expectingJobEndRef.current = false;
      setActiveJobLoading(false);
    }
  }, [fetchActiveJob, showSnackbar]);

  const handleConfirmArrival = useCallback(async (jobId) => {
    setActiveJobLoading(true);
    try {
      await api.post(`/jobs/${jobId}/confirm-arrival`);
      await fetchActiveJob();
    } catch {
      showSnackbar("Could not confirm arrival", "error");
    } finally {
      setActiveJobLoading(false);
    }
  }, [fetchActiveJob, showSnackbar]);

  const handleRejectArrival = useCallback(async (jobId) => {
    setActiveJobLoading(true);
    try {
      await api.post(`/jobs/${jobId}/reject-arrival`);
      await fetchActiveJob();
    } catch {
      showSnackbar("Could not update status", "error");
    } finally {
      setActiveJobLoading(false);
    }
  }, [fetchActiveJob, showSnackbar]);

  const handleConfirmComplete = useCallback(async (jobId) => {
    setActiveJobLoading(true);
    try {
      await api.post(`/jobs/${jobId}/confirm-complete`);
      setJustCompletedJobId(jobId);
      setActiveJob(null);
      prevStatusRef.current = null;
      showSnackbar("Job completed! 🎉", "success");
    } catch {
      showSnackbar("Could not confirm completion", "error");
    } finally {
      setActiveJobLoading(false);
    }
  }, [showSnackbar]);

  const handleRejectComplete = useCallback(async (jobId) => {
    setActiveJobLoading(true);
    try {
      await api.post(`/jobs/${jobId}/reject-complete`);
      await fetchActiveJob();
    } catch {
      showSnackbar("Could not update status", "error");
    } finally {
      setActiveJobLoading(false);
    }
  }, [fetchActiveJob, showSnackbar]);

  const handleCancel = useCallback(async (jobId, status) => {
    if (status === "ACCEPTED") {
      const ok = window.confirm("A mechanic is already on the way. Cancel anyway?");
      if (!ok) return;
    }
    try {
      await api.patch(`/jobs/${jobId}/cancel`);
      setActiveJob(null);
      prevStatusRef.current = null;
    } catch (err) {
      showSnackbar(err.response?.data?.message || "Could not cancel job.", "error");
    }
  }, [showSnackbar]);

  return (
    <ActiveJobContext.Provider value={{
      activeJob, setActiveJob,
      cancelledJob, setCancelledJob,
      rebroadcastBanner,
      jobCancelledByUser, setJobCancelledByUser,
      jobCompletedSuccessfully, setJobCompletedSuccessfully,
      activeJobLoading,
      snackbar,
      justCompletedJobId, setJustCompletedJobId,
      handleJobStatus,
      handleConfirmArrival,
      handleRejectArrival,
      handleConfirmComplete,
      handleRejectComplete,
      handleCancel,
      refetchActiveJob: fetchActiveJob,
    }}>
      {children}
    </ActiveJobContext.Provider>
  );
}

export function useActiveJob() {
  return useContext(ActiveJobContext);
}

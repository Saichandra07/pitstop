import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_H           = 56;
const SHEET_COLLAPSED = 100;
const SHEET_EXPANDED  = 320;

const VEHICLE_LABELS = {
  TWO_WHEELER: "2-Wheeler", THREE_WHEELER: "3-Wheeler",
  FOUR_WHEELER: "4-Wheeler", SIX_PLUS_WHEELER: "6-Wheeler+",
};

const PROBLEM_LABELS = {
  BATTERY_DEAD: "Battery dead", ENGINE_OVERHEATING: "Engine overheating",
  ENGINE_WONT_START: "Engine won't start", ENGINE_NOISE: "Engine noise",
  OIL_LEAK: "Oil leak", FLAT_TYRE: "Flat tyre / puncture",
  TYRE_BURST: "Tyre burst", CHAIN_SNAPPED: "Chain snapped",
  BRAKE_FAILURE: "Brake failure", BRAKE_NOISE: "Brake noise",
  CLUTCH_FAILURE: "Clutch failure", SUSPENSION_DAMAGE: "Suspension damage",
  HEADLIGHTS_NOT_WORKING: "Headlights not working", ACCIDENT_DAMAGE: "Accident damage",
  VEHICLE_STUCK: "Vehicle stuck", STRANGE_NOISE: "Strange noise / smell",
  DONT_KNOW: "Don't know — just come", GEAR_STUCK: "Gear stuck",
  STEERING_LOCKED: "Steering locked", WARNING_LIGHT: "Warning light on dashboard",
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const HomeIcon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>;
const HistoryIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const ProfileIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const BellIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#FAC775" strokeWidth="1.5" strokeLinecap="round"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#FAC775" strokeWidth="1.5"/></svg>;

// ─── Wall Screens ─────────────────────────────────────────────────────────────

function PendingWall({ onLogout }) {
  return (
    <div style={{ minHeight: "100dvh", background: "#141414", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(250,199,117,0.1)", border: "0.5px solid rgba(250,199,117,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#FAC775" strokeWidth="1.5"/><path d="M12 8v4M12 16h.01" stroke="#FAC775" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, color: "#f0f0f0", marginBottom: 8, textAlign: "center" }}>Application received ✅</div>
      <div style={{ fontSize: 13, color: "#555", textAlign: "center", lineHeight: 1.6, marginBottom: 32 }}>Your application is under review. You'll be notified once approved.</div>
      <span style={{ fontSize: 11, fontWeight: 600, background: "rgba(250,199,117,0.1)", color: "#FAC775", borderRadius: 20, padding: "4px 12px", marginBottom: 40 }}>PENDING VERIFICATION</span>
      <button onClick={onLogout} style={{ background: "transparent", border: "0.5px solid #2a2a2a", color: "#555", borderRadius: 10, padding: "12px 32px", fontSize: 13, cursor: "pointer" }}>Logout</button>
    </div>
  );
}

function RejectedWall({ reason, onLogout, onResubmit }) {
  return (
    <div style={{ minHeight: "100dvh", background: "#141414", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(230,57,70,0.1)", border: "0.5px solid rgba(230,57,70,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#E63946" strokeWidth="1.5"/><path d="M15 9l-6 6M9 9l6 6" stroke="#E63946" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, color: "#f0f0f0", marginBottom: 16 }}>Application rejected</div>
      {reason && (
        <div style={{ background: "#1a1a1a", border: "0.5px solid #2a2a2a", borderRadius: 12, padding: "12px 16px", marginBottom: 24, width: "100%", maxWidth: 320 }}>
          <div style={{ fontSize: 11, color: "#484848", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Reason</div>
          <div style={{ fontSize: 13, color: "#d0d0d0" }}>{reason}</div>
        </div>
      )}
      <button onClick={onResubmit} style={{ background: "#E63946", border: "none", color: "#fff", borderRadius: 10, padding: "13px 32px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 12, width: "100%", maxWidth: 320 }}>Resubmit Application</button>
      <button onClick={onLogout} style={{ background: "transparent", border: "0.5px solid #2a2a2a", color: "#555", borderRadius: 10, padding: "12px 32px", fontSize: 13, cursor: "pointer", width: "100%", maxWidth: 320 }}>Logout</button>
    </div>
  );
}

function SuspendedWall({ onLogout }) {
  return (
    <div style={{ minHeight: "100dvh", background: "#141414", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(230,57,70,0.1)", border: "0.5px solid rgba(230,57,70,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#E63946" strokeWidth="1.5"/><path d="M12 8v5M12 16h.01" stroke="#E63946" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, color: "#f0f0f0", marginBottom: 8 }}>Account suspended</div>
      <div style={{ fontSize: 13, color: "#555", textAlign: "center", lineHeight: 1.6, marginBottom: 32 }}>Your account has been temporarily suspended. Contact support if you believe this is an error.</div>
      <button onClick={onLogout} style={{ background: "transparent", border: "0.5px solid #2a2a2a", color: "#555", borderRadius: 10, padding: "12px 32px", fontSize: 13, cursor: "pointer" }}>Logout</button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function MechanicDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [me, setMe]                             = useState(null);
  const [loading, setLoading]                   = useState(true);
  const [pendingJobs, setPendingJobs]           = useState([]);
  const [activeJob, setActiveJob]               = useState(null);
  const [togglingAvail, setTogglingAvail]       = useState(false);
  const [activeJobLoading, setActiveJobLoading] = useState(false);
  const [snackbar, setSnackbar]                 = useState(null);
  const [showLogoutSheet, setShowLogoutSheet]   = useState(false);
  const snackbarTimer                           = useRef(null);

  // Drag state — identical to DashboardPage
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [dragging, setDragging]           = useState(false);
  const [dragStartY, setDragStartY]       = useState(null);
  const [dragStartH, setDragStartH]       = useState(null);
  const [liveSheetH, setLiveSheetH]       = useState(null);

  // ── Fetchers ───────────────────────────────────────────────────────────────

  const fetchMe = useCallback(async () => {
    try {
      const res = await api.get("/accounts/me");
      setMe(res.data);
    } catch {
      showSnackbar("Failed to load account", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingJobs = useCallback(async () => {
    try { const res = await api.get("/jobs/pending"); setPendingJobs(res.data || []); }
    catch { setPendingJobs([]); }
  }, []);

  const fetchActiveJob = useCallback(async () => {
    try { const res = await api.get("/jobs/mechanic/active"); setActiveJob(res.data); }
    catch { setActiveJob(null); }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  useEffect(() => {
    if (me?.verificationStatus === "VERIFIED") {
      fetchActiveJob();
      if (me.isAvailable) fetchPendingJobs();
    }
  }, [me, fetchPendingJobs, fetchActiveJob]);

  // ── Snackbar ───────────────────────────────────────────────────────────────

  function showSnackbar(message, type = "info") {
    clearTimeout(snackbarTimer.current);
    setSnackbar({ message, type });
    snackbarTimer.current = setTimeout(() => setSnackbar(null), 3000);
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleToggleAvailability() {
    if (togglingAvail) return;
    setTogglingAvail(true);
    try {
      await api.patch("/accounts/availability");
      await fetchMe();
      if (!me.isAvailable) fetchPendingJobs();
    } catch (err) {
      const s = err.response?.status;
      if (s === 409)      showSnackbar("Complete your active job first", "warning");
      else if (s === 403) showSnackbar("Only verified mechanics can change availability", "error");
      else                showSnackbar("Something went wrong", "error");
    } finally {
      setTogglingAvail(false);
    }
  }

  async function handleJobStatus(jobId, status) {
    setActiveJobLoading(true);
    try {
      await api.patch(`/jobs/${jobId}/status`, { status });
      await fetchMe();
      await fetchActiveJob();
      if (status === "COMPLETED") showSnackbar("Job marked complete 🎉", "success");
    } catch {
      showSnackbar("Failed to update job status", "error");
    } finally {
      setActiveJobLoading(false);
    }
  }

  function handleLogout() { logout(); navigate("/login"); }

  // ── Drag (exact copy from DashboardPage) ───────────────────────────────────

  const snapHeight = sheetExpanded ? SHEET_EXPANDED : SHEET_COLLAPSED;

  function startDrag(startY) {
    setDragging(true); setDragStartY(startY);
    setDragStartH(snapHeight); setLiveSheetH(snapHeight);
  }
  function moveDrag(currentY) {
    if (!dragging || dragStartY === null) return;
    const delta = dragStartY - currentY;
    const newH = Math.min(SHEET_EXPANDED, Math.max(SHEET_COLLAPSED, dragStartH + delta));
    setLiveSheetH(newH);
  }
  function endDrag(currentY) {
    if (!dragging) return;
    const delta = dragStartY - currentY;
    if (delta > 40)       setSheetExpanded(true);
    else if (delta < -40) setSheetExpanded(false);
    setLiveSheetH(null); setDragging(false); setDragStartY(null); setDragStartH(null);
  }

  const handleTouchStart = (e) => startDrag(e.touches[0].clientY);
  const handleTouchMove  = (e) => moveDrag(e.touches[0].clientY);
  const handleTouchEnd   = (e) => endDrag(e.changedTouches[0].clientY);
  const handleMouseDown  = (e) => startDrag(e.clientY);
  const handleMouseMove  = (e) => moveDrag(e.clientY);
  const handleMouseUp    = (e) => endDrag(e.clientY);

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ minHeight: "100dvh", background: "#141414", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 20, height: 20, border: "2px solid #2a2a2a", borderTopColor: "#E63946", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!me) return null;

  // ── Wall screens ───────────────────────────────────────────────────────────

  if (me.verificationStatus === "PENDING" || me.verificationStatus === "UNVERIFIED")
    return <PendingWall onLogout={handleLogout} />;
  if (me.verificationStatus === "REJECTED")
    return <RejectedWall reason={me.rejectionReason} onLogout={handleLogout} onResubmit={() => navigate("/register/mechanic")} />;
  if (me.verificationStatus === "SUSPENDED")
    return <SuspendedWall onLogout={handleLogout} />;

  // ── Derived ────────────────────────────────────────────────────────────────

  const isOnline     = me.isAvailable;
  const hasActiveJob = !!activeJob;
  const initials     = (me.name || "M").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const greeting     = (() => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; })();

  const idleSheetH    = liveSheetH !== null ? liveSheetH : snapHeight;
  const currentSheetH = hasActiveJob ? 260 : idleSheetH;
  const snackbarColor = { warning: "#FAC775", error: "#E63946", success: "#61cd96", info: "#888" }[snackbar?.type] ?? "#888";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ position: "relative", width: "100%", height: "100dvh", overflow: "hidden", background: "#0d1a0d", fontFamily: "'Inter', sans-serif" }}>

      {/* Map */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, #1b2e1b 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
      <div style={{ position: "absolute", top: "38%", left: 0, right: 0, height: 2, background: "#1e321e", transform: "rotate(-3deg)" }} />
      <div style={{ position: "absolute", top: "55%", left: 0, right: 0, height: "1.5px", background: "#182818", transform: "rotate(-3deg)" }} />
      <div style={{ position: "absolute", left: "62%", top: 0, bottom: 0, width: "1.5px", background: "#1e321e" }} />
      <div style={{ position: "absolute", left: "30%", top: 0, bottom: 0, width: 1, background: "#182818" }} />
      <div style={{ position: "absolute", top: "42%", left: "48%", transform: "translate(-50%,-50%)", width: 14, height: 14, borderRadius: "50%", background: "#FAC775", boxShadow: "0 0 0 4px rgba(250,199,117,0.2)" }} />

      {/* Route when active job */}
      {hasActiveJob && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <svg width="100%" height="100%" viewBox="0 0 380 640" preserveAspectRatio="none">
            <path d="M 182 269 Q 200 200 110 148" stroke="#E63946" strokeWidth="2" fill="none" strokeDasharray="5,4" strokeLinecap="round" opacity="0.6" />
          </svg>
          <div style={{ position: "absolute", top: "22%", left: "26%", width: 10, height: 10, borderRadius: "50%", background: "#E63946", boxShadow: "0 0 0 3px rgba(230,57,70,0.25)" }} />
        </div>
      )}

      {/* Offline overlay */}
      {!isOnline && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 5 }} />}

      {/* Topbar — 3 col flex */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", padding: "18px 16px 12px", background: "linear-gradient(180deg, rgba(13,26,13,0.92) 0%, rgba(13,26,13,0) 100%)", zIndex: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.04em" }}>{greeting}</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#f0f0f0", marginTop: 1, letterSpacing: "-0.5px" }}>{me.name?.split(" ")[0] || "Mechanic"}</div>
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div onClick={handleToggleAvailability} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(15,15,15,0.92)", border: `0.5px solid ${isOnline ? "rgba(97,205,150,0.2)" : "rgba(255,255,255,0.08)"}`, borderRadius: 30, padding: "8px 14px", cursor: togglingAvail ? "wait" : "pointer", backdropFilter: "blur(4px)", opacity: togglingAvail ? 0.6 : 1, transition: "opacity 0.2s" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: isOnline ? "#61cd96" : "#555", flexShrink: 0, transition: "background 0.2s" }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: "#f0f0f0", letterSpacing: "0.02em" }}>{isOnline ? "Online" : "Offline"}</span>
            <div style={{ width: 32, height: 18, borderRadius: 9, background: isOnline ? "#61cd96" : "#333", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
              <div style={{ position: "absolute", top: 2, left: isOnline ? "auto" : 2, right: isOnline ? 2 : "auto", width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s, right 0.2s" }} />
            </div>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(20,20,20,0.75)", border: "0.5px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}><BellIcon /></div>
          <div onClick={() => setShowLogoutSheet(true)} style={{ width: 34, height: 34, borderRadius: "50%", background: "#E63946", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#fff", cursor: "pointer", userSelect: "none" }}>{initials}</div>
        </div>
      </div>

      {/* Bottom sheet — draggable */}
      <div
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
        style={{ position: "absolute", left: 0, right: 0, bottom: NAV_H, height: currentSheetH, background: "#141414", borderRadius: "24px 24px 0 0", padding: "10px 16px 16px", zIndex: 20, overflow: "hidden", transition: dragging ? "none" : "height 0.35s cubic-bezier(0.32,0.72,0,1)", boxShadow: "0 -1px 0 0 #1e1e1e", userSelect: "none", cursor: dragging ? "grabbing" : "default" }}
      >
        {/* Handle */}
        <div onClick={() => !hasActiveJob && setSheetExpanded(v => !v)} style={{ display: "flex", justifyContent: "center", paddingBottom: 12, cursor: hasActiveJob ? "default" : "pointer" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2a2a2a" }} />
        </div>

        {/* Active job */}
        {hasActiveJob && (
          <div>
            <div style={{ fontSize: 10, color: "#484848", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500, marginBottom: 10 }}>Active job</div>
            <div style={{ background: "#1a1a1a", border: "0.5px solid #252525", borderRadius: 16, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#f0f0f0" }}>{PROBLEM_LABELS[activeJob.problemType] || activeJob.problemType}</div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 3 }}>{VEHICLE_LABELS[activeJob.vehicleType] || activeJob.vehicleType} · {activeJob.vehicleName}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, background: "rgba(97,205,150,0.12)", color: "#61cd96", borderRadius: 20, padding: "4px 10px" }}>{activeJob.status === "ACCEPTED" ? "Accepted" : "In progress"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#111", borderRadius: 12, padding: "9px 12px", marginBottom: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#252525", border: "0.5px solid #333", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#666" }}>U</div>
                <div>
                  <div style={{ fontSize: 13, color: "#d0d0d0", fontWeight: 500 }}>User location</div>
                  <div style={{ fontSize: 11, color: "#484848", marginTop: 2 }}>Active request</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {activeJob.status === "ACCEPTED" && (
                  <button onClick={() => handleJobStatus(activeJob.id, "IN_PROGRESS")} disabled={activeJobLoading} style={{ flex: 1, height: 40, borderRadius: 10, background: "rgba(250,199,117,0.1)", border: "0.5px solid rgba(250,199,117,0.2)", color: "#FAC775", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: activeJobLoading ? 0.5 : 1 }}>Mark Arrived</button>
                )}
                {activeJob.status === "IN_PROGRESS" && (
                  <button onClick={() => handleJobStatus(activeJob.id, "COMPLETED")} disabled={activeJobLoading} style={{ flex: 1, height: 40, borderRadius: 10, background: "rgba(97,205,150,0.1)", border: "0.5px solid rgba(97,205,150,0.2)", color: "#61cd96", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: activeJobLoading ? 0.5 : 1 }}>Mark complete</button>
                )}
                <button onClick={() => window.open("tel:", "_self")} style={{ flex: 1, height: 40, borderRadius: 10, background: "transparent", border: "0.5px solid #2a2a2a", color: "#555", fontSize: 12, cursor: "pointer" }}>Call user</button>
              </div>
            </div>
          </div>
        )}

        {/* Online idle */}
        {isOnline && !hasActiveJob && (
          <div>
            <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: "0.09em", textTransform: "uppercase", fontWeight: 500, marginBottom: 10 }}>Nearby requests</div>
            {pendingJobs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <div style={{ fontSize: 13, color: "#333" }}>No nearby requests right now</div>
                <div style={{ fontSize: 11, color: "#2a2a2a", marginTop: 4 }}>You'll be notified when a job comes in</div>
              </div>
            ) : (
              pendingJobs.slice(0, 2).map(job => (
                <div key={job.id} style={{ background: "#1a1a1a", border: "0.5px solid #222", borderRadius: 12, padding: "11px 14px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 13, color: "#d0d0d0", fontWeight: 500 }}>{PROBLEM_LABELS[job.problemType] || job.problemType}</div>
                    <div style={{ fontSize: 11, color: "#484848", marginTop: 3 }}>{VEHICLE_LABELS[job.vehicleType] || job.vehicleType}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, background: "rgba(250,199,117,0.12)", color: "#FAC775", borderRadius: 20, padding: "3px 9px" }}>Pending</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Offline */}
        {!isOnline && !hasActiveJob && (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ fontSize: 13, color: "#555", marginBottom: 4 }}>You are offline</div>
            <div style={{ fontSize: 11, color: "#333" }}>Go online to start receiving job requests</div>
          </div>
        )}
      </div>

      {/* Bottom nav — position absolute, zIndex 30, above sheet's zIndex 20 */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: NAV_H, display: "flex", justifyContent: "space-around", alignItems: "center", background: "#111", borderTop: "0.5px solid #1e1e1e", zIndex: 30, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {[
          { label: "Home",    icon: <HomeIcon />,    path: "/mechanic/dashboard" },
          { label: "History", icon: <HistoryIcon />, path: "/history" },
          { label: "Profile", icon: <ProfileIcon />, path: "/profile" },
        ].map(({ label, icon, path }) => {
          const active = window.location.pathname === path;
          return (
            <div key={label} onClick={() => navigate(path)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: active ? "#E63946" : "#2e2e2e", cursor: "pointer", padding: "4px 16px" }}>
              {icon}
              <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Logout sheet */}
      {showLogoutSheet && (
        <>
          <div onClick={() => setShowLogoutSheet(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50 }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#1a1a1a", borderRadius: "20px 20px 0 0", padding: "24px 20px 36px", zIndex: 51, animation: "slideUp 0.22s ease-out" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2a2a2a" }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#f0f0f0", marginBottom: 6, textAlign: "center" }}>Log out of PitStop?</div>
            <div style={{ fontSize: 13, color: "#555", textAlign: "center", marginBottom: 24 }}>You'll need to sign back in to receive jobs.</div>
            <button onClick={handleLogout} style={{ width: "100%", height: 48, borderRadius: 12, background: "#E63946", border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 10 }}>Log out</button>
            <button onClick={() => setShowLogoutSheet(false)} style={{ width: "100%", height: 48, borderRadius: 12, background: "transparent", border: "0.5px solid #2a2a2a", color: "#555", fontSize: 14, cursor: "pointer" }}>Cancel</button>
          </div>
        </>
      )}

      {/* Snackbar */}
      {snackbar && (
        <div style={{ position: "absolute", bottom: 72, left: 16, right: 16, background: "#1e1e1e", border: `0.5px solid ${snackbarColor}33`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, zIndex: 60, animation: "slideUp 0.2s ease-out" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: snackbarColor, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "#d0d0d0" }}>{snackbar.message}</span>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
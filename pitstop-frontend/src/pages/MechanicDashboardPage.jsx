import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";

const NavigationMap = lazy(() => import("../components/NavigationMap"));
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBroadcast } from "../context/BroadcastContext";
import api from "../api/axios";
import BottomSheet from "../components/BottomSheet";
import PitStopLogo from "../components/PitStopLogo";
import Avatar from "../components/Avatar";
import BroadcastOverlay from "../components/BroadcastOverlay";

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

const JobsIcon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M12 12v4M10 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const HistoryIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const ProfileIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const BellIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="var(--gold)" strokeWidth="1.5"/></svg>;
const PhoneIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.5 2 2 0 0 1 3.6 1.3h3a2 2 0 0 1 2 1.72c.127.96.36 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.07 6.07l.96-.96a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;

// ─── Notification preference toggle ──────────────────────────────────────────
function PrefToggle({ label, enabled, onToggle }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:"1px solid var(--border)" }}>
      <span style={{ fontSize:14, color:"var(--text)" }}>{label}</span>
      <div onClick={onToggle} style={{ width:44, height:24, borderRadius:12, cursor:"pointer", position:"relative", background: enabled ? "var(--gold)" : "var(--surface3)", transition:"background .2s", flexShrink:0 }}>
        <div style={{ position:"absolute", top:3, left: enabled ? 23 : 3, width:18, height:18, borderRadius:"50%", background:"var(--bg)", transition:"left .2s" }} />
      </div>
    </div>
  );
}

// ─── Wall Screens ─────────────────────────────────────────────────────────────

function PendingWall({ onLogout }) {
  return (
    <div className="ps-wall">
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--gold-soft)", border: "1px solid var(--gold-border)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="var(--gold)" strokeWidth="1.5"/><path d="M12 8v4M12 16h.01" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </div>
      <p className="ps-wall-title">Application received ✅</p>
      <p className="ps-wall-sub">Your application is under review. You'll be notified once approved.</p>
      <span className="ps-tag ps-tag-gold" style={{ marginBottom: 40 }}>Pending Verification</span>
      <button onClick={onLogout} className="ps-btn-ghost" style={{ maxWidth: 200 }}>Logout</button>
    </div>
  );
}

function RejectedWall({ reason, onLogout, onResubmit }) {
  return (
    <div className="ps-wall">
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--red-soft)", border: "1px solid var(--red-border)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="var(--red)" strokeWidth="1.5"/><path d="M15 9l-6 6M9 9l6 6" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </div>
      <p className="ps-wall-title">Application rejected</p>
      {reason && (
        <div className="ps-card" style={{ width: "100%", maxWidth: 320, marginBottom: 24, textAlign: "left" }}>
          <div className="ps-section-label">Reason</div>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>{reason}</div>
        </div>
      )}
      <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={onResubmit} className="ps-btn">Resubmit Application</button>
        <button onClick={onLogout} className="ps-btn-ghost">Logout</button>
      </div>
    </div>
  );
}

function SuspendedWall({ onLogout }) {
  return (
    <div className="ps-wall">
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--red-soft)", border: "1px solid var(--red-border)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="var(--red)" strokeWidth="1.5"/><path d="M12 8v5M12 16h.01" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </div>
      <p className="ps-wall-title">Account suspended</p>
      <p className="ps-wall-sub">Your account has been temporarily suspended. Contact support if you believe this is an error.</p>
      <button onClick={onLogout} className="ps-btn-ghost" style={{ maxWidth: 200 }}>Logout</button>
    </div>
  );
}

// ─── Map Background ───────────────────────────────────────────────────────────

function MechanicMap({ hasActiveJob, isOnline }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--bg)" }}>
      {/* Gold grid — subtle blueprint */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(255,183,0,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,183,0,0.07) 1px,transparent 1px)",
        backgroundSize: "24px 24px",
      }} />

      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 80% 60% at 50% 45%, transparent 30%, rgba(12,14,22,0.7) 100%)",
      }} />

      {/* Road lines — faint, like actual map streets */}
      <div style={{ position: "absolute", top: "38%", left: 0, right: 0, height: 1, background: "rgba(255,183,0,0.08)", transform: "rotate(-3deg)" }} />
      <div style={{ position: "absolute", top: "55%", left: 0, right: 0, height: 1, background: "rgba(255,183,0,0.05)", transform: "rotate(-3deg)" }} />
      <div style={{ position: "absolute", left: "62%", top: 0, bottom: 0, width: 1, background: "rgba(255,183,0,0.08)" }} />
      <div style={{ position: "absolute", left: "30%", top: 0, bottom: 0, width: 1, background: "rgba(255,183,0,0.05)" }} />

      {/* Mechanic position dot */}
      <div style={{
        position: "absolute", top: "42%", left: "48%",
        transform: "translate(-50%,-50%)",
        width: 14, height: 14, borderRadius: "50%",
        background: isOnline ? "var(--green)" : "var(--text-3)",
        boxShadow: isOnline ? "0 0 0 4px rgba(74,222,128,0.15), 0 0 16px rgba(74,222,128,0.4)" : "none",
        transition: "background 0.3s",
        zIndex: 2,
      }} />

      {/* YOU label */}
      <div style={{
        position: "absolute", top: "42%", left: "48%",
        transform: "translate(-50%, calc(-50% + 14px))",
        fontSize: 9, fontWeight: 700, letterSpacing: "2px",
        textTransform: "uppercase", color: "rgba(74,222,128,0.4)",
        pointerEvents: "none", zIndex: 2,
      }}>YOU</div>

      {/* Route line when active job */}
      {hasActiveJob && (
        <>
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 380 640" preserveAspectRatio="none">
            <path d="M 182 269 Q 200 200 110 148" stroke="var(--red)" strokeWidth="2" fill="none" strokeDasharray="5,4" strokeLinecap="round" opacity="0.6" />
          </svg>
          <div style={{ position: "absolute", top: "22%", left: "26%", width: 10, height: 10, borderRadius: "50%", background: "var(--red)", boxShadow: "0 0 0 3px rgba(230,57,70,0.25)" }} />
        </>
      )}

      {/* Offline dim overlay */}
      {!isOnline && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 3 }} />
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function MechanicDashboardPage() {
  const { user, logout } = useAuth();
  const { handleAbandon, clearBroadcastTracking } = useBroadcast();
  const navigate = useNavigate();

  const [me, setMe]                           = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [pendingJobs, setPendingJobs]         = useState([]);
  const [activeJob, setActiveJob]             = useState(null);
  const [mechCoords, setMechCoords]           = useState(null);
  const [togglingAvail, setTogglingAvail]     = useState(false);
  const [activeJobLoading, setActiveJobLoading] = useState(false);
  const [snackbar, setSnackbar]               = useState(null);
  const [showLogoutSheet, setShowLogoutSheet] = useState(false);
  const [showNotifSheet, setShowNotifSheet]   = useState(false);
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pitstop_notif_prefs') || '{}'); }
    catch { return {}; }
  });
  const snackbarTimer      = useRef(null);
  const prevActiveJobRef   = useRef(null);
  const expectingJobEndRef = useRef(false);

  const [jobCancelledByUser, setJobCancelledByUser] = useState(false);
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
    try {
      const res = await api.get("/jobs/mechanic/active");
      const job = res.data?.id ? res.data : null;

      // Job disappeared without mechanic action → user cancelled mid-job
      if (prevActiveJobRef.current?.id && !job && !expectingJobEndRef.current) {
        setJobCancelledByUser(true);
        fetchMe(); // refresh isAvailable — backend already set it to true
      }
      prevActiveJobRef.current = job;
      setActiveJob(job);
    } catch { setActiveJob(null); }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  useEffect(() => {
    if (me?.verificationStatus === "VERIFIED") {
      fetchActiveJob();
      if (me.isAvailable) fetchPendingJobs();
    }
  }, [me, fetchPendingJobs, fetchActiveJob]);

  // Recover mechCoords after page refresh — mechanic is auto-offline during active job,
  // so we cannot check isAvailable here. Check activeJob only.
  useEffect(() => {
    if (activeJob && !mechCoords) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMechCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, [activeJob?.id, mechCoords]);

  // Poll active job every 5s while one exists — picks up user cancellations
  useEffect(() => {
    if (!activeJob) return;
    const id = setInterval(fetchActiveJob, 5000);
    return () => clearInterval(id);
  }, [activeJob?.id, fetchActiveJob]);

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
    const goingOnline = !me.isAvailable;

    const doToggle = async (latitude, longitude) => {
      try {
        await api.patch("/accounts/availability", { isAvailable: goingOnline, latitude, longitude });
        await fetchMe();
        if (goingOnline) fetchPendingJobs();
        else clearBroadcastTracking();
      } catch (err) {
        const s = err.response?.status;
        if (s === 409)      showSnackbar("Complete your active job first", "warning");
        else if (s === 403) showSnackbar("Only verified mechanics can change availability", "error");
        else if (s === 400) showSnackbar("Location required to go online", "error");
        else                showSnackbar("Something went wrong", "error");
      } finally {
        setTogglingAvail(false);
      }
    };

    if (goingOnline) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMechCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          doToggle(pos.coords.latitude, pos.coords.longitude);
        },
        () => { showSnackbar("Location required to go online", "error"); setTogglingAvail(false); }
      );
    } else {
      setMechCoords(null);
      await doToggle(null, null);
    }
  }

  // Called by BroadcastOverlay after accept or take-back success — refreshes dashboard state
  const onBroadcastAcceptSuccess = useCallback(async () => {
    await fetchMe();
    await fetchActiveJob();
  }, [fetchMe, fetchActiveJob]);

  async function handleJobStatus(jobId, status) {
    setActiveJobLoading(true);
    try {
      await api.patch(`/jobs/${jobId}/status`, { status });
      await fetchMe();
      expectingJobEndRef.current = true;
      await fetchActiveJob();
      if (status === "COMPLETED") showSnackbar("Job marked complete 🎉", "success");
    } catch {
      showSnackbar("Failed to update job status", "error");
    } finally {
      expectingJobEndRef.current = false;
      setActiveJobLoading(false);
    }
  }

  function handleLogout() { logout(); navigate("/login"); }

  const togglePref = (key) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    localStorage.setItem('pitstop_notif_prefs', JSON.stringify(updated));
  };

  // ── Drag ───────────────────────────────────────────────────────────────────

  const snapHeight = sheetExpanded ? SHEET_EXPANDED : SHEET_COLLAPSED;

  function startDrag(y) { setDragging(true); setDragStartY(y); setDragStartH(snapHeight); setLiveSheetH(snapHeight); }
  function moveDrag(y)  { if (!dragging || dragStartY === null) return; const d = dragStartY - y; setLiveSheetH(Math.min(SHEET_EXPANDED, Math.max(SHEET_COLLAPSED, dragStartH + d))); }
  function endDrag(y)   { if (!dragging) return; const d = dragStartY - y; if (d > 40) setSheetExpanded(true); else if (d < -40) setSheetExpanded(false); setLiveSheetH(null); setDragging(false); setDragStartY(null); setDragStartH(null); }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="ps-spinner" />
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

  const idleSheetH    = liveSheetH !== null ? liveSheetH : snapHeight;
  const currentSheetH = hasActiveJob ? 260 : idleSheetH;
  const snackbarColor = { warning: "var(--gold)", error: "var(--red)", success: "var(--green)", info: "var(--text-3)" }[snackbar?.type] ?? "var(--text-3)";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      style={{ position: "relative", width: "100%", height: "100dvh", overflow: "hidden", background: "var(--bg)", fontFamily: "var(--font)" }}
      onMouseMove={(e) => dragging && moveDrag(e.clientY)}
      onMouseUp={(e)   => dragging && endDrag(e.clientY)}
    >
      {/* Map layer — real Leaflet when job active + coords known, gold grid otherwise */}
      {hasActiveJob && mechCoords && activeJob?.latitude ? (
        <Suspense fallback={<MechanicMap hasActiveJob={true} isOnline={true} />}>
          <NavigationMap
            mechLat={mechCoords.lat}
            mechLng={mechCoords.lng}
            userLat={activeJob.latitude}
            userLng={activeJob.longitude}
          />
        </Suspense>
      ) : (
        <MechanicMap hasActiveJob={hasActiveJob} isOnline={isOnline} />
      )}

      {/* ── Google Maps button — always visible when active job has user coords ── */}
      {/* Uses destination-only URL so Google Maps uses device GPS as start point */}
      {hasActiveJob && activeJob?.latitude && (
        <button
          onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${activeJob.latitude},${activeJob.longitude}&travelmode=driving&dir_action=navigate`, "_blank")}
          style={{
            position: "absolute", bottom: 330, right: 16, zIndex: 25,
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(12,14,22,0.92)", backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,183,0,0.35)", borderRadius: 9999,
            padding: "9px 14px", cursor: "pointer",
            color: "var(--gold)", fontSize: 12, fontWeight: 600,
            boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#FFB700" strokeWidth="1.5"/>
            <circle cx="12" cy="9" r="2.5" stroke="#FFB700" strokeWidth="1.5"/>
          </svg>
          Open in Google Maps
        </button>
      )}

      {/* ── TopBar ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 16px 28px",
        background: "linear-gradient(180deg, rgba(12,14,22,0.97) 0%, rgba(12,14,22,0) 100%)",
      }}>
        <PitStopLogo variant="topbar" />

        {/* Online / offline pill — center; shows "On Job" during active job */}
        <div
          onClick={hasActiveJob ? undefined : handleToggleAvailability}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(18,20,31,0.92)", backdropFilter: "blur(4px)",
            border: `1px solid ${hasActiveJob ? "rgba(255,183,0,0.35)" : isOnline ? "var(--green-border)" : "var(--border)"}`,
            borderRadius: 9999, padding: "7px 14px",
            cursor: hasActiveJob ? "default" : togglingAvail ? "wait" : "pointer",
            opacity: togglingAvail ? 0.6 : 1,
            transition: "opacity 0.2s, border-color 0.2s",
          }}
        >
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: hasActiveJob ? "var(--gold)" : isOnline ? "var(--green)" : "var(--text-3)", flexShrink: 0, transition: "background 0.2s" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: hasActiveJob ? "var(--gold)" : "var(--text)", letterSpacing: "0.02em" }}>
            {togglingAvail ? "..." : hasActiveJob ? "On Job" : isOnline ? "Online" : "Offline"}
          </span>
          {/* Toggle track — hidden during active job */}
          {!hasActiveJob && (
            <div style={{ width: 30, height: 17, borderRadius: 9, background: isOnline ? "var(--green)" : "var(--surface3)", border: `1px solid ${isOnline ? "var(--green-border)" : "var(--border)"}`, position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
              <div style={{ position: "absolute", top: 2, width: 13, height: 13, borderRadius: "50%", background: "var(--text)", left: isOnline ? "calc(100% - 15px)" : 2, transition: "left 0.2s" }} />
            </div>
          )}
        </div>

        {/* Bell + Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div onClick={() => setShowNotifSheet(true)} style={{ position: "relative", width: 36, height: 36, borderRadius: "50%", background: "rgba(18,20,31,0.85)", border: "0.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <BellIcon />
            {Object.values(notifPrefs).some(Boolean) && (
              <div style={{ position: "absolute", top: 6, right: 6, width: 6, height: 6, borderRadius: "50%", background: "var(--gold)" }} />
            )}
          </div>
          <Avatar name={me?.name || "M"} size="sm" variant="red" onClick={() => setShowLogoutSheet(true)} />
        </div>
      </div>

      {/* ── Bottom Sheet ── */}
      <div
        onTouchStart={(e) => startDrag(e.touches[0].clientY)}
        onTouchMove={(e)  => moveDrag(e.touches[0].clientY)}
        onTouchEnd={(e)   => endDrag(e.changedTouches[0].clientY)}
        onMouseDown={(e)  => startDrag(e.clientY)}
        style={{
          position: "absolute", left: 0, right: 0, bottom: NAV_H,
          height: currentSheetH,
          background: "var(--bg)",
          borderRadius: "24px 24px 0 0",
          padding: "10px 16px 16px",
          zIndex: 20, overflow: "hidden",
          transition: dragging ? "none" : "height 0.35s cubic-bezier(0.32,0.72,0,1)",
          boxShadow: "0 -1px 0 0 var(--border)",
          userSelect: "none", cursor: dragging ? "grabbing" : "default",
        }}
      >
        {/* Drag handle */}
        <div onClick={() => !hasActiveJob && setSheetExpanded(v => !v)} style={{ display: "flex", justifyContent: "center", paddingBottom: 12, cursor: hasActiveJob ? "default" : "pointer" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--surface3)" }} />
        </div>

        {/* ── Active job ── */}
        {hasActiveJob && (
          <>
            <div className="ps-section-label">Active job</div>
            <div className="ps-card ps-card-gold" style={{ padding: "12px 14px" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>
                    {PROBLEM_LABELS[activeJob.problemType] || activeJob.problemType}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                    {VEHICLE_LABELS[activeJob.vehicleType] || activeJob.vehicleType} · {activeJob.vehicleName}
                  </div>
                </div>
                <span className={`ps-tag ${activeJob.status === "IN_PROGRESS" ? "ps-tag-green" : "ps-tag-gold"}`}>
                  {activeJob.status === "ACCEPTED" ? "En route" : "In progress"}
                </span>
              </div>
              {/* Next action hint */}
              <div style={{ fontSize: 11, color: "var(--text-3)", background: "var(--surface)", borderRadius: 8, padding: "7px 10px", marginBottom: 10 }}>
                {activeJob.status === "ACCEPTED"
                  ? "📍 Navigate to user — tap Mark Arrived when you get there"
                  : "🔧 Repair in progress — tap Mark Complete when done"}
              </div>
              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                {activeJob.status === "ACCEPTED" && (
                  <button onClick={() => handleJobStatus(activeJob.id, "IN_PROGRESS")} disabled={activeJobLoading} className="ps-btn-outline" style={{ flex: 2, height: 40, fontSize: 12, padding: 0, opacity: activeJobLoading ? 0.5 : 1 }}>
                    Mark Arrived
                  </button>
                )}
                {activeJob.status === "IN_PROGRESS" && (
                  <button onClick={() => handleJobStatus(activeJob.id, "COMPLETED")} disabled={activeJobLoading} className="ps-btn" style={{ flex: 2, height: 40, fontSize: 12, padding: 0, opacity: activeJobLoading ? 0.5 : 1 }}>
                    Mark Complete ✓
                  </button>
                )}
                <button onClick={() => window.open("tel:", "_self")} className="ps-btn-ghost" style={{ flex: 1, height: 40, fontSize: 12, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <PhoneIcon /> Call
                </button>
              </div>
              {/* Abandon — below main actions, smaller and muted so it's not accidentally tapped */}
              <button
                onClick={async () => {
                  const result = await handleAbandon(activeJob.id);
                  if (result) { await fetchMe(); await fetchActiveJob(); }
                }}
                style={{ marginTop: 8, width: "100%", background: "none", border: "none", color: "var(--text-3)", fontSize: 11, padding: "6px 0", cursor: "pointer", textDecoration: "underline", letterSpacing: "0.3px" }}
              >
                Abandon job
              </button>
            </div>
          </>
        )}

        {/* ── Online idle ── */}
        {isOnline && !hasActiveJob && (
          <>
            <div className="ps-section-label">Nearby requests</div>
            {pendingJobs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <div style={{ fontSize: 13, color: "var(--text-3)" }}>No nearby requests right now</div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4, opacity: 0.6 }}>You'll be notified when a job comes in</div>
              </div>
            ) : (
              pendingJobs.slice(0, 2).map(job => (
                <div key={job.id} className="ps-card" style={{ marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{PROBLEM_LABELS[job.problemType] || job.problemType}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>{VEHICLE_LABELS[job.vehicleType] || job.vehicleType}</div>
                  </div>
                  <span className="ps-tag ps-tag-gold">Pending</span>
                </div>
              ))
            )}
          </>
        )}

        {/* ── Offline idle ── */}
        {!isOnline && !hasActiveJob && (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: 13, color: "var(--text-3)" }}>You are offline</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4, opacity: 0.6 }}>Go online to start receiving job requests</div>
          </div>
        )}
      </div>

      {/* ── Bottom Nav ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: NAV_H,
        display: "flex", justifyContent: "space-around", alignItems: "center",
        background: "var(--surface)", borderTop: "1px solid var(--border)",
        zIndex: 30, paddingBottom: "env(safe-area-inset-bottom,0px)",
      }}>
        {[
          { label: "Jobs",    icon: <JobsIcon />,    path: "/mechanic/dashboard" },
          { label: "History", icon: <HistoryIcon />, path: "/mechanic/history" },
          { label: "Profile", icon: <ProfileIcon />, path: "/mechanic/profile" },
        ].map(({ label, icon, path }) => {
          const active = window.location.pathname === path;
          return (
            <div key={label} onClick={() => navigate(path)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: active ? "var(--red)" : "var(--text-3)", cursor: "pointer", padding: "4px 16px" }}>
              {icon}
              <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* ── Logout sheet ── */}
      {showLogoutSheet && (
        <div style={{ position: "absolute", inset: 0, zIndex: 100 }}>
          <div onClick={() => setShowLogoutSheet(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />
          <div className="ps-slide-up" style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "var(--surface)", borderRadius: "20px 20px 0 0", padding: "24px 20px 36px", zIndex: 101 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--surface3)" }} />
            </div>

            {hasActiveJob ? (
              /* ── Active job warning ── */
              <>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--red-soft)", border: "1px solid var(--red-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M12 9v4M12 16.5v.5" stroke="var(--red)" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="var(--red)" strokeWidth="1.5" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, marginBottom: 8, textAlign: "center" }}>You have an active job</p>
                <p style={{ color: "var(--text-3)", fontSize: 13, textAlign: "center", marginBottom: 24, lineHeight: 1.5 }}>
                  Logging out mid-job abandons the user and may result in a penalty on your account.
                </p>
                <button onClick={() => setShowLogoutSheet(false)} className="ps-btn" style={{ marginBottom: 10 }}>
                  Complete job first
                </button>
                <button
                  onClick={async () => {
                    try { await api.post(`/jobs/${activeJob.id}/mechanic-abandon`); } catch {}
                    handleLogout();
                  }}
                  style={{ width: "100%", background: "transparent", border: "none", color: "var(--red)", fontSize: 13, fontWeight: 500, padding: "10px 0", cursor: "pointer", opacity: 0.7 }}
                >
                  Log out anyway
                </button>
              </>
            ) : (
              /* ── Normal logout ── */
              <>
                <p style={{ color: "var(--text)", fontWeight: 600, fontSize: 16, marginBottom: 6, textAlign: "center" }}>Log out of PitStop?</p>
                <p style={{ color: "var(--text-3)", fontSize: 13, textAlign: "center", marginBottom: 24 }}>You'll need to sign back in to receive jobs.</p>
                <button onClick={handleLogout} className="ps-btn" style={{ marginBottom: 10 }}>Log out</button>
                <button onClick={() => setShowLogoutSheet(false)} className="ps-btn-ghost">Cancel</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── User-cancelled banner ── */}
      {jobCancelledByUser && !hasActiveJob && (
        <div style={{
          position: "absolute", top: 72, left: 16, right: 16, zIndex: 70,
          background: "var(--surface)", border: "1px solid rgba(255,183,0,0.35)",
          borderRadius: 14, padding: "14px 16px",
          display: "flex", alignItems: "flex-start", gap: 12,
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,183,0,0.1)", border: "1px solid rgba(255,183,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="var(--gold)" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M12 9v4M12 16.5v.5" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>Job cancelled by user</div>
            <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>You're back online and ready for new requests.</div>
          </div>
          <button
            onClick={() => setJobCancelledByUser(false)}
            style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 0 0 4px", flexShrink: 0 }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Snackbar ── */}
      {snackbar && (
        <div className="ps-slide-up" style={{
          position: "absolute", bottom: 72, left: 16, right: 16,
          background: "var(--surface2)", border: `1px solid ${snackbarColor}33`,
          borderRadius: 12, padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 10, zIndex: 60,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: snackbarColor, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "var(--text)" }}>{snackbar.message}</span>
        </div>
      )}

      {/* ── Global broadcast overlay (SOS cards, cancelled card, abandon offer) ── */}
      <BroadcastOverlay onAcceptSuccess={onBroadcastAcceptSuccess} />

      {/* ── Notification preferences sheet ── */}
      <BottomSheet isOpen={showNotifSheet} onClose={() => setShowNotifSheet(false)} title="Notifications">
        <PrefToggle label="New job requests"          enabled={!!notifPrefs.newJobs}        onToggle={() => togglePref('newJobs')} />
        <PrefToggle label="Account & approval updates" enabled={!!notifPrefs.accountUpdates} onToggle={() => togglePref('accountUpdates')} />
      </BottomSheet>
    </div>
  );
}
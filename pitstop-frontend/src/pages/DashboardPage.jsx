import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const VEHICLE_LABELS = {
  TWO_WHEELER: "2-Wheeler", THREE_WHEELER: "3-Wheeler",
  FOUR_WHEELER: "4-Wheeler", SIX_PLUS_WHEELER: "6-Wheeler+",
};

const PROBLEM_LABELS = {
  BATTERY_DEAD: "Battery dead", ENGINE_OVERHEATING: "Engine overheating",
  ENGINE_WONT_START: "Engine won't start", ENGINE_NOISE: "Engine noise",
  OIL_LEAK: "Oil leak", FLAT_TYRE: "Flat tyre / puncture", TYRE_BURST: "Tyre burst",
  CHAIN_SNAPPED: "Chain snapped", BRAKE_FAILURE: "Brake failure", BRAKE_NOISE: "Brake noise",
  CLUTCH_FAILURE: "Clutch failure", SUSPENSION_DAMAGE: "Suspension damage",
  HEADLIGHTS_NOT_WORKING: "Headlights not working", ACCIDENT_DAMAGE: "Accident damage",
  VEHICLE_STUCK: "Vehicle stuck", STRANGE_NOISE: "Strange noise / smell",
  DONT_KNOW: "Don't know — just come", GEAR_STUCK: "Gear stuck",
  STEERING_LOCKED: "Steering locked", WARNING_LIGHT: "Warning light on dashboard",
};

const VEHICLE_EMOJI = {
  TWO_WHEELER: "🛵", THREE_WHEELER: "🛺",
  FOUR_WHEELER: "🚗", SIX_PLUS_WHEELER: "🚛",
};

function problemLabel(p) { return PROBLEM_LABELS[p] || p; }
function vehicleLabel(v) { return VEHICLE_LABELS[v] || v; }
function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
function statusInfo(status) {
  switch (status) {
    case "PENDING":     return { label: "Searching...", color: "var(--gold)",  bg: "rgba(255,183,0,0.12)" };
    case "ACCEPTED":    return { label: "En route",     color: "var(--green)", bg: "rgba(74,222,128,0.12)" };
    case "IN_PROGRESS": return { label: "In progress",  color: "var(--green)", bg: "rgba(74,222,128,0.12)" };
    default:            return { label: status,          color: "var(--text-2)", bg: "var(--surface3)" };
  }
}
function historyBadge(status) {
  if (status === "COMPLETED") return { label: "Completed", color: "var(--green)", bg: "rgba(74,222,128,0.1)" };
  if (status === "CANCELLED") return { label: "Cancelled",  color: "var(--text-3)", bg: "var(--surface3)" };
  return { label: status, color: "var(--text-2)", bg: "var(--surface3)" };
}

const ACTIVE_STATUSES = ["PENDING", "ACCEPTED", "IN_PROGRESS"];
const NAV_H           = 56;
const SHEET_COLLAPSED = 120;
const SHEET_EXPANDED  = 340;

// ─── Icons ────────────────────────────────────────────────────────────────────

const BellIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.5 2 2 0 0 1 3.6 1.3h3a2 2 0 0 1 2 1.72c.127.96.36 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.07 6.07l.96-.96a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const SosNavIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <polygon points="12,3 22,21 2,21" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
    <path d="M12 10v5M12 17.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const HistoryIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M14 2v6h6M16 13H8M16 17H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ProfileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const SosAlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="var(--text)" strokeWidth="1.5"/>
    <path d="M12 7v6M12 16.5v.5" stroke="var(--text)" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ─── Heartbeat Map ────────────────────────────────────────────────────────────

function HeartbeatMap({ bottomOffset }) {
  const mechDots = [
    { top: "20%", left: "13%" },
    { top: "16%", left: "70%" },
    { top: "58%", left: "80%" },
    { top: "65%", left: "10%" },
    { top: "35%", left: "85%" },
    { top: "75%", left: "58%" },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--bg)" }}>

      <style>{`
        @keyframes psRing {
          0%   { transform: translate(-50%, -50%) scale(0.55); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1);    opacity: 0; }
        }
        .ps-r {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          animation: psRing 3.2s ease-out infinite;
        }
        .ps-r1 { animation-delay: 0s;   }
        .ps-r2 { animation-delay: 0.8s; }
        .ps-r3 { animation-delay: 1.6s; }
        .ps-r4 { animation-delay: 2.4s; }
      `}</style>

      {/* Gold grid */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.07,
        backgroundImage: "linear-gradient(var(--gold) 1px,transparent 1px),linear-gradient(90deg,var(--gold) 1px,transparent 1px)",
        backgroundSize: "24px 24px",
      }} />

      {/* Radial vignette */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 75% 55% at 50% 43%, transparent 25%, rgba(10,10,15,0.75) 100%)",
      }} />

      {/* Pulse rings — thick, vibrant */}
      {[
        { size: 300, cls: "ps-r ps-r1", color: "rgba(255,183,0,0.55)", width: "2px"   },
        { size: 220, cls: "ps-r ps-r2", color: "rgba(255,183,0,0.65)", width: "2.5px" },
        { size: 145, cls: "ps-r ps-r3", color: "rgba(255,183,0,0.75)", width: "3px"   },
        { size:  80, cls: "ps-r ps-r4", color: "rgba(255,183,0,0.85)", width: "3px"   },
      ].map(({ size, cls, color, width }, i) => (
        <div key={i} className={cls} style={{
          top: "43%", left: "50%",
          width: size, height: size,
          border: `${width} solid ${color}`,
          boxShadow: `0 0 12px ${color}`,
        }} />
      ))}

      {/* Static faint outermost ring — depth */}
      <div style={{
        position: "absolute", top: "43%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: 340, height: 340, borderRadius: "50%",
        border: "1px solid rgba(255,183,0,0.08)",
        pointerEvents: "none",
      }} />

      {/* Inner halo */}
      <div style={{
        position: "absolute", top: "43%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: 56, height: 56, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(230,57,70,0.2) 0%, transparent 70%)",
        border: "1.5px solid rgba(230,57,70,0.25)",
        pointerEvents: "none",
      }} />

      {/* User dot */}
      <div style={{
        position: "absolute", top: "43%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: 16, height: 16, borderRadius: "50%",
        background: "var(--red)",
        boxShadow: "0 0 0 5px rgba(230,57,70,0.25), 0 0 28px rgba(230,57,70,0.65)",
        zIndex: 3,
      }} />

      {/* YOU label */}
      <div style={{
        position: "absolute", top: "43%", left: "50%",
        transform: "translate(-50%, calc(-50% + 18px))",
        marginTop: 8, zIndex: 3, pointerEvents: "none",
        fontSize: 9, fontWeight: 700, letterSpacing: "2.5px",
        textTransform: "uppercase", color: "rgba(230,57,70,0.5)",
      }}>YOU</div>

      {/* Mechanic dots */}
      {mechDots.map((pos, i) => (
        <div key={i} style={{
          position: "absolute", ...pos,
          width: 8, height: 8, borderRadius: "50%",
          background: "var(--green)", opacity: 0.8,
          boxShadow: "0 0 10px rgba(74,222,128,0.7)",
        }} />
      ))}

      {/* Nearby counter */}
      <div style={{
        position: "absolute", top: 78, right: 16,
        background: "rgba(17,17,24,0.88)",
        border: "1px solid rgba(74,222,128,0.25)",
        borderRadius: 12, padding: "8px 12px",
        backdropFilter: "blur(6px)", textAlign: "center",
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--green)", lineHeight: 1 }}>6</div>
        <div style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "1px", textTransform: "uppercase", marginTop: 3 }}>nearby</div>
      </div>

      {/* Location label */}
      <div style={{
        position: "absolute", left: 16,
        bottom: bottomOffset + 14,
        display: "flex", alignItems: "center", gap: 5,
        transition: "bottom 0.35s cubic-bezier(0.32,0.72,0,1)",
      }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)" }} />
        <span style={{ fontSize: 10, color: "rgba(74,222,128,0.6)", letterSpacing: "0.07em", fontVariant: "all-small-caps" }}>
          Your location
        </span>
      </div>
    </div>
  );
}

// ─── Active Map ───────────────────────────────────────────────────────────────

function ActiveMap({ bottomOffset }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--bg)" }}>
      <div style={{
        position: "absolute", inset: 0, opacity: 0.07,
        backgroundImage: "linear-gradient(var(--gold) 1px,transparent 1px),linear-gradient(90deg,var(--gold) 1px,transparent 1px)",
        backgroundSize: "24px 24px",
      }} />
      <div style={{ position: "absolute", top: "38%", left: 0, right: 0, height: 2, background: "var(--surface2)", transform: "rotate(-3deg)" }} />
      <div style={{ position: "absolute", top: "55%", left: 0, right: 0, height: 1.5, background: "var(--surface)", transform: "rotate(-3deg)" }} />
      <div style={{ position: "absolute", left: "62%", top: 0, bottom: 0, width: 1.5, background: "var(--surface2)" }} />
      <div style={{ position: "absolute", left: "30%", top: 0, bottom: 0, width: 1, background: "var(--surface)" }} />
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 360 720">
        <path d="M 126 202 Q 160 260 173 259" stroke="var(--red)" strokeWidth="2.5" fill="none" strokeDasharray="5,4" strokeLinecap="round" opacity="0.5"/>
      </svg>
      <div style={{ position: "absolute", top: "36%", left: "48%", transform: "translate(-50%,-50%)", width: 12, height: 12, borderRadius: "50%", background: "var(--red)", boxShadow: "0 0 0 3px rgba(230,57,70,0.25)" }} />
      <div style={{ position: "absolute", top: "28%", left: "35%", width: 14, height: 14, borderRadius: "50%", background: "var(--gold)", boxShadow: "0 0 0 4px rgba(255,183,0,0.2)" }} />
      <div style={{ position: "absolute", top: "22%", left: "28%", background: "rgba(17,17,24,0.9)", border: "0.5px solid var(--border)", borderRadius: 8, padding: "5px 10px", fontSize: 11, color: "var(--gold)", fontWeight: 600, backdropFilter: "blur(4px)" }}>
        ~8 mins away
      </div>
      <div style={{
        position: "absolute", left: 16, bottom: bottomOffset + 14,
        display: "flex", alignItems: "center", gap: 5,
        transition: "bottom 0.35s cubic-bezier(0.32,0.72,0,1)",
      }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)" }} />
        <span style={{ fontSize: 10, color: "rgba(74,222,128,0.6)", letterSpacing: "0.07em", fontVariant: "all-small-caps" }}>Your location</span>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeJob, setActiveJob]       = useState(null);
  const [history, setHistory]           = useState([]);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [loading, setLoading]           = useState(true);
  const [showLogoutSheet, setShowLogoutSheet] = useState(false);
  const [dragging, setDragging]         = useState(false);
  const [dragStartY, setDragStartY]     = useState(null);
  const [dragStartH, setDragStartH]     = useState(null);
  const [liveSheetH, setLiveSheetH]     = useState(null);

  const fetchActive = useCallback(async () => {
    try {
      const res = await api.get("/jobs/my/active");
      const jobs = res.data;
      const found = Array.isArray(jobs)
        ? jobs.find((j) => ACTIVE_STATUSES.includes(j.status))
        : ACTIVE_STATUSES.includes(jobs?.status) ? jobs : null;
      setActiveJob(found || null);
    } catch { setActiveJob(null); }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get("/jobs/my/history");
      setHistory((res.data || []).slice(0, 2));
    } catch { setHistory([]); }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchActive(), fetchHistory()]);
      setLoading(false);
    })();
  }, [fetchActive, fetchHistory]);

  const handleCancel = async (jobId, status) => {
    if (status === "ACCEPTED") {
      const ok = window.confirm("A mechanic is already on the way. Cancel anyway?");
      if (!ok) return;
    }
    try {
      await api.patch(`/jobs/${jobId}/cancel`);
      setActiveJob(null);
      fetchHistory();
    } catch (err) {
      alert(err.response?.data?.message || "Could not cancel job.");
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  const snapHeight = sheetExpanded ? SHEET_EXPANDED : SHEET_COLLAPSED;

  function startDrag(y) { setDragging(true); setDragStartY(y); setDragStartH(snapHeight); setLiveSheetH(snapHeight); }
  function moveDrag(y)  { if (!dragging || dragStartY === null) return; const d = dragStartY - y; setLiveSheetH(Math.min(SHEET_EXPANDED, Math.max(SHEET_COLLAPSED, dragStartH + d))); }
  function endDrag(y)   { if (!dragging) return; const d = dragStartY - y; if (d > 40) setSheetExpanded(true); else if (d < -40) setSheetExpanded(false); setLiveSheetH(null); setDragging(false); setDragStartY(null); setDragStartH(null); }

  const firstName  = user?.name?.split(" ")[0] || "there";
  const initials   = getInitials(user?.name || "");
  const si         = activeJob ? statusInfo(activeJob.status) : null;
  const hasActiveJob = !!activeJob;

  const idleSheetH      = liveSheetH !== null ? liveSheetH : (sheetExpanded ? SHEET_EXPANDED : SHEET_COLLAPSED);
  const activeSheetH    = hasActiveJob ? (activeJob.status === "PENDING" ? 180 : 260) : idleSheetH;
  const mapBottomOffset = activeSheetH + NAV_H;

  return (
    <div
      style={{ position: "relative", width: "100%", height: "100dvh", overflow: "hidden", background: "var(--bg)", fontFamily: "'Inter',sans-serif" }}
      onMouseMove={(e) => dragging && moveDrag(e.clientY)}
      onMouseUp={(e)   => dragging && endDrag(e.clientY)}
    >
      {/* Map layer */}
      {hasActiveJob
        ? <ActiveMap bottomOffset={mapBottomOffset} />
        : <HeartbeatMap bottomOffset={mapBottomOffset} />
      }

      {/* ── TopBar ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 16px 28px",
        background: "linear-gradient(180deg, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0) 100%)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 28, height: 28, background: "rgba(230,57,70,0.15)", border: "1.5px solid var(--red)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" stroke="var(--red)" strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
  </svg>
</div>
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", letterSpacing: 0.2 }}>PitStop</span>
        </div>

        {/* Greeting pill */}
        <div style={{
          background: "rgba(255,255,255,0.06)", border: "0.5px solid var(--border)",
          borderRadius: 20, padding: "5px 12px",
          display: "flex", alignItems: "center", gap: 5,
        }}>
          <span style={{ fontSize: 13 }}>👋</span>
          <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>{firstName}</span>
        </div>

        {/* Bell + Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(17,17,24,0.8)", border: "0.5px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BellIcon />
          </div>
          <div
            onClick={() => setShowLogoutSheet(true)}
            style={{
              width: 36, height: 36, borderRadius: "50%", background: "var(--red)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "var(--text)",
              letterSpacing: "0.04em", cursor: "pointer", userSelect: "none",
            }}
          >{initials}</div>
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
          height: activeSheetH,
          background: "var(--bg)",
          borderRadius: "24px 24px 0 0",
          padding: "10px 16px 16px",
          zIndex: 20, overflow: "hidden",
          transition: dragging ? "none" : "height 0.35s cubic-bezier(0.32,0.72,0,1)",
          boxShadow: "0 -1px 0 0 var(--border)",
          userSelect: "none", cursor: dragging ? "grabbing" : "default",
        }}
      >
        {/* Drag handle — idle only */}
        {!hasActiveJob && (
          <div onClick={() => setSheetExpanded((v) => !v)} style={{ display: "flex", justifyContent: "center", paddingBottom: 10, cursor: "pointer" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--surface3)" }} />
          </div>
        )}

        {/* ── Idle state ── */}
        {!hasActiveJob && (
          <>
            {/* SOS Button */}
            <button
              onClick={() => navigate("/sos")}
              style={{
                width: "100%", background: "var(--red)", border: "none", borderRadius: 16,
                padding: "0 20px", height: 64,
                display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer",
              }}
            >
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.2px" }}>SOS — Need help</div>
                <div style={{ fontSize: 12, color: "rgba(240,240,240,0.45)", marginTop: 3 }}>Tap to request a mechanic</div>
              </div>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(255,255,255,0.13)", border: "0.5px solid rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <SosAlertIcon />
              </div>
            </button>

            {/* Last job strip */}
            {history.length > 0 ? (
              <div
                onClick={() => navigate("/history")}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", background: "var(--surface)",
                  borderRadius: 12, border: "1px solid var(--border)", marginTop: 10, cursor: "pointer",
                }}
              >
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
                  {VEHICLE_EMOJI[history[0].vehicleType] || "🚗"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {problemLabel(history[0].problemType)} · {history[0].vehicleName}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{formatDate(history[0].createdAt)}</div>
                </div>
                <span style={{ fontSize: 11, color: "var(--green)", fontWeight: 600, flexShrink: 0 }}>Done</span>
                <span style={{ color: "var(--text-3)", fontSize: 14, flexShrink: 0 }}>›</span>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", paddingTop: 10 }}>
                Your first SOS is one tap away
              </div>
            )}

            {/* Expanded: recent jobs */}
            {sheetExpanded && history.length > 0 && (
              <>
                <div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 600, margin: "16px 0 8px" }}>
                  Recent requests
                </div>
                {history.map((job) => {
                  const badge = historyBadge(job.status);
                  return (
                    <div key={job.id} style={{
                      background: "var(--surface)", border: "1px solid var(--border)",
                      borderRadius: 12, padding: "11px 14px", marginBottom: 8,
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                      <div>
                        <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{problemLabel(job.problemType)}</div>
                        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>
                          {vehicleLabel(job.vehicleType)} · {job.vehicleName} · {formatDate(job.createdAt)}
                        </div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, background: badge.bg, color: badge.color, borderRadius: 9999, padding: "3px 9px", whiteSpace: "nowrap" }}>
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}

        {/* ── Active job card ── */}
        {hasActiveJob && (
          <div style={{ background: "var(--surface)", border: "1px solid rgba(255,183,0,0.3)", borderRadius: 16, padding: 14 }}>
            <div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>
              Active request
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{problemLabel(activeJob.problemType)}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>{vehicleLabel(activeJob.vehicleType)} · {activeJob.vehicleName}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, background: si.bg, color: si.color, borderRadius: 9999, padding: "4px 10px", whiteSpace: "nowrap" }}>
                {si.label}
              </span>
            </div>
            {(activeJob.status === "ACCEPTED" || activeJob.status === "IN_PROGRESS") && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface2)", borderRadius: 12, padding: "9px 12px", marginBottom: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--surface3)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "var(--text-3)", flexShrink: 0 }}>M</div>
                <div>
                  <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>Mechanic assigned</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                    {activeJob.status === "IN_PROGRESS" ? "Working on your vehicle" : "On the way to you"}
                  </div>
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              {(activeJob.status === "ACCEPTED" || activeJob.status === "IN_PROGRESS") && (
                <button style={{
                  flex: 1, height: 40, borderRadius: 10,
                  background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)",
                  color: "var(--green)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                }}>
                  <PhoneIcon /> Call mechanic
                </button>
              )}
              {(activeJob.status === "PENDING" || activeJob.status === "ACCEPTED") && (
                <button
                  onClick={() => handleCancel(activeJob.id, activeJob.status)}
                  style={{ flex: 1, height: 40, borderRadius: 10, background: "transparent", border: "1px solid var(--border)", color: "var(--text-3)", fontSize: 12, cursor: "pointer" }}
                >
                  Cancel
                </button>
              )}
            </div>
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
          { label: "SOS",     icon: <SosNavIcon />,  path: "/dashboard" },
          { label: "History", icon: <HistoryIcon />, path: "/history"   },
          { label: "Profile", icon: <ProfileIcon />, path: "/profile"   },
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
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "var(--surface)", borderRadius: "20px 20px 0 0", padding: "24px 20px 36px", zIndex: 101 }}>
            <p style={{ color: "var(--text)", fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Log out?</p>
            <p style={{ color: "var(--text-3)", fontSize: 13, marginBottom: 24 }}>You'll need to sign in again to use PitStop.</p>
            <button onClick={handleLogout} style={{ width: "100%", height: 48, borderRadius: 12, background: "var(--red)", border: "none", color: "var(--text)", fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 10 }}>Log out</button>
            <button onClick={() => setShowLogoutSheet(false)} style={{ width: "100%", height: 48, borderRadius: 12, background: "transparent", border: "1px solid var(--border)", color: "var(--text-3)", fontSize: 14, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
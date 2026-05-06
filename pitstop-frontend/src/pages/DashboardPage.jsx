import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import TopBar from "../components/TopBar";
import WallScreen from "../components/WallScreen";
import Avatar from "../components/Avatar";
import BottomNav from "../components/BottomNav";
import JobCard from "../components/JobCard";
import BottomSheet from "../components/BottomSheet";
import Badge from "../components/Badge";

// ─── Constants ────────────────────────────────────────────────────────────────
const ACTIVE_STATUSES = ["PENDING", "ACCEPTED", "IN_PROGRESS"];
const NAV_H           = 56;
const SHEET_COLLAPSED = 128;   // SOS button (64) + strip (~44) + padding
const SHEET_EXPANDED  = 340;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusInfo(status) {
  switch (status) {
    case "PENDING":     return { label: "Searching...", variant: "gold"  };
    case "ACCEPTED":    return { label: "En route",     variant: "green" };
    case "IN_PROGRESS": return { label: "In progress",  variant: "green" };
    default:            return { label: status,          variant: "dim"   };
  }
}

function jobStatusVariant(status) {
  switch (status) {
    case "COMPLETED":  return "green";
    case "CANCELLED":  return "red";
    case "IN_PROGRESS":
    case "ACCEPTED":   return "gold";
    default:           return "dim";
  }
}

function jobStatusLabel(status) {
  switch (status) {
    case "COMPLETED":   return "Done";
    case "CANCELLED":   return "Cancelled";
    case "IN_PROGRESS": return "In progress";
    case "ACCEPTED":    return "En route";
    case "PENDING":     return "Searching";
    default:            return status;
  }
}

function fmtProblem(str) {
  if (!str) return "—";
  return str.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

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

const SosAlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="var(--text)" strokeWidth="1.5"/>
    <path d="M12 7v6M12 16.5v.5" stroke="var(--text)" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

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

// ─── Compact last-job strip ───────────────────────────────────────────────────
// Single-line glanceable row — NOT a full JobCard.
// Shows: problem label · vehicle · status badge · chevron
function LastJobStrip({ job, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "10px 12px",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      {/* Text block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "block",
        }}>
          {fmtProblem(job.problemType)}
        </span>
        <span style={{ fontSize: 11, color: "var(--text-3)" }}>
          {job.vehicleName || job.vehicleType?.replace(/_/g, " ")}
        </span>
      </div>

      {/* Badge + chevron */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <Badge variant={jobStatusVariant(job.status)}>
          {jobStatusLabel(job.status)}
        </Badge>
        <span style={{ fontSize: 16, color: "var(--text-3)", lineHeight: 1 }}>›</span>
      </div>
    </button>
  );
}

// ─── Heartbeat Map ────────────────────────────────────────────────────────────
function HeartbeatMap({ bottomOffset }) {
  const mechDots = [
    { top: "20%", left: "13%" }, { top: "16%", left: "70%" },
    { top: "58%", left: "80%" }, { top: "65%", left: "10%" },
    { top: "35%", left: "85%" }, { top: "75%", left: "58%" },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--bg)" }}>
      <style>{`
        @keyframes psRing {
          0%   { transform: translate(-50%,-50%) scale(0.2); opacity: 0; }
          12%  { opacity: 1; }
          100% { transform: translate(-50%,-50%) scale(1);   opacity: 0; }
        }
        .ps-r { position:absolute; border-radius:50%; pointer-events:none; animation: psRing 3.2s ease-out infinite; animation-fill-mode: both; }
        .ps-r1 { animation-delay:0s; } .ps-r2 { animation-delay:0.8s; }
        .ps-r3 { animation-delay:1.6s; } .ps-r4 { animation-delay:2.4s; }
      `}</style>
      <div style={{ position:"absolute", inset:0, opacity:0.07, backgroundImage:"linear-gradient(rgba(255,183,0,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,183,0,1) 1px,transparent 1px)", backgroundSize:"24px 24px" }} />
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", background:"radial-gradient(ellipse 75% 55% at 50% 43%, transparent 25%, rgba(12,14,22,0.75) 100%)" }} />
      {[
        { size:300, cls:"ps-r ps-r1", color:"rgba(255,183,0,0.55)", width:"2px"   },
        { size:220, cls:"ps-r ps-r2", color:"rgba(255,183,0,0.65)", width:"2.5px" },
        { size:145, cls:"ps-r ps-r3", color:"rgba(255,183,0,0.75)", width:"3px"   },
        { size: 80, cls:"ps-r ps-r4", color:"rgba(255,183,0,0.85)", width:"3px"   },
      ].map(({ size, cls, color, width }, i) => (
        <div key={i} className={cls} style={{ top:"43%", left:"50%", width:size, height:size, border:`${width} solid ${color}`, boxShadow:`0 0 12px ${color}` }} />
      ))}
      <div style={{ position:"absolute", top:"43%", left:"50%", transform:"translate(-50%,-50%)", width:56, height:56, borderRadius:"50%", background:"radial-gradient(circle, rgba(230,57,70,0.2) 0%, transparent 70%)", border:"1.5px solid rgba(230,57,70,0.25)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", top:"43%", left:"50%", transform:"translate(-50%,-50%)", width:16, height:16, borderRadius:"50%", background:"var(--red)", boxShadow:"0 0 0 5px rgba(230,57,70,0.25), 0 0 28px rgba(230,57,70,0.65)", zIndex:3 }} />
      <div style={{ position:"absolute", top:"43%", left:"50%", transform:"translate(-50%, calc(-50% + 18px))", marginTop:8, zIndex:3, pointerEvents:"none", fontSize:9, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:"rgba(230,57,70,0.5)" }}>YOU</div>
      {mechDots.map((pos, i) => (
        <div key={i} style={{ position:"absolute", ...pos, width:8, height:8, borderRadius:"50%", background:"var(--green)", opacity:0.8, boxShadow:"0 0 10px rgba(74,222,128,0.7)" }} />
      ))}
      <div style={{ position:"absolute", top:78, right:16, background:"rgba(18,20,31,0.96)", border:"1px solid rgba(74,222,128,0.25)", borderRadius:12, padding:"8px 12px", textAlign:"center" }}>
        <div style={{ fontSize:18, fontWeight:800, color:"var(--green)", lineHeight:1 }}>6</div>
        <div style={{ fontSize:9, color:"var(--text-3)", letterSpacing:"1px", textTransform:"uppercase", marginTop:3 }}>nearby</div>
      </div>
      <div style={{ position:"absolute", left:16, bottom:bottomOffset+14, display:"flex", alignItems:"center", gap:5, transition:"bottom 0.35s cubic-bezier(0.32,0.72,0,1)" }}>
        <div style={{ width:5, height:5, borderRadius:"50%", background:"var(--green)" }} />
        <span style={{ fontSize:10, color:"rgba(74,222,128,0.6)", letterSpacing:"0.07em", fontVariant:"all-small-caps" }}>Your location</span>
      </div>
    </div>
  );
}

// ─── Active Map ───────────────────────────────────────────────────────────────
function ActiveMap() {
  return (
    <div style={{ position:"absolute", inset:0, background:"var(--bg)" }}>
      {/* Grid */}
      <div style={{ position:"absolute", inset:0, opacity:0.07, backgroundImage:"linear-gradient(rgba(255,183,0,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,183,0,1) 1px,transparent 1px)", backgroundSize:"24px 24px" }} />
      {/* Vignette */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", background:"radial-gradient(ellipse 75% 55% at 50% 43%, transparent 25%, rgba(12,14,22,0.75) 100%)" }} />
      {/* User dot */}
      <div style={{ position:"absolute", top:"43%", left:"50%", transform:"translate(-50%,-50%)", width:56, height:56, borderRadius:"50%", background:"radial-gradient(circle, rgba(230,57,70,0.2) 0%, transparent 70%)", border:"1.5px solid rgba(230,57,70,0.25)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", top:"43%", left:"50%", transform:"translate(-50%,-50%)", width:16, height:16, borderRadius:"50%", background:"var(--red)", boxShadow:"0 0 0 5px rgba(230,57,70,0.25), 0 0 28px rgba(230,57,70,0.65)", zIndex:3 }} />
      <div style={{ position:"absolute", top:"43%", left:"50%", transform:"translate(-50%, calc(-50% + 18px))", zIndex:3, pointerEvents:"none", fontSize:9, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:"rgba(230,57,70,0.5)" }}>YOU</div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeJob, setActiveJob]             = useState(null);
  const [cancelledJob, setCancelledJob]       = useState(null);
  const [history, setHistory]                 = useState([]);
  const [sheetExpanded, setSheetExpanded]     = useState(false);
  const [loading, setLoading]                 = useState(true);
  const [showLogoutSheet, setShowLogoutSheet] = useState(false);
  const [showNotifSheet, setShowNotifSheet]   = useState(false);
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pitstop_notif_prefs') || '{}'); }
    catch { return {}; }
  });
  const [dragging, setDragging]               = useState(false);
  const [dragStartY, setDragStartY]           = useState(null);
  const [dragStartH, setDragStartH]           = useState(null);
  const [liveSheetH, setLiveSheetH]           = useState(null);
  const [rebroadcastBanner, setRebroadcastBanner] = useState(false);

  const prevStatusRef = useRef(null);

  const fetchActive = useCallback(async () => {
    try {
      const res  = await api.get("/jobs/my/active");
      const jobs = res.data;
      const found = Array.isArray(jobs)
        ? jobs.find((j) => ACTIVE_STATUSES.includes(j.status))
        : ACTIVE_STATUSES.includes(jobs?.status) ? jobs : null;

      // Detect system cancellation: was PENDING, now gone → check history for reason
      if (!found && prevStatusRef.current === "PENDING") {
        try {
          const histRes = await api.get("/jobs/my/history");
          const recent = (histRes.data || [])[0];
          if (recent?.status === "CANCELLED" &&
              recent.cancellationReason &&
              recent.cancellationReason !== "USER_CANCELLED") {
            setCancelledJob(recent);
          }
        } catch {}
      }

      // Mechanic abandoned: was ACCEPTED/IN_PROGRESS, now PENDING → show banner
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

  // Poll every 5s for any active job — catches status changes from either side
  useEffect(() => {
    if (!activeJob || !ACTIVE_STATUSES.includes(activeJob.status)) return;
    const id = setInterval(fetchActive, 5000);
    return () => clearInterval(id);
  }, [activeJob?.status, fetchActive]);

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

  const togglePref = (key) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    localStorage.setItem('pitstop_notif_prefs', JSON.stringify(updated));
  };

  const snapHeight = sheetExpanded ? SHEET_EXPANDED : SHEET_COLLAPSED;
  function startDrag(y) { setDragging(true); setDragStartY(y); setDragStartH(snapHeight); setLiveSheetH(snapHeight); }
  function moveDrag(y)  { if (!dragging || dragStartY === null) return; const d = dragStartY - y; setLiveSheetH(Math.min(SHEET_EXPANDED, Math.max(SHEET_COLLAPSED, dragStartH + d))); }
  function endDrag(y)   { if (!dragging) return; const d = dragStartY - y; if (d > 40) setSheetExpanded(true); else if (d < -40) setSheetExpanded(false); setLiveSheetH(null); setDragging(false); setDragStartY(null); setDragStartH(null); }

  const firstName    = user?.name?.split(" ")[0] || "there";
  const hasActiveJob = !!activeJob;
  const si           = activeJob ? statusInfo(activeJob.status) : null;

  const idleSheetH      = liveSheetH !== null ? liveSheetH : (sheetExpanded ? SHEET_EXPANDED : SHEET_COLLAPSED);
  // "auto" lets the card grow to its content — avoids clipping when content exceeds a fixed value.
  // mapBottomOffset needs a numeric estimate because "auto" + NAV_H is not valid math.
  const activeSheetH    = hasActiveJob ? "auto" : idleSheetH;
  const mapBottomOffset = (hasActiveJob
    ? (activeJob.status === "PENDING" ? 248 : 280)
    : idleSheetH) + NAV_H;

  return (
    <div
      style={{ position:"relative", width:"100%", height:"100dvh", overflow:"hidden", background:"var(--bg)", fontFamily:"'Inter',sans-serif" }}
      onMouseMove={(e) => dragging && moveDrag(e.clientY)}
      onMouseUp={(e)   => dragging && endDrag(e.clientY)}
    >
      {/* Map — HeartbeatMap when idle or PENDING (still searching), ActiveMap only when mechanic is assigned */}
      {(hasActiveJob && (activeJob.status === "ACCEPTED" || activeJob.status === "IN_PROGRESS"))
        ? <ActiveMap />
        : <HeartbeatMap bottomOffset={mapBottomOffset} />}

      {/* ── TopBar — absolute over map ── */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, zIndex:10,
        padding:"16px 16px 28px",
        background:"linear-gradient(180deg, rgba(12,14,22,0.97) 0%, rgba(12,14,22,0) 100%)",
      }}>
        <TopBar
          centerContent={
            <div style={{
              background: "rgba(230,57,70,0.09)",
              border: "1px solid rgba(230,57,70,0.25)",
              borderRadius: 20,
              padding: "5px 14px",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <span style={{ fontSize: 13 }}>👋</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.2px" }}>{firstName}</span>
            </div>
          }
          rightContent={
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div onClick={() => setShowNotifSheet(true)} style={{ position:"relative", width:36, height:36, borderRadius:"50%", background:"rgba(18,20,31,0.85)", border:"0.5px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                <BellIcon />
                {Object.values(notifPrefs).some(Boolean) && (
                  <div style={{ position:"absolute", top:6, right:6, width:6, height:6, borderRadius:"50%", background:"var(--gold)" }} />
                )}
              </div>
              <Avatar name={user?.name || "U"} size="sm" variant="red" onClick={() => setShowLogoutSheet(true)} />
            </div>
          }
        />
      </div>

      {/* ── Draggable bottom sheet ── */}
      <div
        onTouchStart={(e) => startDrag(e.touches[0].clientY)}
        onTouchMove={(e)  => moveDrag(e.touches[0].clientY)}
        onTouchEnd={(e)   => endDrag(e.changedTouches[0].clientY)}
        onMouseDown={(e)  => startDrag(e.clientY)}
        style={{
          position:"absolute", left:0, right:0, bottom:NAV_H,
          height: activeSheetH,
          background:"var(--bg)",
          borderRadius:"24px 24px 0 0",
          padding:"10px 16px 16px",
          zIndex:20, overflow: hasActiveJob ? "visible" : "hidden",
          transition: dragging ? "none" : "height 0.35s cubic-bezier(0.32,0.72,0,1)",
          boxShadow:"0 -1px 0 0 var(--border)",
          userSelect:"none", cursor: dragging ? "grabbing" : "default",
        }}
      >
        {/* Drag handle */}
        {!hasActiveJob && (
          <div onClick={() => setSheetExpanded(v => !v)} style={{ display:"flex", justifyContent:"center", paddingBottom:10, cursor:"pointer" }}>
            <div style={{ width:36, height:4, borderRadius:2, background:"var(--surface3)" }} />
          </div>
        )}

        {/* ── Idle state ── */}
        {!hasActiveJob && (
          <>
            {/* SOS button */}
            <button
              onClick={() => navigate("/sos")}
              style={{ width:"100%", background:"var(--red)", border:"none", borderRadius:16, padding:"0 20px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }}
            >
              <div style={{ textAlign:"left" }}>
                <div style={{ fontSize:17, fontWeight:700, color:"var(--text)", letterSpacing:"-0.2px" }}>SOS — Need help</div>
                <div style={{ fontSize:12, color:"rgba(240,240,240,0.45)", marginTop:3 }}>Tap to request a mechanic</div>
              </div>
              <div style={{ width:44, height:44, borderRadius:"50%", background:"rgba(255,255,255,0.13)", border:"0.5px solid rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <SosAlertIcon />
              </div>
            </button>

            {/* ── Collapsed: compact last-job strip ── */}
            {!sheetExpanded && history.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <LastJobStrip job={history[0]} onClick={() => navigate("/history")} />
              </div>
            )}

            {/* ── Collapsed: no history ── */}
            {!sheetExpanded && history.length === 0 && (
              <div style={{ fontSize:12, color:"var(--text-3)", textAlign:"center", paddingTop:14 }}>
                Your first SOS is one tap away
              </div>
            )}

            {/* ── Expanded: recent requests section ── */}
            {sheetExpanded && (
              <>
                <div style={{ fontSize:10, color:"var(--text-3)", letterSpacing:"1.5px", textTransform:"uppercase", fontWeight:700, margin:"14px 0 10px" }}>
                  Recent requests
                </div>
                {history.length > 0
                  ? history.map((job) => (
                      <div key={job.id} style={{ marginBottom: 8 }}>
                        <JobCard job={job} onClick={() => navigate("/history")} />
                      </div>
                    ))
                  : <div style={{ fontSize:12, color:"var(--text-3)", textAlign:"center", paddingTop:8 }}>No trips yet</div>
                }
              </>
            )}
          </>
        )}

        {/* ── Active job card ── */}
        {hasActiveJob && (
          <div style={{ background:"var(--surface)", border:"1px solid rgba(255,183,0,0.3)", borderRadius:16, padding:14 }}>
            <div style={{ fontSize:10, color:"var(--text-3)", letterSpacing:"1px", textTransform:"uppercase", fontWeight:600, marginBottom:10 }}>
              Active request
            </div>

            {/* Mechanic-abandoned banner */}
            {rebroadcastBanner && (
              <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(230,57,70,0.08)", border:"1px solid rgba(230,57,70,0.2)", borderRadius:10, padding:"8px 12px", marginBottom:10 }}>
                <span style={{ fontSize:12 }}>⚠️</span>
                <span style={{ fontSize:12, color:"var(--text-2)" }}>
                  Previous mechanic couldn't continue. Finding a new one...
                </span>
              </div>
            )}

            {/* PENDING — ring broadcast progress */}
            {activeJob.status === "PENDING" && (
              <div style={{ display:"flex", alignItems:"center", gap:12, background:"var(--surface2)", borderRadius:12, padding:"10px 12px", marginBottom:12 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--gold)", flexShrink:0, boxShadow:"0 0 8px rgba(255,183,0,0.6)", animation:"psGoldPulse 1.4s ease-in-out infinite" }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--gold)" }}>
                    Ring {activeJob.broadcastRing ?? 1} of 4
                  </div>
                  <div style={{ fontSize:11, color:"var(--text-3)", marginTop:2 }}>
                    Searching mechanics {["within 2km","2–5 km away","5–10 km away","10–20 km away"][(activeJob.broadcastRing ?? 1) - 1]}
                  </div>
                </div>
                <Badge variant="gold">{si.label}</Badge>
              </div>
            )}

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:600, color:"var(--text)" }}>{fmtProblem(activeJob.problemType)}</div>
                <div style={{ fontSize:12, color:"var(--text-3)", marginTop:3 }}>{activeJob.vehicleType?.replace(/_/g," ")} · {activeJob.vehicleName}</div>
              </div>
              {activeJob.status !== "PENDING" && <Badge variant={si.variant}>{si.label}</Badge>}
            </div>

            {(activeJob.status === "ACCEPTED" || activeJob.status === "IN_PROGRESS") && (
              <div style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(74,222,128,0.07)", border:"1px solid rgba(74,222,128,0.2)", borderRadius:12, padding:"10px 12px", marginBottom:10 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--green)", flexShrink:0, boxShadow:"0 0 8px rgba(74,222,128,0.6)" }} />
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"var(--green)" }}>
                    {activeJob.status === "IN_PROGRESS" ? "Mechanic arrived" : "Mechanic on the way"}
                  </div>
                  <div style={{ fontSize:11, color:"var(--text-3)", marginTop:2 }}>
                    {activeJob.status === "IN_PROGRESS" ? "Working on your vehicle" : "Live tracking coming soon"}
                  </div>
                </div>
              </div>
            )}
            <div style={{ display:"flex", gap:8 }}>
              {(activeJob.status === "ACCEPTED" || activeJob.status === "IN_PROGRESS") && (
                <button style={{ flex:1, height:40, borderRadius:10, background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.2)", color:"var(--green)", fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                  <PhoneIcon /> Call mechanic
                </button>
              )}
              {(activeJob.status === "PENDING" || activeJob.status === "ACCEPTED") && (
                <button onClick={() => handleCancel(activeJob.id, activeJob.status)} style={{ flex:1, height:40, borderRadius:10, background:"transparent", border:"1px solid var(--border)", color:"var(--text-3)", fontSize:12, cursor:"pointer" }}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Nav ── */}
      <BottomNav role="user" active="sos" />

      {/* ── Notification preferences sheet ── */}
      <BottomSheet isOpen={showNotifSheet} onClose={() => setShowNotifSheet(false)} title="Notifications">
        <PrefToggle label="SOS status updates"     enabled={!!notifPrefs.jobStatus}    onToggle={() => togglePref('jobStatus')} />
        <PrefToggle label="Mechanic nearby alerts"  enabled={!!notifPrefs.nearbyAlerts} onToggle={() => togglePref('nearbyAlerts')} />
      </BottomSheet>

      {/* ── Logout sheet ── */}
      <BottomSheet isOpen={showLogoutSheet} onClose={() => setShowLogoutSheet(false)} title="Log out?">
        <p style={{ fontSize:13, color:"var(--text-3)", marginBottom:24 }}>You'll need to sign in again to use PitStop.</p>
        <button onClick={handleLogout} className="ps-btn" style={{ marginBottom:10 }}>Log out</button>
        <button onClick={() => setShowLogoutSheet(false)} className="ps-btn-ghost">Cancel</button>
      </BottomSheet>

      {/* ── System cancellation overlay ── */}
      {cancelledJob && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 100,
          background: "var(--bg)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: 24,
        }}>
          <WallScreen
            icon={cancelledJob.cancellationReason === "NO_MECHANICS_AVAILABLE" ? "🔍" : "⏳"}
            title={
              cancelledJob.cancellationReason === "NO_MECHANICS_AVAILABLE"
                ? "No mechanics nearby"
                : "All mechanics busy"
            }
            subtitle={
              cancelledJob.cancellationReason === "NO_MECHANICS_AVAILABLE"
                ? "No mechanics are available in your area right now. Try again in a few minutes."
                : "All nearby mechanics were busy right now. Try again shortly."
            }
          >
            <button
              className="ps-btn"
              onClick={() => { setCancelledJob(null); fetchHistory(); }}
            >
              Try again
            </button>
          </WallScreen>
        </div>
      )}
    </div>
  );
}
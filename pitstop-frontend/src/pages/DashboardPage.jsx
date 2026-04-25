import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getInitials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const VEHICLE_LABELS = {
  TWO_WHEELER: "2-Wheeler",
  THREE_WHEELER: "3-Wheeler",
  FOUR_WHEELER: "4-Wheeler",
  SIX_PLUS_WHEELER: "6-Wheeler+",
};

const PROBLEM_LABELS = {
  BATTERY_DEAD: "Battery dead",
  ENGINE_OVERHEATING: "Engine overheating",
  ENGINE_WONT_START: "Engine won't start",
  ENGINE_NOISE: "Engine noise",
  OIL_LEAK: "Oil leak",
  FLAT_TYRE: "Flat tyre / puncture",
  TYRE_BURST: "Tyre burst",
  CHAIN_SNAPPED: "Chain snapped",
  BRAKE_FAILURE: "Brake failure",
  BRAKE_NOISE: "Brake noise",
  CLUTCH_FAILURE: "Clutch failure",
  SUSPENSION_DAMAGE: "Suspension damage",
  HEADLIGHTS_NOT_WORKING: "Headlights not working",
  ACCIDENT_DAMAGE: "Accident damage",
  VEHICLE_STUCK: "Vehicle stuck",
  STRANGE_NOISE: "Strange noise / smell",
  DONT_KNOW: "Don't know — just come",
  GEAR_STUCK: "Gear stuck",
  STEERING_LOCKED: "Steering locked",
  WARNING_LIGHT: "Warning light on dashboard",
};

function vehicleLabel(v) { return VEHICLE_LABELS[v] || v; }
function problemLabel(p) { return PROBLEM_LABELS[p] || p; }

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function statusInfo(status) {
  switch (status) {
    case "PENDING":
      return { label: "Searching...", color: "#FAC775", bg: "rgba(250,199,117,0.12)" };
    case "ACCEPTED":
      return { label: "En route", color: "#61cd96", bg: "rgba(97,205,150,0.12)" };
    case "IN_PROGRESS":
      return { label: "In progress", color: "#61cd96", bg: "rgba(97,205,150,0.12)" };
    default:
      return { label: status, color: "#888", bg: "rgba(255,255,255,0.06)" };
  }
}

function historyBadge(status) {
  if (status === "COMPLETED")
    return { label: "Completed", color: "#61cd96", bg: "rgba(97,205,150,0.1)" };
  if (status === "CANCELLED")
    return { label: "Cancelled", color: "#555", bg: "rgba(255,255,255,0.05)" };
  return { label: status, color: "#888", bg: "rgba(255,255,255,0.06)" };
}

const ACTIVE_STATUSES = ["PENDING", "ACCEPTED", "IN_PROGRESS"];

// ─── Heights (single source of truth) ───────────────────────────────────────
// NAV_H: fixed bottom nav bar
// SHEET_COLLAPSED: drag handle (28px) + SOS button (68px) + padding (16px)
// SHEET_EXPANDED: collapsed + recent jobs section (~220px)
const NAV_H = 56;
const SHEET_COLLAPSED = 112;   // handle (28) + SOS button (68) + padding (16)
const SHEET_EXPANDED  = 340;   // handle + SOS + recent cards section

// ─── SVG icons (inline, no external dep) ────────────────────────────────────

const BellIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#FAC775" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#FAC775" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.5 2 2 0 0 1 3.6 1.3h3a2 2 0 0 1 2 1.72c.127.96.36 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.07 6.07l.96-.96a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
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
    <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="1.5"/>
    <path d="M12 7v6M12 16.5v.5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ─── Map backgrounds ─────────────────────────────────────────────────────────

// Idle map — fills entire screen, map adjusts bottom padding via prop
function IdleMap({ bottomOffset }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "#0d1a0d" }}>
      {/* dot grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(circle, #1b2e1b 1px, transparent 1px)",
        backgroundSize: "18px 18px",
      }} />
      {/* roads */}
      <div style={{ position: "absolute", top: "38%", left: 0, right: 0, height: 2, background: "#1e321e", transform: "rotate(-3deg)" }} />
      <div style={{ position: "absolute", top: "55%", left: 0, right: 0, height: 1.5, background: "#182818", transform: "rotate(-3deg)" }} />
      <div style={{ position: "absolute", top: "70%", left: 0, right: 0, height: 1, background: "#141e14", transform: "rotate(-3deg)" }} />
      <div style={{ position: "absolute", left: "62%", top: 0, bottom: 0, width: 1.5, background: "#1e321e" }} />
      <div style={{ position: "absolute", left: "30%", top: 0, bottom: 0, width: 1, background: "#182818" }} />
      {/* pulse rings */}
      <div style={{ position: "absolute", top: "36%", left: "48%", transform: "translate(-50%,-50%)", width: 64, height: 64, borderRadius: "50%", border: "1px solid rgba(230,57,70,0.15)" }} />
      <div style={{ position: "absolute", top: "36%", left: "48%", transform: "translate(-50%,-50%)", width: 40, height: 40, borderRadius: "50%", border: "1px solid rgba(230,57,70,0.10)" }} />
      <div style={{ position: "absolute", top: "36%", left: "48%", transform: "translate(-50%,-50%)", width: 22, height: 22, borderRadius: "50%", background: "rgba(230,57,70,0.10)" }} />
      {/* user pin */}
      <div style={{ position: "absolute", top: "36%", left: "48%", transform: "translate(-50%,-50%)", width: 12, height: 12, borderRadius: "50%", background: "#E63946", boxShadow: "0 0 0 3px rgba(230,57,70,0.25)" }} />
      {/* mechanic dots */}
      {[{ top: "18%", left: "16%" }, { top: "42%", left: "72%" }, { top: "25%", left: "78%" }, { top: "52%", left: "22%" }].map((pos, i) => (
        <div key={i} style={{ position: "absolute", ...pos, width: 7, height: 7, borderRadius: "50%", background: "#61cd96", opacity: 0.7 }} />
      ))}
      {/* location label — sits just above the bottom sheet, moves with it */}
      <div style={{ position: "absolute", bottom: bottomOffset + 12, left: 16, display: "flex", alignItems: "center", gap: 5, transition: "bottom 0.35s cubic-bezier(0.32,0.72,0,1)" }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#61cd96" }} />
        <span style={{ fontSize: 10, color: "rgba(97,205,150,0.6)", letterSpacing: "0.07em", fontVariant: "all-small-caps" }}>Your location</span>
      </div>
    </div>
  );
}

// Active job map
function ActiveMap({ bottomOffset }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "#0d1a0d" }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(circle, #1b2e1b 1px, transparent 1px)",
        backgroundSize: "18px 18px",
      }} />
      <div style={{ position: "absolute", top: "38%", left: 0, right: 0, height: 2, background: "#1e321e", transform: "rotate(-3deg)" }} />
      <div style={{ position: "absolute", top: "55%", left: 0, right: 0, height: 1.5, background: "#182818", transform: "rotate(-3deg)" }} />
      <div style={{ position: "absolute", top: "70%", left: 0, right: 0, height: 1, background: "#141e14", transform: "rotate(-3deg)" }} />
      <div style={{ position: "absolute", left: "62%", top: 0, bottom: 0, width: 1.5, background: "#1e321e" }} />
      <div style={{ position: "absolute", left: "30%", top: 0, bottom: 0, width: 1, background: "#182818" }} />
      {/* dashed route */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 360 720">
        <path d="M 126 202 Q 160 260 173 259" stroke="#E63946" strokeWidth="2.5" fill="none" strokeDasharray="5,4" strokeLinecap="round" opacity="0.5"/>
      </svg>
      {/* user pin */}
      <div style={{ position: "absolute", top: "36%", left: "48%", transform: "translate(-50%,-50%)", width: 12, height: 12, borderRadius: "50%", background: "#E63946", boxShadow: "0 0 0 3px rgba(230,57,70,0.25)" }} />
      {/* mechanic dot (yellow) */}
      <div style={{ position: "absolute", top: "28%", left: "35%", width: 14, height: 14, borderRadius: "50%", background: "#FAC775", boxShadow: "0 0 0 4px rgba(250,199,117,0.2)" }} />
      {/* ETA chip */}
      <div style={{ position: "absolute", top: "22%", left: "28%", background: "rgba(20,20,20,0.88)", border: "0.5px solid #2a2a2a", borderRadius: 8, padding: "5px 10px", fontSize: 11, color: "#FAC775", fontWeight: 600, backdropFilter: "blur(4px)" }}>
        ~8 mins away
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeJob, setActiveJob] = useState(null);
  const [history, setHistory] = useState([]);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Drag state
  const [dragging, setDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(null);
  const [dragStartH, setDragStartH] = useState(null);
  const [liveSheetH, setLiveSheetH] = useState(null);

  const fetchActive = useCallback(async () => {
    try {
      const res = await api.get("/jobs/my/active");
      const jobs = res.data;
      const found = Array.isArray(jobs)
        ? jobs.find((j) => ACTIVE_STATUSES.includes(j.status))
        : ACTIVE_STATUSES.includes(jobs?.status) ? jobs : null;
      setActiveJob(found || null);
    } catch {
      setActiveJob(null);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get("/jobs/my/history");
      setHistory((res.data || []).slice(0, 2));
    } catch {
      setHistory([]);
    }
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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ── Drag handlers ───────────────────────────────────────────────────────────
  // Works for both real touch (phone) and mouse drag (Chrome emulator)
  // During drag: liveSheetH tracks height in real-time (no transition)
  // On release: snaps to COLLAPSED or EXPANDED based on where you let go

  const snapHeight = sheetExpanded ? SHEET_EXPANDED : SHEET_COLLAPSED;

  function startDrag(startY) {
    setDragging(true);
    setDragStartY(startY);
    setDragStartH(snapHeight);
    setLiveSheetH(snapHeight);
  }

  function moveDrag(currentY) {
    if (!dragging || dragStartY === null) return;
    const delta = dragStartY - currentY;          // positive = dragging up
    const newH = Math.min(SHEET_EXPANDED, Math.max(SHEET_COLLAPSED, dragStartH + delta));
    setLiveSheetH(newH);
  }

  function endDrag(currentY) {
    if (!dragging) return;
    const delta = dragStartY - currentY;
    if (delta > 40) setSheetExpanded(true);
    else if (delta < -40) setSheetExpanded(false);
    // else snap back to wherever it was
    setLiveSheetH(null);   // return to snapped value
    setDragging(false);
    setDragStartY(null);
    setDragStartH(null);
  }

  // Touch events (real phone)
  const handleTouchStart = (e) => startDrag(e.touches[0].clientY);
  const handleTouchMove  = (e) => moveDrag(e.touches[0].clientY);
  const handleTouchEnd   = (e) => endDrag(e.changedTouches[0].clientY);

  // Mouse events (Chrome emulator)
  const handleMouseDown  = (e) => startDrag(e.clientY);
  const handleMouseMove  = (e) => moveDrag(e.clientY);
  const handleMouseUp    = (e) => endDrag(e.clientY);

  const firstName = user?.name?.split(" ")[0] || "there";
  const initials = getInitials(user?.name || "");
  const si = activeJob ? statusInfo(activeJob.status) : null;
  const hasActiveJob = !!activeJob;

  // Sheet height: use live drag value during drag, snapped value otherwise
  const idleSheetH = liveSheetH !== null ? liveSheetH : (sheetExpanded ? SHEET_EXPANDED : SHEET_COLLAPSED);
  const activeJobSheetH = hasActiveJob
    ? (activeJob.status === "PENDING" ? 180 : 260)
    : idleSheetH;

  const mapBottomOffset = activeJobSheetH + NAV_H;

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "100dvh",
      overflow: "hidden",
      background: "#141414",
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* ── Map — fills full screen, label adjusts via bottomOffset ── */}
      {hasActiveJob
        ? <ActiveMap bottomOffset={mapBottomOffset} />
        : <IdleMap bottomOffset={mapBottomOffset} />
      }

      {/* ── Topbar — floats over map ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "22px 20px 14px",
        background: "linear-gradient(180deg, rgba(13,26,13,0.92) 0%, rgba(13,26,13,0) 100%)",
        zIndex: 10,
      }}>
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.04em" }}>{getGreeting()}</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "#f0f0f0", marginTop: 2, letterSpacing: "-0.5px" }}>{firstName}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(20,20,20,0.75)",
            border: "0.5px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}>
            <BellIcon />
          </div>
          <div
            onClick={handleLogout}
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "#E63946",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "#fff",
              letterSpacing: "0.04em", cursor: "pointer",
              userSelect: "none",
            }}
          >
            {initials}
          </div>
        </div>
      </div>

      {/* ── Bottom Sheet — sits above nav, snaps between heights ── */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          position: "absolute",
          left: 0, right: 0,
          bottom: NAV_H,
          height: activeJobSheetH,
          background: "#141414",
          borderRadius: "24px 24px 0 0",
          padding: "10px 16px",
          zIndex: 20,
          overflow: "hidden",
          // Only animate when NOT actively dragging (snap on release)
          transition: dragging ? "none" : "height 0.35s cubic-bezier(0.32,0.72,0,1)",
          boxShadow: "0 -1px 0 0 #1e1e1e",
          userSelect: "none",
          cursor: dragging ? "grabbing" : "default",
        }}
      >
        {/* Drag handle — only shown on idle (active job sheet doesn't expand) */}
        {!hasActiveJob && (
          <div
            onClick={() => setSheetExpanded((v) => !v)}
            style={{ display: "flex", justifyContent: "center", paddingBottom: 14, cursor: "pointer" }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2a2a2a" }} />
          </div>
        )}

        {/* ── NO ACTIVE JOB: SOS button ── */}
        {!hasActiveJob && (
          <>
            <button
              onClick={() => navigate("/sos")}
              style={{
                width: "100%",
                background: "#E63946",
                border: "none",
                borderRadius: 16,
                padding: "0 20px",
                height: 68,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
            >
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px" }}>SOS — Need help</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>Tap to request a mechanic</div>
              </div>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(255,255,255,0.13)",
                border: "0.5px solid rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <SosAlertIcon />
              </div>
            </button>

            {/* Recent requests — only when expanded */}
            {sheetExpanded && (
              history.length > 0 ? (
                <>
                  <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: "0.09em", textTransform: "uppercase", fontWeight: 500, margin: "16px 0 8px" }}>
                    Recent requests
                  </div>
                  {history.map((job) => {
                    const badge = historyBadge(job.status);
                    return (
                      <div key={job.id} style={{
                        background: "#1a1a1a",
                        border: "0.5px solid #222",
                        borderRadius: 12,
                        padding: "11px 14px",
                        marginBottom: 8,
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                      }}>
                        <div>
                          <div style={{ fontSize: 13, color: "#d0d0d0", fontWeight: 500 }}>{problemLabel(job.problemType)}</div>
                          <div style={{ fontSize: 11, color: "#484848", marginTop: 3 }}>
                            {vehicleLabel(job.vehicleType)} · {job.vehicleName} · {formatDate(job.createdAt)}
                          </div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 600, background: badge.bg, color: badge.color, borderRadius: 20, padding: "3px 9px", whiteSpace: "nowrap" }}>
                          {badge.label}
                        </span>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div style={{ marginTop: 20, textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "#333" }}>Your first SOS is one tap away</div>
                </div>
              )
            )}
          </>
        )}

        {/* ── ACTIVE JOB: job card ── */}
        {hasActiveJob && (
          <div style={{
            background: "#1a1a1a",
            border: "0.5px solid #252525",
            borderRadius: 16,
            padding: 14,
          }}>
            {/* Eyebrow */}
            <div style={{ fontSize: 10, color: "#484848", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500, marginBottom: 10 }}>
              Active request
            </div>
            {/* Title row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#f0f0f0" }}>{problemLabel(activeJob.problemType)}</div>
                <div style={{ fontSize: 12, color: "#555", marginTop: 3 }}>
                  {vehicleLabel(activeJob.vehicleType)} · {activeJob.vehicleName}
                </div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, background: si.bg, color: si.color, borderRadius: 20, padding: "4px 10px", whiteSpace: "nowrap" }}>
                {si.label}
              </span>
            </div>

            {/* Mechanic row — only when ACCEPTED or IN_PROGRESS */}
            {(activeJob.status === "ACCEPTED" || activeJob.status === "IN_PROGRESS") && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "#111", borderRadius: 12,
                padding: "9px 12px", marginBottom: 10,
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "#252525", border: "0.5px solid #333",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 600, color: "#666", flexShrink: 0,
                }}>M</div>
                <div>
                  <div style={{ fontSize: 13, color: "#d0d0d0", fontWeight: 500 }}>Mechanic assigned</div>
                  <div style={{ fontSize: 11, color: "#484848", marginTop: 2 }}>
                    {activeJob.status === "IN_PROGRESS" ? "Working on your vehicle" : "On the way to you"}
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              {(activeJob.status === "ACCEPTED" || activeJob.status === "IN_PROGRESS") && (
                <button
                  style={{
                    flex: 1, height: 40, borderRadius: 10,
                    background: "rgba(97,205,150,0.1)",
                    border: "0.5px solid rgba(97,205,150,0.2)",
                    color: "#61cd96", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  }}
                  onClick={() => {/* phone number not available yet — Step 14 */}}
                >
                  <PhoneIcon /> Call mechanic
                </button>
              )}
              {(activeJob.status === "PENDING" || activeJob.status === "ACCEPTED") && (
                <button
                  style={{
                    flex: 1, height: 40, borderRadius: 10,
                    background: "transparent",
                    border: "0.5px solid #2a2a2a",
                    color: "#555", fontSize: 12, cursor: "pointer",
                  }}
                  onClick={() => handleCancel(activeJob.id, activeJob.status)}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Nav — fixed to screen, completely independent of sheet ── */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        height: NAV_H,
        display: "flex", justifyContent: "space-around", alignItems: "center",
        background: "#111",
        borderTop: "0.5px solid #1e1e1e",
        zIndex: 30,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}>
        {[
          { label: "Home", icon: <HomeIcon />, path: "/dashboard" },
          { label: "History", icon: <HistoryIcon />, path: "/history" },
          { label: "Profile", icon: <ProfileIcon />, path: "/profile" },
        ].map(({ label, icon, path }) => {
          const active = window.location.pathname === path;
          return (
            <div
              key={label}
              onClick={() => navigate(path)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                color: active ? "#E63946" : "#2e2e2e",
                cursor: "pointer",
                padding: "4px 16px",
              }}
            >
              {icon}
              <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
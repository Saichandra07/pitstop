import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useActiveJob } from "../context/ActiveJobContext";

const PEEK_H    = 72;   // always-visible summary strip
const DETAILS_H = 280;  // expandable details panel (taller to fit confirmation cards)

const VEHICLE_EMOJIS = {
  TWO_WHEELER: "🏍️", THREE_WHEELER: "🛺", FOUR_WHEELER: "🚗", SIX_PLUS_WHEELER: "🚛",
};
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

function fmtProblem(str) {
  if (!str) return "—";
  return str.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

const SNACK_COLOR = {
  warning: "var(--gold)", error: "var(--red)", success: "var(--green)", info: "var(--text-3)",
};

const RING_RANGES = ["within 2 km", "2 – 5 km away", "5 – 10 km away", "10 – 20 km away"];

const PROXIMITY_THRESHOLD_KM = 0.5;

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const PhoneIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.5 2 2 0 0 1 3.6 1.3h3a2 2 0 0 1 2 1.72c.127.96.36 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.07 6.07l.96-.96a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default function ActiveJobFloat() {
  const { user } = useAuth();
  const {
    activeJob,
    rebroadcastBanner,
    handleJobStatus,
    handleConfirmArrival,
    handleRejectArrival,
    handleConfirmComplete,
    handleRejectComplete,
    handleCancel,
    activeJobLoading,
    snackbar,
    jobCompletedSuccessfully,
    setJobCompletedSuccessfully,
  } = useActiveJob();

  const [expanded, setExpanded] = useState(true);
  const [photoLightbox, setPhotoLightbox] = useState(false);
  const [mechDist, setMechDist] = useState(null); // km to user, null = not yet checked
  const [countdown, setCountdown] = useState(3);
  const dragStartY = useRef(null);
  const prevJobIdRef = useRef(null);
  const navigate = useNavigate();

  const isMechanic = user?.role === "MECHANIC";
  const { pathname } = useLocation();
  const isOnDashboard = pathname === "/mechanic/dashboard";

  // Auto-expand whenever a brand-new job appears
  useEffect(() => {
    if (activeJob?.id && activeJob.id !== prevJobIdRef.current) {
      setExpanded(true);
    }
    prevJobIdRef.current = activeJob?.id ?? null;
  }, [activeJob?.id]);

  // Proximity check — only while mechanic is in ACCEPTED state
  useEffect(() => {
    if (!isMechanic || activeJob?.status !== "ACCEPTED" || !activeJob?.latitude) {
      setMechDist(null);
      return;
    }

    const check = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const dist = haversineKm(
            pos.coords.latitude, pos.coords.longitude,
            activeJob.latitude, activeJob.longitude,
          );
          setMechDist(Math.round(dist * 100) / 100);
        },
        () => setMechDist(null),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    };

    check(); // immediate
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, [isMechanic, activeJob?.status, activeJob?.latitude, activeJob?.longitude]);

  // Countdown + auto-redirect for job completion screen
  useEffect(() => {
    if (!jobCompletedSuccessfully || !isMechanic) return;
    setCountdown(3);
    const tick = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(tick);
          setJobCompletedSuccessfully(false);
          navigate("/mechanic/dashboard");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [jobCompletedSuccessfully, isMechanic, navigate, setJobCompletedSuccessfully]);

  // Full-screen job completion overlay — shown to mechanic after user confirms done
  if (jobCompletedSuccessfully && isMechanic) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "var(--bg)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "0 32px", gap: 0,
      }}>
        {/* Subtle green glow background */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(74,222,128,0.07) 0%, transparent 70%)",
        }} />

        {/* Check circle */}
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "rgba(74,222,128,0.12)", border: "1.5px solid rgba(74,222,128,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 24,
          boxShadow: "0 0 32px rgba(74,222,128,0.15)",
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 8, textAlign: "center" }}>
          Job Complete!
        </div>
        <div style={{ fontSize: 14, color: "var(--text-2)", textAlign: "center", lineHeight: 1.6, marginBottom: 36 }}>
          Great work. You're back online and ready for new jobs.
        </div>

        {/* Auto-redirect countdown */}
        <div style={{
          fontSize: 12, color: "var(--text-3)", marginBottom: 20,
        }}>
          Going to dashboard in {countdown}s…
        </div>

        <button
          onClick={() => { setJobCompletedSuccessfully(false); navigate("/mechanic/dashboard"); }}
          className="ps-btn"
          style={{ width: 220 }}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (!activeJob || !user || user.role === "ADMIN") return null;

  const emoji        = VEHICLE_EMOJIS[activeJob.vehicleType] || "🚗";
  const problemStr   = isMechanic
    ? (PROBLEM_LABELS[activeJob.problemType] || activeJob.problemType)
    : fmtProblem(activeJob.problemType);
  const vehicleLabel = VEHICLE_LABELS[activeJob.vehicleType]
    || activeJob.vehicleType?.replace(/_/g, " ");

  const isPending              = activeJob.status === "PENDING";
  const isAccepted             = activeJob.status === "ACCEPTED";
  const isArrivalRequested     = activeJob.status === "ARRIVAL_REQUESTED";
  const isInProgress           = activeJob.status === "IN_PROGRESS";
  const isCompletionRequested  = activeJob.status === "COMPLETION_REQUESTED";
  const ring                   = (activeJob.broadcastRing ?? 1) - 1; // 0-based

  const withinRange = mechDist !== null && mechDist <= PROXIMITY_THRESHOLD_KM;

  const accentBorder = isMechanic ? "rgba(255,183,0,0.3)" : "rgba(230,57,70,0.3)";

  // Derive "Mark Arrived" button label based on proximity
  function arrivedBtnLabel() {
    if (activeJobLoading) return "Marking…";
    if (mechDist === null) return "Getting location…";
    if (withinRange)       return "Mark Arrived ✓";
    return `Mark Arrived (${mechDist.toFixed(1)} km away)`;
  }

  // Badge shown in the always-visible summary strip
  function SummaryBadge() {
    if (isMechanic) {
      if (isAccepted)             return <span className="ps-tag ps-tag-gold">En route</span>;
      if (isArrivalRequested)     return <span className="ps-tag ps-tag-gold">Confirming arrival</span>;
      if (isInProgress)           return <span className="ps-tag ps-tag-green">In progress</span>;
      if (isCompletionRequested)  return <span className="ps-tag ps-tag-gold">Confirming done</span>;
      return null;
    }
    if (isPending)             return <span className="ps-tag ps-tag-gold">Searching</span>;
    if (isAccepted)            return <span className="ps-tag ps-tag-green">En route</span>;
    if (isArrivalRequested)    return <span className="ps-tag ps-tag-gold">Confirming arrival</span>;
    if (isInProgress)          return <span className="ps-tag ps-tag-green">In progress</span>;
    if (isCompletionRequested) return <span className="ps-tag ps-tag-gold">Confirming done</span>;
    return null;
  }

  return (
    <>
    {/* ── Photo lightbox ── */}
    {photoLightbox && activeJob?.photoUrl && (
      <div
        onClick={() => setPhotoLightbox(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.92)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20,
        }}
      >
        <img
          src={activeJob.photoUrl}
          alt="Vehicle photo"
          style={{ maxWidth: "100%", maxHeight: "90dvh", borderRadius: 12, objectFit: "contain" }}
        />
        <button
          onClick={() => setPhotoLightbox(false)}
          style={{
            position: "absolute", top: 16, right: 16,
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
            color: "var(--text)", fontSize: 18, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >×</button>
      </div>
    )}

    <div
      style={{ position: "fixed", bottom: 56, left: 0, right: 0, zIndex: 50 }}
      onTouchStart={e => { dragStartY.current = e.touches[0].clientY; }}
      onTouchEnd={e => {
        if (dragStartY.current === null) return;
        const delta = e.changedTouches[0].clientY - dragStartY.current;
        if (Math.abs(delta) > 24) setExpanded(delta < 0);
        dragStartY.current = null;
      }}
    >
      {/* Google Maps capsule — only on mechanic dashboard, tracks card's top edge */}
      {isMechanic && isOnDashboard && activeJob.latitude && (
        <button
          onClick={() => window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${activeJob.latitude},${activeJob.longitude}&travelmode=driving&dir_action=navigate`,
            "_blank"
          )}
          onTouchStart={e => e.stopPropagation()}
          style={{
            position: "absolute", bottom: "calc(100% + 8px)", right: 16,
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(12,14,22,0.92)", backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,183,0,0.35)", borderRadius: 9999,
            padding: "9px 14px", cursor: "pointer",
            color: "var(--gold)", fontSize: 12, fontWeight: 600,
            boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
            whiteSpace: "nowrap",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#FFB700" strokeWidth="1.5"/>
            <circle cx="12" cy="9" r="2.5" stroke="#FFB700" strokeWidth="1.5"/>
          </svg>
          Open in Google Maps
        </button>
      )}

      {/* Snackbar — floats above the card */}
      {snackbar && (
        <div style={{
          position: "absolute", bottom: "100%", left: 16, right: 16, marginBottom: 8,
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "10px 14px",
          fontSize: 13, fontWeight: 500,
          color: SNACK_COLOR[snackbar.type] || "var(--text-3)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
        }}>
          {snackbar.message}
        </div>
      )}

      {/* Card shell */}
      <div style={{
        background: "var(--surface)",
        borderTop: `2px solid ${accentBorder}`,
        borderRadius: "20px 20px 0 0",
        overflow: "hidden",
        boxShadow: "0 -6px 32px rgba(0,0,0,0.4)",
      }}>

        {/* ══ SUMMARY STRIP ══ */}
        <div
          onClick={() => setExpanded(v => !v)}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "0 16px", height: PEEK_H,
            cursor: "pointer", userSelect: "none", position: "relative",
            borderBottom: expanded ? "1px solid var(--border)" : "none",
          }}
        >
          {/* Drag pill */}
          <div style={{
            position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
            width: 40, height: 4, borderRadius: 2, background: "var(--surface3)",
          }} />

          <span style={{ fontSize: 22, flexShrink: 0 }}>{emoji}</span>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: "var(--text)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              marginBottom: 2,
            }}>
              {problemStr}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {!isMechanic && isPending
                ? `Ring ${ring + 1}/4 · ${vehicleLabel} · ${activeJob.vehicleName}`
                : `${vehicleLabel} · ${activeJob.vehicleName}`}
            </div>
          </div>

          <SummaryBadge />

          {/* Chevron */}
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            style={{
              flexShrink: 0, marginLeft: 2, opacity: 0.5,
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
            }}
          >
            <path d="M6 9l6 6 6-6" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* ══ EXPANDED DETAILS ══ */}
        <div style={{
          maxHeight: expanded ? DETAILS_H : 0,
          overflow: "hidden",
          transition: "max-height 0.38s cubic-bezier(0.25, 0.8, 0.25, 1)",
        }}>
          <div style={{ padding: "12px 16px 16px" }}>

            {/* User: mechanic-abandoned banner */}
            {!isMechanic && rebroadcastBanner && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(230,57,70,0.08)", border: "1px solid rgba(230,57,70,0.2)",
                borderRadius: 10, padding: "9px 12px", marginBottom: 12,
              }}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                <span style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.4 }}>
                  Previous mechanic couldn't continue. Finding a new one…
                </span>
              </div>
            )}

            {/* ── Job photo (both sides) ── */}
            {activeJob.photoUrl && (
              <button
                onClick={e => { e.stopPropagation(); setPhotoLightbox(true); }}
                onTouchStart={e => e.stopPropagation()}
                style={{
                  width: "100%", marginBottom: 12,
                  display: "flex", alignItems: "center", gap: 8,
                  background: "var(--surface2)", border: "1px solid var(--border)",
                  borderRadius: 10, padding: "9px 12px", cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 15 }}>📷</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", flex: 1, textAlign: "left" }}>
                  View photo
                </span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}

            {/* ── User: mechanic trust card (shown once mechanic is assigned) ── */}
            {!isMechanic && !isPending && activeJob.mechanicName && (
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "var(--surface2)", border: "1px solid rgba(255,183,0,0.2)",
                borderRadius: 14, padding: "12px 14px", marginBottom: 12,
              }}>
                {/* Avatar */}
                <div style={{
                  width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(255,183,0,0.12)", border: "1.5px solid rgba(255,183,0,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700, color: "var(--gold)",
                }}>
                  {activeJob.mechanicName.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
                    {activeJob.mechanicName}
                  </div>
                  {activeJob.mechanicRating != null ? (
                    <div style={{ fontSize: 11, color: "var(--gold)" }}>
                      ⭐ {activeJob.mechanicRating.toFixed(1)} &middot; {activeJob.mechanicReviewCount} review{activeJob.mechanicReviewCount !== 1 ? "s" : ""}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>New mechanic</div>
                  )}
                </div>

                {/* Call button */}
              </div>
            )}

            {/* User PENDING: ring progress block */}
            {!isMechanic && isPending && (
              <div style={{
                background: "var(--surface2)", border: "1px solid rgba(255,183,0,0.15)",
                borderRadius: 14, padding: "12px 14px", marginBottom: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: "var(--gold)", flexShrink: 0,
                      boxShadow: "0 0 8px rgba(255,183,0,0.7)",
                      animation: "psGoldPulse 1.4s ease-in-out infinite",
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)" }}>
                      Broadcasting — Ring {ring + 1} of 4
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>{RING_RANGES[ring]}</span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 4, borderRadius: 2,
                      background: i <= ring ? "var(--gold)" : "var(--surface3)",
                      opacity: i === ring ? 1 : i < ring ? 0.5 : 0.25,
                      transition: "background 0.3s",
                    }} />
                  ))}
                </div>
              </div>
            )}

            {/* User ACCEPTED/IN_PROGRESS: mechanic status box */}
            {!isMechanic && (isAccepted || isInProgress) && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.2)",
                borderRadius: 12, padding: "10px 14px", marginBottom: 12,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", background: "var(--green)",
                  flexShrink: 0, boxShadow: "0 0 8px rgba(74,222,128,0.6)",
                }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--green)" }}>
                    {isInProgress ? "Mechanic is working on your vehicle" : "Mechanic is on the way"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                    {isInProgress ? "Repair in progress" : "Live tracking coming soon"}
                  </div>
                </div>
              </div>
            )}

            {/* ── USER: ARRIVAL_REQUESTED confirmation card ── */}
            {!isMechanic && isArrivalRequested && (
              <div style={{
                background: "rgba(255,183,0,0.07)", border: "1px solid rgba(255,183,0,0.25)",
                borderRadius: 12, padding: "12px 14px", marginBottom: 12,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)", marginBottom: 4 }}>
                  ⚡ Mechanic says they've arrived
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12, lineHeight: 1.5 }}>
                  Can you see them? Confirm to start the repair.
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleConfirmArrival(activeJob.id)}
                    disabled={activeJobLoading}
                    className="ps-btn"
                    style={{ flex: 1, height: 40, fontSize: 13, padding: 0, opacity: activeJobLoading ? 0.5 : 1 }}
                  >
                    {activeJobLoading ? "Confirming…" : "✓ Confirm Arrived"}
                  </button>
                  <button
                    onClick={() => handleRejectArrival(activeJob.id)}
                    disabled={activeJobLoading}
                    className="ps-btn-ghost"
                    style={{ flex: 1, height: 40, fontSize: 13, padding: 0, opacity: activeJobLoading ? 0.5 : 1 }}
                  >
                    Not yet
                  </button>
                </div>
              </div>
            )}

            {/* ── USER: COMPLETION_REQUESTED confirmation card ── */}
            {!isMechanic && isCompletionRequested && (
              <div style={{
                background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.2)",
                borderRadius: 12, padding: "12px 14px", marginBottom: 12,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--green)", marginBottom: 4 }}>
                  🔧 Mechanic says the job is done
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12, lineHeight: 1.5 }}>
                  Is your vehicle fixed and ready to go?
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleConfirmComplete(activeJob.id)}
                    disabled={activeJobLoading}
                    className="ps-btn"
                    style={{ flex: 1, height: 40, fontSize: 13, padding: 0, opacity: activeJobLoading ? 0.5 : 1 }}
                  >
                    {activeJobLoading ? "Confirming…" : "✓ Confirm Complete"}
                  </button>
                  <button
                    onClick={() => handleRejectComplete(activeJob.id)}
                    disabled={activeJobLoading}
                    className="ps-btn-ghost"
                    style={{ flex: 1, height: 40, fontSize: 13, padding: 0, opacity: activeJobLoading ? 0.5 : 1 }}
                  >
                    Not done yet
                  </button>
                </div>
              </div>
            )}

            {/* ── Mechanic: user info card ── */}
            {isMechanic && activeJob.userName && (
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "var(--surface2)", border: "1px solid rgba(230,57,70,0.2)",
                borderRadius: 14, padding: "12px 14px", marginBottom: 12,
              }}>
                {/* Avatar */}
                <div style={{
                  width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(230,57,70,0.1)", border: "1.5px solid rgba(230,57,70,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700, color: "var(--red)",
                }}>
                  {activeJob.userName.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
                    {activeJob.userName}
                  </div>
                  {activeJob.address ? (
                    <div style={{ fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      📍 {activeJob.address}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>Location shared</div>
                  )}
                </div>
              </div>
            )}

            {/* ── MECHANIC: contextual hints ── */}
            {isMechanic && (isAccepted || isArrivalRequested || isInProgress || isCompletionRequested) && (
              <div style={{
                fontSize: 12, color: "var(--text-3)", background: "var(--surface2)",
                borderRadius: 10, padding: "8px 12px", marginBottom: 12, lineHeight: 1.5,
              }}>
                {isAccepted && (
                  mechDist === null
                    ? "📍 Getting your location to enable Mark Arrived…"
                    : withinRange
                    ? "📍 You're at the user's location — you can mark arrived"
                    : `📍 ${mechDist.toFixed(1)} km from user — get within 500 m to mark arrived`
                )}
                {isArrivalRequested && "⏳ Waiting for user to confirm your arrival…"}
                {isInProgress && "🔧 Repair in progress — tap Mark Complete when done"}
                {isCompletionRequested && "⏳ Waiting for user to confirm job is done…"}
              </div>
            )}

            {/* ── MECHANIC: waiting pills for _REQUESTED states ── */}
            {isMechanic && (isArrivalRequested || isCompletionRequested) && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(255,183,0,0.08)", border: "1px solid rgba(255,183,0,0.2)",
                borderRadius: 10, padding: "10px 14px", marginBottom: 12,
              }}>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%", background: "var(--gold)",
                  animation: "psGoldPulse 1.4s ease-in-out infinite", flexShrink: 0,
                }} />
                <span style={{ fontSize: 12, color: "var(--gold)", fontWeight: 600 }}>
                  {isArrivalRequested ? "Waiting for user to confirm arrival" : "Waiting for user to confirm job done"}
                </span>
              </div>
            )}

            {/* ── Action buttons row ── */}
            <div style={{ display: "flex", gap: 8 }}>

              {/* MECHANIC: Mark Arrived — gated by proximity */}
              {isMechanic && isAccepted && (
                <button
                  onClick={() => withinRange && handleJobStatus(activeJob.id, "ARRIVAL_REQUESTED")}
                  disabled={activeJobLoading || !withinRange}
                  className="ps-btn-outline"
                  style={{
                    flex: 2, height: 42, fontSize: 13, padding: 0,
                    opacity: (activeJobLoading || !withinRange) ? 0.45 : 1,
                    cursor: withinRange ? "pointer" : "not-allowed",
                  }}
                >
                  {arrivedBtnLabel()}
                </button>
              )}

              {/* MECHANIC: Mark Complete */}
              {isMechanic && isInProgress && (
                <button
                  onClick={() => handleJobStatus(activeJob.id, "COMPLETION_REQUESTED")}
                  disabled={activeJobLoading}
                  className="ps-btn"
                  style={{ flex: 2, height: 42, fontSize: 13, padding: 0, opacity: activeJobLoading ? 0.5 : 1 }}
                >
                  {activeJobLoading ? "Marking…" : "Mark Complete ✓"}
                </button>
              )}

              {/* MECHANIC: Call button (always shown when on job) */}
              {isMechanic && (isAccepted || isInProgress) && (
                <button
                  onClick={() => window.open("tel:", "_self")}
                  className="ps-btn-ghost"
                  style={{ flex: 1, height: 42, fontSize: 12, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                >
                  <PhoneIcon /> Call
                </button>
              )}

              {/* USER: Call mechanic (ACCEPTED / IN_PROGRESS) — phone always present */}
              {!isMechanic && (isAccepted || isInProgress) && (
                <a
                  href={`tel:${activeJob.mechanicPhone || ''}`}
                  onTouchStart={e => e.stopPropagation()}
                  style={{
                    flex: 1, height: 42, borderRadius: 10,
                    background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)",
                    color: "var(--green)", fontSize: 12, fontWeight: 600,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    textDecoration: "none",
                  }}
                >
                  <PhoneIcon /> Call mechanic
                </a>
              )}

              {/* USER: Cancel (PENDING or ACCEPTED only — blocked once IN_PROGRESS or further) */}
              {!isMechanic && (isPending || isAccepted) && (
                <button
                  onClick={() => handleCancel(activeJob.id, activeJob.status)}
                  style={{
                    flex: isPending ? 1 : 0, minWidth: isPending ? undefined : 80,
                    height: 42, borderRadius: 10,
                    background: "transparent", border: "1px solid var(--border)",
                    color: "var(--text-3)", fontSize: 12, cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
    </>
  );
}

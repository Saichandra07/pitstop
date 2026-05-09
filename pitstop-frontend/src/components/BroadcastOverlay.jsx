import { useState, useEffect, useMemo, useRef } from "react";
import { useBroadcast } from "../context/BroadcastContext";
import { useActiveJob } from "../context/ActiveJobContext";

const NAV_H = 56;

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

const VEHICLE_EMOJIS = {
  TWO_WHEELER: "🏍️", THREE_WHEELER: "🛺", FOUR_WHEELER: "🚗", SIX_PLUS_WHEELER: "🚛",
};

function fmtLabel(val) {
  return (val || "—").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Single SOS card (used in expanded list) ──────────────────────────────────
function JobRequestCard({ broadcast, onAccept, onDecline }) {
  const deadline  = useMemo(() => broadcast._receivedAt + 90_000, [broadcast._receivedAt]);
  const [rem, setRem] = useState(() => Math.max(0, Math.floor((deadline - Date.now()) / 1000)));

  useEffect(() => {
    if (rem <= 0) { onDecline(broadcast.jobId, broadcast.broadcastId); return; }
    const id = setInterval(() => {
      const r = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setRem(r);
      if (r === 0) { clearInterval(id); onDecline(broadcast.jobId, broadcast.broadcastId); }
    }, 1000);
    return () => clearInterval(id);
  }, [deadline, broadcast.jobId, broadcast.broadcastId, onDecline, rem]);

  const urgent = rem <= 30;
  const pct    = (rem / 90) * 100;

  return (
    <div style={{ background: "var(--surface)", borderRadius: 16, overflow: "hidden", border: `1px solid ${urgent ? "rgba(230,57,70,0.4)" : "rgba(255,183,0,0.25)"}`, marginBottom: 10 }}>
      <div style={{ height: 3, background: urgent ? "linear-gradient(90deg,var(--red),rgba(230,57,70,0.2))" : "linear-gradient(90deg,var(--gold),rgba(255,183,0,0.2))" }} />
      <div style={{ padding: "14px 14px 16px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span className="ps-tag ps-tag-red" style={{ fontSize: 9, letterSpacing: "1.5px" }}>● NEW SOS</span>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: urgent ? "var(--red)" : "var(--gold)", fontVariantNumeric: "tabular-nums", lineHeight: 1, transition: "color 0.3s" }}>{rem}s</div>
            <div style={{ fontSize: 8, color: "var(--text-3)", letterSpacing: "0.5px" }}>TO RESPOND</div>
          </div>
        </div>

        {/* Timer bar */}
        <div style={{ height: 2, background: "var(--surface3)", borderRadius: 2, marginBottom: 12 }}>
          <div style={{ height: "100%", width: `${pct}%`, borderRadius: 2, background: urgent ? "var(--red)" : "var(--gold)", transition: "width 1s linear, background 0.3s" }} />
        </div>

        {/* Job info */}
        <div style={{ display: "flex", gap: 10, background: "var(--surface2)", borderRadius: 10, padding: "10px", marginBottom: 10, border: "1px solid var(--border)", alignItems: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--surface3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
            {VEHICLE_EMOJIS[broadcast.vehicleType] || "🚗"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{fmtLabel(broadcast.problemType)}</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: broadcast.area ? 3 : 0 }}>{fmtLabel(broadcast.vehicleType)} · {broadcast.vehicleName || "—"}</div>
            {broadcast.area && <div style={{ fontSize: 11, color: "var(--text-2)" }}>📍 {broadcast.area}</div>}
          </div>
        </div>

        {/* Distance + ETA */}
        {broadcast.distanceKm != null && (
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1, background: "var(--surface2)", borderRadius: 8, padding: "8px 10px", border: "1px solid var(--border)", textAlign: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "var(--gold)", lineHeight: 1 }}>{broadcast.distanceKm.toFixed(1)} km</div>
              <div style={{ fontSize: 8, color: "var(--text-3)", marginTop: 3, letterSpacing: "1px", textTransform: "uppercase" }}>Distance</div>
            </div>
            {broadcast.etaMinutes != null && (
              <div style={{ flex: 1, background: "var(--surface2)", borderRadius: 8, padding: "8px 10px", border: "1px solid var(--border)", textAlign: "center" }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: "var(--gold)", lineHeight: 1 }}>~{broadcast.etaMinutes} min</div>
                <div style={{ fontSize: 8, color: "var(--text-3)", marginTop: 3, letterSpacing: "1px", textTransform: "uppercase" }}>Est. ETA</div>
              </div>
            )}
          </div>
        )}

        {/* Ring indicator */}
        <div style={{ fontSize: 10, color: "var(--text-3)", textAlign: "center", marginBottom: 12, letterSpacing: "0.5px", textTransform: "uppercase" }}>
          Ring {broadcast.broadcastRing} of 4
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onDecline(broadcast.jobId, broadcast.broadcastId)} className="ps-btn-ghost" style={{ flex: 1, height: 44, fontSize: 12 }}>Decline</button>
          <button onClick={() => onAccept(broadcast.jobId, broadcast.broadcastId)} className="ps-btn" style={{ flex: 2, height: 44, fontSize: 13, fontWeight: 700 }}>Accept ✓</button>
        </div>
      </div>
    </div>
  );
}

// ─── Minimized strip ──────────────────────────────────────────────────────────
function MinimizedStrip({ broadcasts, onExpand }) {
  const deadline = useMemo(
    () => Math.min(...broadcasts.map(b => b._receivedAt + 90_000)),
    [broadcasts]
  );
  const [rem, setRem] = useState(() => Math.max(0, Math.floor((deadline - Date.now()) / 1000)));

  useEffect(() => {
    const id = setInterval(() => {
      setRem(Math.max(0, Math.floor((deadline - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const closestKm = useMemo(
    () => Math.min(...broadcasts.filter(b => b.distanceKm != null).map(b => b.distanceKm)),
    [broadcasts]
  );
  const urgent = rem <= 30;
  const count  = broadcasts.length;

  return (
    <div
      onClick={onExpand}
      style={{
        position: "fixed", bottom: NAV_H, left: 0, right: 0, zIndex: 40,
        background: urgent ? "rgba(230,57,70,0.95)" : "rgba(18,20,31,0.97)",
        backdropFilter: "blur(8px)",
        borderTop: `1px solid ${urgent ? "rgba(230,57,70,0.6)" : "rgba(255,183,0,0.35)"}`,
        padding: "10px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: urgent ? "white" : "var(--gold)", flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
          {count} SOS {count > 1 ? "Requests" : "Request"}
          {isFinite(closestKm) ? ` · ${closestKm.toFixed(1)} km` : ""}
        </span>
        <span style={{ fontSize: 12, color: urgent ? "rgba(255,255,255,0.8)" : "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
          · {rem}s
        </span>
      </div>
      <span style={{ fontSize: 11, color: urgent ? "rgba(255,255,255,0.7)" : "var(--gold)", fontWeight: 600, letterSpacing: "0.5px" }}>
        TAP TO VIEW ↑
      </span>
    </div>
  );
}

// ─── Expanded list ────────────────────────────────────────────────────────────
function ExpandedList({ broadcasts, onAccept, onDecline, onMinimize }) {
  return (
    <div style={{
      position: "fixed", bottom: NAV_H, left: 0, right: 0, zIndex: 45,
      maxHeight: "80vh", background: "var(--bg)",
      borderRadius: "20px 20px 0 0", borderTop: "1px solid rgba(255,183,0,0.3)",
      boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px 10px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--gold)" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
            {broadcasts.length} SOS {broadcasts.length > 1 ? "Requests" : "Request"}
          </span>
        </div>
        <button onClick={onMinimize} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-3)", fontSize: 12, padding: "4px 10px", cursor: "pointer" }}>
          ↓ Minimize
        </button>
      </div>

      {/* Scrollable cards */}
      <div style={{ overflowY: "auto", padding: "12px 14px 8px", flex: 1 }}>
        {broadcasts.map(b => (
          <JobRequestCard
            key={b.broadcastId}
            broadcast={b}
            onAccept={onAccept}
            onDecline={onDecline}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Abandon offer card ───────────────────────────────────────────────────────
function AbandonOfferCard({ offer, onTakeBack, onMoveOn }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(10,11,18,0.92)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", padding: `0 0 ${NAV_H}px` }}>
      <div style={{ width: "100%", background: "var(--surface)", borderRadius: "22px 22px 0 0", overflow: "hidden", border: "1px solid rgba(255,183,0,0.3)", borderBottom: "none", boxShadow: "0 -8px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg,var(--gold),rgba(255,183,0,0.1))" }} />
        <div style={{ padding: "20px 18px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,183,0,0.1)", border: "1px solid rgba(255,183,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="var(--gold)" strokeWidth="1.5" strokeLinejoin="round"/><path d="M12 9v4M12 16.5v.5" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Job still active</div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>Being broadcast to other mechanics now</div>
            </div>
          </div>

          {/* Job summary */}
          <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>{fmtLabel(offer.problemType)}</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: offer.area ? 3 : 0 }}>{fmtLabel(offer.vehicleType)} · {offer.vehicleName || "—"}</div>
            {offer.area && <div style={{ fontSize: 11, color: "var(--text-2)" }}>📍 {offer.area}</div>}
          </div>

          <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 18, textAlign: "center" }}>
            Want to take it back? If someone else accepts first, you'll be notified.
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onMoveOn} className="ps-btn-ghost" style={{ flex: 1, height: 48, fontSize: 13 }}>Move on</button>
            <button onClick={onTakeBack} className="ps-btn" style={{ flex: 2, height: 48, fontSize: 13, fontWeight: 700 }}>Take it back</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Broadcast cancelled card ─────────────────────────────────────────────────
function BroadcastCancelledCard({ onDismiss }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(10,11,18,0.92)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", padding: `0 0 ${NAV_H}px` }}>
      <div style={{ width: "100%", background: "var(--surface)", borderRadius: "22px 22px 0 0", overflow: "hidden", border: "1px solid rgba(255,183,0,0.25)", borderBottom: "none", boxShadow: "0 -8px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg,var(--gold),rgba(255,183,0,0.1))" }} />
        <div style={{ padding: "28px 20px 32px", textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,183,0,0.1)", border: "1px solid rgba(255,183,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="var(--gold)" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M12 9v4M12 16.5v.5" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Request Withdrawn</div>
          <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 24, maxWidth: 280, margin: "0 auto 24px" }}>
            The user cancelled their SOS before you could respond. You're still online for new requests.
          </div>
          <button onClick={onDismiss} className="ps-btn-ghost" style={{ maxWidth: 200, margin: "0 auto" }}>Got it</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
// onAcceptSuccess: called after accept or take-back succeeds (refresh page state / navigate)
export default function BroadcastOverlay({ onAcceptSuccess }) {
  const {
    broadcasts,
    broadcastCancelledByUser, setBroadcastCancelledByUser,
    abandonedJobOffer,
    handleAccept, handleDecline,
    handleTakeBack, handleMoveOn,
  } = useBroadcast();
  const { activeJob } = useActiveJob();

  const [expanded, setExpanded] = useState(false);

  // Auto-expand only when a *new* broadcast arrives while mounted (0 → N).
  // Skip on initial mount so navigating to a page with an existing broadcast
  // doesn't force-expand the overlay without user interaction.
  const mountedRef   = useRef(false);
  const prevCountRef = useRef(0);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current     = true;
      prevCountRef.current   = broadcasts.length;
      return;
    }
    if (broadcasts.length > 0 && prevCountRef.current === 0) setExpanded(true);
    if (broadcasts.length === 0) setExpanded(false);
    prevCountRef.current = broadcasts.length;
  }, [broadcasts.length]);

  // Abandon offer takes absolute priority
  if (abandonedJobOffer) {
    return (
      <AbandonOfferCard
        offer={abandonedJobOffer}
        onTakeBack={() => handleTakeBack(abandonedJobOffer.jobId, onAcceptSuccess)}
        onMoveOn={() => handleMoveOn(abandonedJobOffer.jobId)}
      />
    );
  }

  // Cancelled card — only when nothing else is showing
  if (broadcastCancelledByUser && broadcasts.length === 0) {
    return <BroadcastCancelledCard onDismiss={() => setBroadcastCancelledByUser(false)} />;
  }

  // Mechanic already on a job — ActiveJobFloat owns this space
  if (activeJob) return null;

  // No broadcasts
  if (broadcasts.length === 0) return null;

  if (expanded) {
    return (
      <ExpandedList
        broadcasts={broadcasts}
        onAccept={(jobId, broadcastId) => handleAccept(jobId, broadcastId, onAcceptSuccess)}
        onDecline={handleDecline}
        onMinimize={() => setExpanded(false)}
      />
    );
  }

  return <MinimizedStrip broadcasts={broadcasts} onExpand={() => setExpanded(true)} />;
}

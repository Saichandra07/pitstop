import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const VEHICLE_META = {
  TWO_WHEELER:      { label: "2-Wheeler",  icon: "🛵" },
  THREE_WHEELER:    { label: "3-Wheeler",  icon: "🛺" },
  FOUR_WHEELER:     { label: "4-Wheeler",  icon: "🚗" },
  SIX_PLUS_WHEELER: { label: "6-Wheeler+", icon: "🚛" },
};

const PROBLEM_LABELS = {
  BATTERY_DEAD:           "Battery dead",
  ENGINE_OVERHEATING:     "Engine overheating",
  ENGINE_WONT_START:      "Won't start",
  ENGINE_NOISE:           "Engine noise",
  OIL_LEAK:               "Oil leak",
  FLAT_TYRE:              "Flat tyre",
  TYRE_BURST:             "Tyre burst",
  CHAIN_SNAPPED:          "Chain snapped",
  BRAKE_FAILURE:          "Brake failure",
  BRAKE_NOISE:            "Brake noise",
  CLUTCH_FAILURE:         "Clutch failure",
  SUSPENSION_DAMAGE:      "Suspension damage",
  HEADLIGHTS_NOT_WORKING: "Headlights out",
  ACCIDENT_DAMAGE:        "Accident damage",
  VEHICLE_STUCK:          "Vehicle stuck",
  STRANGE_NOISE:          "Strange noise",
  DONT_KNOW:              "Not sure — just come",
  GEAR_STUCK:             "Gear stuck",
  STEERING_LOCKED:        "Steering locked",
  WARNING_LIGHT:          "Warning light",
};

const STATUS_CONFIG = {
  PENDING:     { label: "Searching",   color: "#FAC775", dot: "#FAC775" },
  ACCEPTED:    { label: "Accepted",    color: "#6ab0f5", dot: "#6ab0f5" },
  IN_PROGRESS: { label: "In progress", color: "#6ab0f5", dot: "#6ab0f5" },
  COMPLETED:   { label: "Completed",   color: "#61cd96", dot: "#61cd96" },
  CANCELLED:   { label: "Cancelled",   color: "#555",    dot: "#333"    },
};

const ACTIVE_STATUSES = ["PENDING", "ACCEPTED", "IN_PROGRESS"];

function vehicleMeta(type) { return VEHICLE_META[type] || { label: type, icon: "🚘" }; }
function problemLabel(type) { return PROBLEM_LABELS[type] || type; }

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function groupByMonth(jobs) {
  const groups = {};
  jobs.forEach(job => {
    const d = new Date(job.createdAt);
    const key = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(job);
  });
  return groups;
}

/* ─────────────────────────────────────────────
   BOTTOM NAV
───────────────────────────────────────────── */
function BottomNav({ active }) {
  const navigate = useNavigate();
  const items = [
    {
      id: "home", label: "Home", path: "/dashboard",
      icon: (on) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={on ? "#E63946" : "none"}
          stroke={on ? "#E63946" : "#444"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
          <path d="M9 21V12h6v9"/>
        </svg>
      ),
    },
    {
      id: "history", label: "History", path: "/history",
      icon: (on) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={on ? "#E63946" : "#444"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
        </svg>
      ),
    },
    {
      id: "profile", label: "Profile", path: "/profile",
      icon: (on) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={on ? "#E63946" : "#444"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 480,
      background: "#141414", borderTop: "0.5px solid #1e1e1e",
      display: "flex", zIndex: 30,
    }}>
      {items.map(item => {
        const on = active === item.id;
        return (
          <button key={item.id} onClick={() => navigate(item.path)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 4, padding: "10px 0 14px",
            background: "transparent", border: "none", cursor: "pointer",
          }}>
            {item.icon(on)}
            <span style={{ fontSize: 10, color: on ? "#E63946" : "#444", fontWeight: on ? 600 : 400, fontFamily: "'DM Sans', sans-serif" }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ACTIVE JOB CARD
───────────────────────────────────────────── */
function ActiveJobCard({ job }) {
  const v  = vehicleMeta(job.vehicleType);
  const p  = problemLabel(job.problemType);
  const st = STATUS_CONFIG[job.status];

  return (
    <div style={{ padding: "0 16px" }}>
      <div style={{
        background: "#1a1a1a", borderRadius: 18,
        border: "0.5px solid #242424", padding: "16px",
      }}>
        {/* Date + icon */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>
              {new Date(job.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })},{" "}
              {formatTime(job.createdAt)}
            </div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 3 }}>{p}</div>
          </div>
          <div style={{ fontSize: 34, lineHeight: 1 }}>{v.icon}</div>
        </div>

        {/* Origin → status track */}
        <div style={{ position: "relative", paddingLeft: 22 }}>
          {/* Vertical line */}
          <div style={{
            position: "absolute", left: 4, top: 8, bottom: 8, width: 1,
            background: "linear-gradient(to bottom, #333, #2a2a2a)",
          }} />

          {/* Origin row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, position: "relative" }}>
            <div style={{
              position: "absolute", left: -18, width: 9, height: 9, borderRadius: "50%",
              border: "2px solid #333", background: "#141414",
            }} />
            <span style={{ fontSize: 12, color: "#555", flex: 1 }}>{job.vehicleName}</span>
          </div>

          {/* Status row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
            <div style={{
              position: "absolute", left: -18, width: 9, height: 9, borderRadius: "50%",
              background: st.dot, boxShadow: `0 0 8px ${st.dot}99`,
            }} />
            <span style={{ fontSize: 12, color: st.color, fontWeight: 600 }}>{st.label}</span>
            {job.updatedAt && (
              <span style={{ fontSize: 11, color: "#444", fontFamily: "'DM Mono', monospace" }}>
                {formatTime(job.updatedAt)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HISTORY JOB ROW
───────────────────────────────────────────── */
function JobRow({ job, isLast }) {
  const v  = vehicleMeta(job.vehicleType);
  const p  = problemLabel(job.problemType);
  const st = STATUS_CONFIG[job.status] || STATUS_CONFIG.CANCELLED;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 16px",
      borderBottom: isLast ? "none" : "0.5px solid #1c1c1c",
      cursor: "pointer",
    }}>
      {/* Vehicle icon box */}
      <div style={{
        width: 46, height: 46, borderRadius: 13, flexShrink: 0,
        background: "#202020", border: "0.5px solid #2a2a2a",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22,
      }}>{v.icon}</div>

      {/* Problem + time */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: "#fff",
          marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{p}</div>
        <div style={{ fontSize: 11, color: "#444" }}>
          {v.label} · {formatTime(job.createdAt)}
        </div>
      </div>

      {/* Status + chevron */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: st.color }}>{st.label}</div>
          <div style={{
            fontSize: 10, color: "#333", marginTop: 2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 80,
          }}>{job.vehicleName}</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────── */
function EmptyState() {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: "center", padding: "72px 32px" }}>
      <div style={{ fontSize: 52, marginBottom: 16, opacity: 0.1 }}>🔧</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#2e2e2e", marginBottom: 6 }}>No trips yet</div>
      <div style={{ fontSize: 12, color: "#282828", lineHeight: 1.6, marginBottom: 28 }}>
        Your SOS history will show up here
      </div>
      <button onClick={() => navigate("/dashboard")} style={{
        background: "#E63946", border: "none", borderRadius: 12,
        color: "#fff", fontSize: 13, fontWeight: 700,
        padding: "11px 28px", cursor: "pointer",
      }}>Go home</button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function HistoryPage() {
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    api.get("/jobs/my/history")
      .then(r => setJobs(r.data))
      .catch(() => setError("Couldn't load trips"))
      .finally(() => setLoading(false));
  }, []);

  const activeJob    = jobs.find(j => ACTIVE_STATUSES.includes(j.status));
  const pastJobs     = jobs.filter(j => !ACTIVE_STATUSES.includes(j.status));
  const monthGroups  = groupByMonth(pastJobs);

  return (
    <div style={{
      background: "#141414", minHeight: "100vh", maxWidth: 480,
      margin: "0 auto", fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
        @keyframes pulse { 0%,100%{opacity:0.8} 50%{opacity:0.15} }
      `}</style>

      {/* Topbar */}
      <div style={{
        padding: "18px 16px 14px",
        position: "sticky", top: 0, background: "#141414", zIndex: 20,
      }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
          Trips
        </div>
      </div>

      {/* Content */}
      <div style={{ paddingBottom: 88 }}>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "72px 0" }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 7, height: 7, borderRadius: "50%", background: "#E63946",
                animation: "pulse 1.2s infinite", animationDelay: `${i * 0.15}s`,
              }} />
            ))}
          </div>

        ) : error ? (
          <div style={{ textAlign: "center", padding: "56px 0", color: "#E63946", fontSize: 13 }}>{error}</div>

        ) : jobs.length === 0 ? (
          <EmptyState />

        ) : (
          <>
            {/* ── Active job ── */}
            {activeJob && (
              <div style={{ marginBottom: 28, paddingTop: 4 }}>
                <div style={{ padding: "0 16px 10px", fontSize: 11, fontWeight: 700, color: "#444", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  In progress
                </div>
                <ActiveJobCard job={activeJob} />
              </div>
            )}

            {/* ── History ── */}
            {pastJobs.length > 0 && (
              <div style={{ paddingTop: activeJob ? 0 : 8 }}>
                <div style={{ padding: "0 16px 14px", fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
                  History
                </div>

                {Object.entries(monthGroups).map(([month, monthJobs]) => (
                  <div key={month} style={{ marginBottom: 20 }}>
                    {/* Month label */}
                    <div style={{
                      padding: "0 16px 8px",
                      fontSize: 12, fontWeight: 600, color: "#3a3a3a",
                    }}>
                      {month} · {monthJobs.length} trip{monthJobs.length !== 1 ? "s" : ""}
                    </div>

                    {/* Rows grouped in a rounded card */}
                    <div style={{
                      margin: "0 16px",
                      background: "#1a1a1a",
                      borderRadius: 18,
                      border: "0.5px solid #202020",
                      overflow: "hidden",
                    }}>
                      {monthJobs.map((job, i) => (
                        <JobRow key={job.id} job={job} isLast={i === monthJobs.length - 1} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav active="history" />
    </div>
  );
}
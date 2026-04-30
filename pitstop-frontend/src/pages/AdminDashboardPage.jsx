import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

/* ─────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────── */
const C = {
  bg:      "#141414",
  surface: "#1a1a1a",
  raised:  "#1f1f1f",
  border:  "#242424",
  border2: "#2a2a2a",
  red:     "#E63946",
  green:   "#61cd96",
  yellow:  "#FAC775",
  blue:    "#6ab0f5",
  dim:     "#555",
  dimmer:  "#444",
  dimmest: "#333",
  text:    "#fff",
  subtext: "#888",
};

const STATUS = {
  VERIFIED:    { color: C.green,  bg: "#0a1f14", border: "#0d2a1a", label: "Verified",    accent: C.green  },
  PENDING:     { color: C.yellow, bg: "#1e1608", border: "#2a1f0a", label: "Pending",     accent: C.yellow },
  REJECTED:    { color: C.red,    bg: "#1a0808", border: "#2a0a0a", label: "Rejected",    accent: C.red    },
  SUSPENDED:   { color: C.dim,    bg: "#1a1a1a", border: "#2a2a2a", label: "Suspended",   accent: C.dim    },
  IN_PROGRESS: { color: C.blue,   bg: "#080f1a", border: "#0a1530", label: "In Progress", accent: C.blue   },
  ACCEPTED:    { color: C.blue,   bg: "#080f1a", border: "#0a1530", label: "Accepted",    accent: C.blue   },
  COMPLETED:   { color: C.green,  bg: "#0a1f14", border: "#0d2a1a", label: "Completed",   accent: C.green  },
  CANCELLED:   { color: C.red,    bg: "#1a0808", border: "#2a0a0a", label: "Cancelled",   accent: C.red    },
  ACTIVE:      { color: C.green,  bg: "#0a1f14", border: "#0d2a1a", label: "Active",      accent: C.green  },
  BANNED:      { color: C.red,    bg: "#1a0808", border: "#2a0a0a", label: "Banned",      accent: C.red    },
  TIMED_OUT:   { color: C.yellow, bg: "#1e1608", border: "#2a1f0a", label: "Timed out",   accent: C.yellow },
};

/* ─────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  .adm-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .adm-root { font-family: 'DM Sans', sans-serif; background: #141414; color: #fff; min-height: 100vh; }
  .adm-tab-item { transition: color 0.15s; }
  .adm-filter-pill { transition: all 0.15s; }
  .adm-filter-pill:hover { border-color: #444 !important; color: #aaa !important; }
  .adm-card { transition: border-color 0.15s, box-shadow 0.15s; }
  .adm-card:hover { border-color: #333 !important; box-shadow: 0 4px 24px rgba(0,0,0,0.3); }
  .adm-btn { transition: opacity 0.12s, transform 0.1s; cursor: pointer; }
  .adm-btn:hover { opacity: 0.82; }
  .adm-btn:active { transform: scale(0.96); }
  .adm-search { transition: border-color 0.15s; }
  .adm-search:focus { border-color: #444 !important; outline: none; }
  .adm-search::placeholder { color: #3a3a3a; }
  .adm-inline-form { overflow: hidden; transition: max-height 0.22s cubic-bezier(0.4,0,0.2,1), padding 0.22s ease; }
  .adm-mono { font-family: 'DM Mono', monospace; }
  .adm-pulse { animation: admPulse 2s infinite; }
  @keyframes admPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .adm-dot-anim { animation: admDot 1.2s infinite; }
  ::-webkit-scrollbar { display: none; }
`;

function injectStyles() {
  if (document.getElementById("adm-styles")) return;
  const el = document.createElement("style");
  el.id = "adm-styles";
  el.textContent = STYLES;
  document.head.appendChild(el);
}

/* ─────────────────────────────────────────────
   PRIMITIVE COMPONENTS
───────────────────────────────────────────── */
function Badge({ status }) {
  const s = STATUS[status] || STATUS.PENDING;
  return (
    <span style={{
      background: s.bg, color: s.color, border: `0.5px solid ${s.border}`,
      borderRadius: 20, padding: "3px 9px", fontSize: 10, fontWeight: 600,
      letterSpacing: "0.02em", whiteSpace: "nowrap", flexShrink: 0,
    }}>{s.label}</span>
  );
}

const AVATAR_PALETTE = [C.red, C.yellow, C.green, C.blue, "#a78bfa", "#f472b6", "#fb923c"];
function avatarColor(name) {
  if (!name) return C.dim;
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
}

function Avatar({ name, size = 36 }) {
  const bg = avatarColor(name);
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const light = [C.yellow, C.green].includes(bg);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.3, fontWeight: 700, color: light ? "#141414" : "#fff",
      boxShadow: `0 0 0 2px #141414, 0 0 0 3.5px ${bg}44`,
    }}>{initials}</div>
  );
}

function Stars({ rating }) {
  if (!rating) return null;
  const full = Math.floor(rating);
  return (
    <span style={{ fontSize: 10, letterSpacing: 1 }}>
      {"★".repeat(full)}<span style={{ color: C.dimmer }}>{"★".repeat(5 - full)}</span>
      <span className="adm-mono" style={{ color: C.yellow, marginLeft: 5, fontSize: 10 }}>{Number(rating).toFixed(1)}</span>
    </span>
  );
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", marginBottom: 10 }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2.5"
        style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input className="adm-search" placeholder={placeholder} value={value} onChange={onChange}
        style={{
          width: "100%", height: 38, background: C.surface,
          border: `0.5px solid ${C.border2}`, borderRadius: 10,
          color: C.text, fontSize: 12, paddingLeft: 32, paddingRight: 12,
        }}
      />
    </div>
  );
}

function FilterPills({ filters, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
      {filters.map(f => (
        <span key={f.value} className="adm-filter-pill" onClick={() => onChange(f.value)} style={{
          padding: "5px 13px", borderRadius: 20, fontSize: 11, cursor: "pointer",
          whiteSpace: "nowrap", flexShrink: 0, fontWeight: active === f.value ? 600 : 400,
          background: active === f.value ? C.red : C.surface,
          border: `0.5px solid ${active === f.value ? C.red : C.border2}`,
          color: active === f.value ? "#fff" : C.dim,
        }}>{f.label}</span>
      ))}
    </div>
  );
}

function Card({ children, status, style }) {
  const accent = status ? (STATUS[status]?.accent || C.border) : C.border;
  return (
    <div className="adm-card" style={{
      background: C.surface, borderRadius: 12, marginBottom: 10, overflow: "hidden",
      border: `0.5px solid ${C.border}`, borderLeft: `2.5px solid ${accent}`,
      ...style,
    }}>{children}</div>
  );
}

function CardBody({ children }) {
  return <div style={{ padding: "13px 14px" }}>{children}</div>;
}

function InlineForm({ open, children }) {
  return (
    <div className="adm-inline-form" style={{
      maxHeight: open ? 200 : 0,
      padding: open ? "12px 14px" : "0 14px",
      borderTop: open ? `0.5px solid #1e1e1e` : "none",
      background: "#111",
    }}>
      {open && children}
    </div>
  );
}

function TinyInput({ placeholder, type = "text", value, onChange }) {
  return (
    <input type={type} placeholder={placeholder} value={value} onChange={onChange}
      style={{
        width: "100%", height: 34, background: C.raised, border: `0.5px solid ${C.border2}`,
        borderRadius: 8, color: C.text, fontSize: 12, padding: "0 10px",
        outline: "none", marginBottom: 8,
      }}
    />
  );
}

function TinySelect({ value, onChange, options }) {
  return (
    <select value={value} onChange={onChange} style={{
      width: "100%", height: 34, background: C.raised, border: `0.5px solid ${C.border2}`,
      borderRadius: 8, color: value ? C.text : C.dim, fontSize: 12, padding: "0 10px",
      outline: "none", marginBottom: 8, appearance: "none",
    }}>
      <option value="">Select reason...</option>
      {options.map(o => <option key={o.id} value={o.reason}>{o.reason}</option>)}
    </select>
  );
}

function BtnRow({ children, style }) {
  return <div style={{ display: "flex", gap: 7, ...style }}>{children}</div>;
}

const BTN_VARIANTS = {
  green:  { bg: "#0a1f14", border: "#0d2a1a", color: C.green  },
  red:    { bg: "#1a0808", border: "#2a0a0a", color: C.red    },
  yellow: { bg: "#1e1608", border: "#2a1f0a", color: C.yellow },
  ghost:  { bg: C.raised,  border: C.border2, color: C.dim    },
};

function Btn({ label, variant = "ghost", onClick, small, style }) {
  const v = BTN_VARIANTS[variant];
  return (
    <button className="adm-btn" onClick={onClick} style={{
      flex: 1, height: small ? 30 : 34, borderRadius: 9,
      background: v.bg, border: `0.5px solid ${v.border}`,
      color: v.color, fontSize: small ? 11 : 12, fontWeight: 600,
      ...style,
    }}>{label}</button>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      fontSize: 10, color: C.dim, letterSpacing: "0.09em",
      textTransform: "uppercase", fontWeight: 600, marginBottom: 12,
    }}>
      <div style={{ flex: 1, height: "0.5px", background: C.border }} />
      {children}
      <div style={{ flex: 1, height: "0.5px", background: C.border }} />
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ textAlign: "center", padding: "36px 0", color: C.dim, fontSize: 12 }}>
      <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.3 }}>○</div>
      {text}
    </div>
  );
}

function Loading() {
  return (
    <div style={{ textAlign: "center", padding: "36px 0", display: "flex", justifyContent: "center", gap: 6 }}>
      {[0, 1, 2].map(i => (
        <div key={i} className="adm-pulse" style={{
          width: 6, height: 6, borderRadius: "50%", background: C.red,
          animationDelay: `${i * 0.15}s`,
        }} />
      ))}
    </div>
  );
}

function ExpertiseChips({ list }) {
  if (!list?.length) return null;
  const show = list.slice(0, 4);
  const extra = list.length - 4;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, margin: "8px 0" }}>
      {show.map((tag, i) => (
        <span key={i} style={{
          background: "#1e1e1e", border: `0.5px solid ${C.border2}`,
          borderRadius: 20, padding: "2px 9px", fontSize: 10, color: C.subtext,
        }}>{tag}</span>
      ))}
      {extra > 0 && (
        <span style={{
          background: "#1e1e1e", border: `0.5px solid ${C.border2}`,
          borderRadius: 20, padding: "2px 9px", fontSize: 10, color: C.dim,
        }}>+{extra} more</span>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   OVERVIEW TAB
───────────────────────────────────────────── */
const STAT_META = {
  "Active jobs":           { icon: "⚡", color: C.green  },
  "Online mechanics":      { icon: "🔧", color: C.green  },
  "Pending verifications": { icon: "⏳", color: C.red    },
  "Pending reports":       { icon: "⚠",  color: C.yellow },
};

function OverviewTab({ stats }) {
  const cards = [
    { label: "Active jobs",           value: stats.activeJobs,      color: C.green  },
    { label: "Online mechanics",      value: stats.onlineMechanics, color: C.green  },
    { label: "Pending verifications", value: stats.pendingVerify,   color: C.red    },
    { label: "Pending reports",       value: stats.pendingReports,  color: C.yellow },
  ];

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {cards.map(c => {
          const meta = STAT_META[c.label];
          const hasValue = (c.value ?? 0) > 0;
          return (
            <div key={c.label} style={{
              background: C.surface, borderRadius: 14, padding: "14px 14px 12px",
              border: `0.5px solid ${C.border}`,
              borderBottom: `2px solid ${c.color}${hasValue ? "55" : "18"}`,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: -20, right: -20,
                width: 70, height: 70, borderRadius: "50%",
                background: c.color, opacity: hasValue ? 0.05 : 0.02,
                pointerEvents: "none",
              }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 16 }}>{meta.icon}</span>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: c.color, opacity: hasValue ? 1 : 0.2,
                  boxShadow: hasValue ? `0 0 8px ${c.color}` : "none",
                }} />
              </div>
              <div className="adm-mono" style={{
                fontSize: 30, fontWeight: 500, color: c.color, lineHeight: 1,
                textShadow: hasValue ? `0 0 30px ${c.color}50` : "none",
              }}>{c.value ?? "—"}</div>
              <div style={{ fontSize: 10, color: C.dim, marginTop: 6, letterSpacing: "0.03em", lineHeight: 1.3 }}>{c.label}</div>
            </div>
          );
        })}
      </div>

      <SectionLabel>Recent Activity</SectionLabel>

      <div style={{ background: C.surface, borderRadius: 12, border: `0.5px solid ${C.border}`, overflow: "hidden" }}>
        {!(stats.recentActivity?.length) ? (
          <EmptyState text="No recent activity" />
        ) : stats.recentActivity.map((item, i, arr) => (
          <div key={i} style={{
            padding: "11px 14px",
            borderBottom: i < arr.length - 1 ? `0.5px solid #1c1c1c` : "none",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div className="adm-pulse" style={{
              width: 7, height: 7, borderRadius: "50%",
              background: item.color, boxShadow: `0 0 6px ${item.color}`,
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 12, color: "#ccc", fontWeight: 500 }}>{item.name}</span>
            <span style={{ fontSize: 11, color: C.dim }}>{item.action}</span>
            <span className="adm-mono" style={{ marginLeft: "auto", fontSize: 10, color: C.dimmer }}>{item.time}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   VERIFY TAB
───────────────────────────────────────────── */
function VerifyTab({ rejectionReasons, onAction }) {
  const [pending, setPending]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [openReject, setOpenReject]   = useState(null);
  const [selectedReason, setSelected] = useState({});

  useEffect(() => {
    api.get("/admin/mechanics/pending")
      .then(r => setPending(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id) => {
    await api.patch(`/admin/mechanics/${id}/verify`, { action: "APPROVE" });
    setPending(p => p.filter(m => m.id !== id));
    onAction();
  };

  const handleReject = async (id) => {
    const reason = selectedReason[id];
    if (!reason) return;
    await api.patch(`/admin/mechanics/${id}/verify`, { action: "REJECT", rejectionReason: reason });
    setPending(p => p.filter(m => m.id !== id));
    setOpenReject(null);
    onAction();
  };

  if (loading) return <Loading />;
  if (!pending.length) return <EmptyState text="No pending applications" />;

  return pending.map(m => (
    <Card key={m.id} status="PENDING">
      <CardBody>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar name={m.name} size={38} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{m.name}</div>
              <div style={{ fontSize: 11, color: C.dim }}>{m.phone} · {m.serviceRadiusKm}km</div>
              {m.area && <div style={{ fontSize: 10, color: C.dimmer, marginTop: 2 }}>📍 {m.area}</div>}
            </div>
          </div>
          <Badge status="PENDING" />
        </div>

        <ExpertiseChips list={m.expertiseSummary} />

        <div className="adm-mono" style={{ fontSize: 10, color: C.dimmer, marginBottom: 10 }}>
          Applied {m.createdAt ? new Date(m.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
        </div>

        <BtnRow>
          <Btn label="✓ Approve" variant="green" onClick={() => handleApprove(m.id)} />
          <Btn label="✕ Reject"  variant="red"   onClick={() => setOpenReject(openReject === m.id ? null : m.id)} />
        </BtnRow>
      </CardBody>

      <InlineForm open={openReject === m.id}>
        <div style={{ fontSize: 11, color: C.dim, marginBottom: 7 }}>Select rejection reason</div>
        <TinySelect
          value={selectedReason[m.id] || ""}
          onChange={e => setSelected(p => ({ ...p, [m.id]: e.target.value }))}
          options={rejectionReasons}
        />
        <BtnRow>
          <Btn label="Confirm reject" variant="red"   small onClick={() => handleReject(m.id)} />
          <Btn label="Cancel"         variant="ghost" small onClick={() => setOpenReject(null)} />
        </BtnRow>
      </InlineForm>
    </Card>
  ));
}

/* ─────────────────────────────────────────────
   MECHANICS TAB
───────────────────────────────────────────── */
function MechanicsTab() {
  const [mechanics, setMechanics]     = useState([]);
  const [search, setSearch]           = useState("");
  const [filter, setFilter]           = useState("");
  const [loading, setLoading]         = useState(true);
  const [openSuspend, setOpen]        = useState(null);
  const [suspendForm, setSuspendForm] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (filter) p.set("status", filter);
    api.get(`/admin/mechanics?${p}`).then(r => setMechanics(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [search, filter]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const handleSuspend = async (id) => {
    const f = suspendForm[id] || {};
    if (!f.reason || !f.days) return;
    await api.post(`/admin/mechanics/${id}/suspend`, { reason: f.reason, suspensionDays: parseInt(f.days) });
    setOpen(null); load();
  };
  const handleUnsuspend = async (id) => { await api.post(`/admin/mechanics/${id}/unsuspend`); load(); };
  const handleDelete    = async (id) => { if (!window.confirm("Permanently delete mechanic?")) return; await api.delete(`/admin/mechanics/${id}`); load(); };

  return (
    <>
      <SearchBar value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or area..." />
      <FilterPills
        filters={[
          { value: "",          label: "All"       },
          { value: "VERIFIED",  label: "Verified"  },
          { value: "SUSPENDED", label: "Suspended" },
          { value: "REJECTED",  label: "Rejected"  },
        ]}
        active={filter} onChange={setFilter}
      />

      {loading ? <Loading /> : !mechanics.length ? <EmptyState text="No mechanics found" /> :
        mechanics.map(m => {
          const st = m.verificationStatus;
          const accent = STATUS[st]?.accent || C.border;
          const isSuspended = st === "SUSPENDED";
          const initials = (m.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
          const light = [C.yellow, C.green].includes(accent);
          return (
            <div key={m.id} style={{
              background: C.surface, borderRadius: 16, marginBottom: 12,
              border: `0.5px solid ${C.border}`, overflow: "hidden",
            }}>
              <div style={{ padding: "16px 16px 14px" }}>

                {/* Top row — square avatar + name block + badge */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 54, height: 54, borderRadius: 14, background: accent,
                    flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, fontWeight: 800, color: light ? "#141414" : "#fff",
                    boxShadow: `0 4px 16px ${accent}44`,
                  }}>{initials}</div>

                  <div style={{ flex: 1, minWidth: 0, paddingTop: 2, textAlign: "left" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: isSuspended ? C.dim : C.text, marginBottom: 3, letterSpacing: "-0.2px" }}>
                      {m.name}
                    </div>
                    <Stars rating={m.rating} />
                    {m.area && (
                      <div className="adm-mono" style={{ fontSize: 10, color: C.dimmer, marginTop: 3 }}>📍 {m.area}</div>
                    )}
                  </div>

                  <Badge status={st} />
                </div>

                {/* Stats row */}
                <div style={{
                  display: "flex",
                  background: C.raised, borderRadius: 12,
                  border: `0.5px solid ${C.border2}`, marginBottom: 14,
                  overflow: "hidden",
                }}>
                  {[
                    { label: "Jobs done", value: m.totalJobsCompleted ?? 0       },
                    { label: "Cancels",   value: m.midJobCancels ?? 0            },
                    { label: "Radius",    value: `${m.serviceRadiusKm ?? 0}km`   },
                  ].map((s, i, arr) => (
                    <div key={s.label} style={{
                      flex: 1, padding: "10px 0", textAlign: "center",
                      borderRight: i < arr.length - 1 ? `0.5px solid ${C.border2}` : "none",
                    }}>
                      <div className="adm-mono" style={{ fontSize: 16, fontWeight: 600, color: C.text, lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: C.dim, marginTop: 4, letterSpacing: "0.02em" }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Suspension banner */}
                {isSuspended && m.suspensionReason && (
                  <div style={{
                    background: "#180808", border: `0.5px solid #2a1010`, borderRadius: 10,
                    padding: "8px 12px", marginBottom: 14, fontSize: 11, color: "#b05050",
                  }}>
                    ⚠ {m.suspensionReason}
                    {m.suspensionEndsAt && (
                      <span style={{ color: C.dim }}> · ends {new Date(m.suspensionEndsAt).toLocaleDateString("en-IN")}</span>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                {isSuspended ? (
                  <BtnRow>
                    <button className="adm-btn" onClick={() => handleUnsuspend(m.id)} style={{
                      flex: 1, height: 38, borderRadius: 10, border: "none",
                      background: C.green, color: "#141414", fontSize: 12, fontWeight: 700,
                    }}>Unsuspend</button>
                    <button className="adm-btn" onClick={() => handleDelete(m.id)} style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: "#1a0808", border: `0.5px solid #2a0a0a`,
                      color: C.red, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>×</button>
                  </BtnRow>
                ) : (
                  <BtnRow>
                    <button className="adm-btn" onClick={() => setOpen(openSuspend === m.id ? null : m.id)} style={{
                      flex: 1, height: 38, borderRadius: 10,
                      background: "#1e1608", border: `0.5px solid #2a1f0a`,
                      color: C.yellow, fontSize: 12, fontWeight: 600,
                    }}>Suspend</button>
                    <button className="adm-btn" onClick={() => handleDelete(m.id)} style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: C.raised, border: `0.5px solid ${C.border2}`,
                      color: C.dim, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>×</button>
                  </BtnRow>
                )}
              </div>

              <InlineForm open={openSuspend === m.id}>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 7 }}>Suspension details</div>
                <TinyInput
                  placeholder="Reason for suspension..."
                  value={suspendForm[m.id]?.reason || ""}
                  onChange={e => setSuspendForm(p => ({ ...p, [m.id]: { ...p[m.id], reason: e.target.value } }))}
                />
                <TinyInput
                  placeholder="Duration in days (e.g. 3)"
                  type="number"
                  value={suspendForm[m.id]?.days || ""}
                  onChange={e => setSuspendForm(p => ({ ...p, [m.id]: { ...p[m.id], days: e.target.value } }))}
                />
                <BtnRow>
                  <Btn label="Confirm suspend" variant="yellow" small onClick={() => handleSuspend(m.id)} />
                  <Btn label="Cancel"          variant="ghost"  small onClick={() => setOpen(null)} />
                </BtnRow>
              </InlineForm>
            </div>
          );
        })
      }
    </>
  );
}

/* ─────────────────────────────────────────────
   JOBS TAB
───────────────────────────────────────────── */
function JobsTab() {
  const [jobs, setJobs]       = useState([]);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (filter) p.set("status", filter);
    api.get(`/admin/jobs?${p}`).then(r => setJobs(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [search, filter]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const handleForceComplete = async (id) => { await api.post(`/admin/jobs/${id}/force-complete`); load(); };

  const vLabel = v => ({ TWO_WHEELER: "2-Wheeler", THREE_WHEELER: "3-Wheeler", FOUR_WHEELER: "4-Wheeler", SIX_PLUS_WHEELER: "6W+" }[v] || v);
  const pLabel = p => p?.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) || "—";

  return (
    <>
      <SearchBar value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by user, mechanic or area..." />
      <FilterPills
        filters={[
          { value: "",            label: "All"         },
          { value: "PENDING",     label: "Pending"     },
          { value: "IN_PROGRESS", label: "In Progress" },
          { value: "COMPLETED",   label: "Completed"   },
          { value: "CANCELLED",   label: "Cancelled"   },
        ]}
        active={filter} onChange={setFilter}
      />

      {loading ? <Loading /> : !jobs.length ? <EmptyState text="No jobs found" /> :
        jobs.map(j => {
          const st = j.status;
          const isActive = ["PENDING", "ACCEPTED", "IN_PROGRESS"].includes(st);
          return (
            <Card key={j.id} status={st}>
              <CardBody>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <span className="adm-mono" style={{ fontSize: 11, fontWeight: 500, color: C.dim, letterSpacing: "0.05em" }}>
                    JOB #{j.id}
                  </span>
                  <Badge status={st} />
                </div>

                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>
                  {vLabel(j.vehicleType)} · {pLabel(j.problemType)}
                </div>

                <div style={{ fontSize: 11, color: C.dim, marginBottom: 2 }}>
                  {j.userName || "Unknown"}
                  {j.mechanicName && <> <span style={{ color: C.dimmer }}>→</span> {j.mechanicName}</>}
                  {j.broadcastRing && <span style={{ color: C.dimmer }}> · Ring {j.broadcastRing}</span>}
                </div>

                {j.area && <div style={{ fontSize: 10, color: C.dimmer, marginBottom: isActive ? 10 : 0 }}>📍 {j.area}</div>}

                {isActive && (
                  <BtnRow style={{ marginTop: 10 }}>
                    {st === "IN_PROGRESS" && (
                      <Btn label="Force complete" variant="green" small onClick={() => handleForceComplete(j.id)} />
                    )}
                    <Btn label="Force cancel" variant="red" small onClick={() => {}} />
                  </BtnRow>
                )}
              </CardBody>
            </Card>
          );
        })
      }
    </>
  );
}

/* ─────────────────────────────────────────────
   USERS TAB
───────────────────────────────────────────── */
function UsersTab() {
  const [users, setUsers]     = useState([]);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);
  const [openTO, setOpenTO]   = useState(null);
  const [toHours, setToHours] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    api.get(`/admin/users?${p}`).then(r => setUsers(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const handleBan     = async (id) => { await api.post(`/admin/users/${id}/ban`);   load(); };
  const handleUnban   = async (id) => { await api.post(`/admin/users/${id}/unban`); load(); };
  const handleDelete  = async (id) => { if (!window.confirm("Delete this user?")) return; await api.delete(`/admin/users/${id}`); load(); };
  const handleTimeout = async (id) => {
    await api.post(`/admin/users/${id}/timeout`, { hours: parseInt(toHours[id] || "0") });
    setOpenTO(null); load();
  };

  const isTimedOut = u => u.sosTimeoutUntil && new Date(u.sosTimeoutUntil) > new Date();
  const userStatus = u => u.isBanned ? "BANNED" : isTimedOut(u) ? "TIMED_OUT" : "ACTIVE";

  return (
    <>
      <SearchBar value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users by name..." />

      {loading ? <Loading /> : !users.length ? <EmptyState text="No users found" /> :
        users.map(u => {
          const st      = userStatus(u);
          const accent  = u.isBanned ? C.red : isTimedOut(u) ? C.yellow : C.green;
          const initials = (u.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
          const light    = [C.yellow, C.green].includes(accent);
          return (
            <div key={u.id} style={{
              background: C.surface, borderRadius: 16, marginBottom: 12,
              border: `0.5px solid ${C.border}`, overflow: "hidden",
            }}>
              <div style={{ padding: "16px 16px 14px" }}>

                {/* Top row — square avatar + name block + badge */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 54, height: 54, borderRadius: 14, background: accent,
                    flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, fontWeight: 800, color: light ? "#141414" : "#fff",
                    boxShadow: `0 4px 16px ${accent}44`,
                  }}>{initials}</div>

                  <div style={{ flex: 1, minWidth: 0, paddingTop: 2, textAlign: "left" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: u.isBanned ? C.dim : C.text, marginBottom: 3, letterSpacing: "-0.2px" }}>
                      {u.name}
                    </div>
                    <div className="adm-mono" style={{ fontSize: 10, color: C.dimmer, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {u.email}
                    </div>
                    {isTimedOut(u) && (
                      <div style={{ fontSize: 10, color: C.yellow, marginTop: 4 }}>
                        ⏱ timeout until {new Date(u.sosTimeoutUntil).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                      </div>
                    )}
                  </div>

                  <Badge status={st} />
                </div>

                {/* Stats row */}
                <div style={{
                  display: "flex", gap: 0,
                  background: C.raised, borderRadius: 12,
                  border: `0.5px solid ${C.border2}`, marginBottom: 14,
                  overflow: "hidden",
                }}>
                  {[
                    { label: "SOS sent",   value: u.totalSos ?? 0       },
                    { label: "Cancels",    value: u.sosCancelCount ?? 0  },
                  ].map((s, i, arr) => (
                    <div key={s.label} style={{
                      flex: 1, padding: "10px 0", textAlign: "center",
                      borderRight: i < arr.length - 1 ? `0.5px solid ${C.border2}` : "none",
                    }}>
                      <div className="adm-mono" style={{ fontSize: 18, fontWeight: 600, color: C.text, lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: C.dim, marginTop: 4, letterSpacing: "0.02em" }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                {u.isBanned ? (
                  <BtnRow>
                    <button className="adm-btn" onClick={() => handleUnban(u.id)} style={{
                      flex: 1, height: 38, borderRadius: 10, border: "none",
                      background: C.green, color: "#141414",
                      fontSize: 12, fontWeight: 700,
                    }}>Unban</button>
                    <button className="adm-btn" onClick={() => handleDelete(u.id)} style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: "#1a0808", border: `0.5px solid #2a0a0a`,
                      color: C.red, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>×</button>
                  </BtnRow>
                ) : (
                  <BtnRow>
                    <button className="adm-btn" onClick={() => handleBan(u.id)} style={{
                      flex: 1, height: 38, borderRadius: 10, border: "none",
                      background: C.red, color: "#fff",
                      fontSize: 12, fontWeight: 700,
                    }}>Ban</button>
                    <button className="adm-btn" onClick={() => setOpenTO(openTO === u.id ? null : u.id)} style={{
                      flex: 1, height: 38, borderRadius: 10,
                      background: "#1e1608", border: `0.5px solid #2a1f0a`,
                      color: C.yellow, fontSize: 12, fontWeight: 600,
                    }}>Set timeout</button>
                    <button className="adm-btn" onClick={() => handleDelete(u.id)} style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: C.raised, border: `0.5px solid ${C.border2}`,
                      color: C.dim, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>×</button>
                  </BtnRow>
                )}
              </div>

              {/* Timeout inline form */}
              <InlineForm open={openTO === u.id}>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 7 }}>SOS timeout duration</div>
                <TinyInput
                  placeholder="Hours (0 = clear existing timeout)"
                  type="number"
                  value={toHours[u.id] || ""}
                  onChange={e => setToHours(p => ({ ...p, [u.id]: e.target.value }))}
                />
                <BtnRow>
                  <Btn label="Apply timeout" variant="yellow" small onClick={() => handleTimeout(u.id)} />
                  <Btn label="Cancel"        variant="ghost"  small onClick={() => setOpenTO(null)} />
                </BtnRow>
              </InlineForm>
            </div>
          );
        })
      }
    </>
  );
}

/* ─────────────────────────────────────────────
   REASONS TAB
───────────────────────────────────────────── */
function ReasonsTab({ reasons, onAdd, onDelete }) {
  const [newReason, setNewReason] = useState("");

  const handleAdd = async () => {
    const trimmed = newReason.trim();
    if (!trimmed) return;
    await onAdd(trimmed);
    setNewReason("");
  };

  return (
    <>
      <SectionLabel>Rejection Reasons</SectionLabel>

      <div style={{ background: C.surface, borderRadius: 12, border: `0.5px solid ${C.border}`, marginBottom: 14, overflow: "hidden" }}>
        {!reasons.length ? (
          <EmptyState text="No reasons configured yet" />
        ) : reasons.map((r, i) => (
          <div key={r.id} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 14px",
            borderBottom: i < reasons.length - 1 ? `0.5px solid #1c1c1c` : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.red, opacity: 0.6, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#bbb" }}>{r.reason}</span>
            </div>
            <button className="adm-btn" onClick={() => onDelete(r.id)} style={{
              width: 28, height: 28, borderRadius: 8, background: "#1a0808",
              border: `0.5px solid #2a0a0a`, color: C.red, fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>×</button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="Add new rejection reason..."
          value={newReason}
          onChange={e => setNewReason(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          style={{
            flex: 1, height: 40, borderRadius: 10, background: C.surface,
            border: `0.5px solid ${C.border2}`, color: C.text,
            fontSize: 12, padding: "0 12px", outline: "none",
          }}
        />
        <button className="adm-btn" onClick={handleAdd} style={{
          height: 40, padding: "0 16px", borderRadius: 10,
          background: C.red, border: "none", color: "#fff",
          fontSize: 12, fontWeight: 600,
        }}>Add</button>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function AdminDashboardPage() {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  const [activeTab, setActiveTab]       = useState("overview");
  const [rejectionReasons, setReasons]  = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [stats, setStats]               = useState({
    activeJobs: null, onlineMechanics: null, pendingVerify: null, pendingReports: 0, recentActivity: []
  });

  useEffect(() => { injectStyles(); }, []);

  const loadReasons = useCallback(() => {
    api.get("/admin/rejection-reasons").then(r => setReasons(r.data)).catch(() => {});
  }, []);

  const loadStats = useCallback(() => {
    Promise.all([
      api.get("/admin/jobs?status=IN_PROGRESS").catch(() => ({ data: [] })),
      api.get("/admin/mechanics?status=VERIFIED").catch(() => ({ data: [] })),
      api.get("/admin/mechanics/pending").catch(() => ({ data: [] })),
    ]).then(([jobs, mechs, pending]) => {
      const pendingVerify = pending.data.length;
      setPendingCount(pendingVerify);
      setStats(s => ({
        ...s,
        activeJobs:      jobs.data.length,
        onlineMechanics: mechs.data.filter(m => m.isAvailable).length,
        pendingVerify,
      }));
    });
  }, []);

  useEffect(() => { loadReasons(); loadStats(); }, [loadReasons, loadStats]);

  const handleLogout       = () => { logout(); navigate("/login"); };
  const handleAddReason    = async (reason) => { await api.post("/admin/rejection-reasons", { reason }); loadReasons(); };
  const handleDeleteReason = async (id)     => { await api.delete(`/admin/rejection-reasons/${id}`); loadReasons(); };

  const TABS = [
    { id: "overview",  label: "Overview"  },
    { id: "verify",    label: "Verify",   badge: pendingCount },
    { id: "mechanics", label: "Mechanics" },
    { id: "jobs",      label: "Jobs"      },
    { id: "users",     label: "Users"     },
    { id: "reasons",   label: "Reasons"   },
  ];

  return (
    <div className="adm-root" style={{ maxWidth: 480, margin: "0 auto" }}>

      {/* ── Topbar ── */}
      <div style={{
        background: C.bg, padding: "13px 16px 11px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `0.5px solid ${C.border}`,
        position: "sticky", top: 0, zIndex: 20,
      }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: C.red, letterSpacing: "-0.5px" }}>PitStop</span>
            <span style={{
              background: "#1c0608", border: `0.5px solid #3a0a0e`,
              borderRadius: 20, padding: "2px 9px", fontSize: 9,
              color: C.red, letterSpacing: "0.1em", fontWeight: 700,
            }}>ADMIN</span>
          </div>
          <div style={{ fontSize: 10, color: C.dim, marginTop: 1, letterSpacing: "0.04em" }}>Admin Dashboard</div>
        </div>
        <button className="adm-btn" onClick={handleLogout} style={{
          background: "transparent", border: `0.5px solid ${C.border2}`,
          color: C.dim, borderRadius: 8, padding: "5px 12px", fontSize: 11,
        }}>Logout</button>
      </div>

      {/* ── Tab nav ── */}
      <div style={{
        display: "flex", borderBottom: `0.5px solid ${C.border}`,
        background: C.bg, overflowX: "auto",
        position: "sticky", top: 46, zIndex: 19,
      }}>
        {TABS.map(t => (
          <div key={t.id} className="adm-tab-item" onClick={() => setActiveTab(t.id)} style={{
            padding: "10px 13px", fontSize: 11, cursor: "pointer",
            whiteSpace: "nowrap", flexShrink: 0,
            borderBottom: activeTab === t.id ? `2px solid ${C.red}` : "2px solid transparent",
            color: activeTab === t.id ? C.red : C.dim,
            fontWeight: activeTab === t.id ? 600 : 400,
          }}>
            {t.label}
            {t.badge > 0 && (
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                background: C.red, color: "#fff", borderRadius: "50%",
                width: 16, height: 16, fontSize: 9, fontWeight: 700,
                marginLeft: 5, verticalAlign: "middle",
                boxShadow: `0 0 8px ${C.red}99`,
              }}>{t.badge}</span>
            )}
          </div>
        ))}
      </div>

      {/* ── Tab body ── */}
      <div style={{ padding: 14 }}>
        {activeTab === "overview"  && <OverviewTab stats={stats} />}
        {activeTab === "verify"    && <VerifyTab rejectionReasons={rejectionReasons} onAction={loadStats} />}
        {activeTab === "mechanics" && <MechanicsTab />}
        {activeTab === "jobs"      && <JobsTab />}
        {activeTab === "users"     && <UsersTab />}
        {activeTab === "reasons"   && <ReasonsTab reasons={rejectionReasons} onAdd={handleAddReason} onDelete={handleDeleteReason} />}
      </div>
    </div>
  );
}
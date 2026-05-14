import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import TopBar from "../components/TopBar";
import Badge from "../components/Badge";
import Avatar from "../components/Avatar";

/* ─── Status mappings ──────────────────────────────────────────────────────── */
const STATUS_BADGE = {
  VERIFIED:    { variant: "green", label: "Verified"    },
  PENDING:     { variant: "gold",  label: "Pending"     },
  REJECTED:    { variant: "red",   label: "Rejected"    },
  SUSPENDED:   { variant: "dim",   label: "Suspended"   },
  IN_PROGRESS: { variant: "live",  label: "In Progress" },
  ACCEPTED:    { variant: "live",  label: "Accepted"    },
  COMPLETED:   { variant: "green", label: "Completed"   },
  CANCELLED:   { variant: "red",   label: "Cancelled"   },
  ACTIVE:      { variant: "green", label: "Active"      },
  BANNED:      { variant: "red",   label: "Banned"      },
  TIMED_OUT:   { variant: "gold",  label: "Timed out"   },
};

const STATUS_COLOR = {
  VERIFIED:    "var(--green)",
  PENDING:     "var(--gold)",
  REJECTED:    "var(--red)",
  SUSPENDED:   "var(--red)",
  IN_PROGRESS: "var(--blue)",
  ACCEPTED:    "var(--blue)",
  COMPLETED:   "var(--green)",
  CANCELLED:   "var(--text-3)",
  ACTIVE:      "var(--green)",
  BANNED:      "var(--red)",
  TIMED_OUT:   "var(--gold)",
};

/* ─── Injected styles (hover / focus / animation only) ────────────────────── */
const STYLES = `
  .adm { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; overflow-x: hidden; }
  .adm-row { cursor: pointer; transition: background 0.12s; }
  .adm-row:hover { background: var(--surface2) !important; }
  .adm-tab { cursor: pointer; user-select: none; transition: color 0.15s; }
  .adm-pill { cursor: pointer; transition: all 0.12s; }
  .adm-pill:hover { border-color: var(--text-3) !important; }
  .adm-btn { cursor: pointer; transition: opacity 0.12s; font-family: 'Inter', sans-serif; }
  .adm-btn:hover { opacity: 0.78; }
  .adm-btn:active { opacity: 0.6; }
  .adm-in { transition: border-color 0.15s; font-family: 'Inter', sans-serif; }
  .adm-in:focus { border-color: var(--red) !important; outline: none; }
  .adm-in::placeholder { color: var(--text-3); opacity: 1; }
  .adm-slide { overflow: hidden; transition: max-height 0.24s cubic-bezier(0.4,0,0.2,1); }
  .adm-mono { font-family: 'Courier New', monospace; }
  .adm-dot { animation: blink 2s infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
  .chevron { transition: transform 0.2s ease; }
  .adm-tabs { scrollbar-width: none; -ms-overflow-style: none; }
  .adm-tabs::-webkit-scrollbar { display: none; }
`;

function injectStyles() {
  if (document.getElementById("adm-styles")) return;
  const s = document.createElement("style");
  s.id = "adm-styles";
  s.textContent = STYLES;
  document.head.appendChild(s);
}

/* ─── Micro components ─────────────────────────────────────────────────────── */

function SBadge({ status }) {
  const b = STATUS_BADGE[status] ?? { variant: "dim", label: status };
  return <Badge variant={b.variant}>{b.label}</Badge>;
}

function Chevron({ open }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      className="chevron" style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function Slide({ open, children }) {
  return (
    <div className="adm-slide" style={{ maxHeight: open ? 260 : 0 }}>
      <div style={{ padding: "12px 14px 14px", borderTop: "1px solid var(--border)" }}>
        {children}
      </div>
    </div>
  );
}

function ABtn({ label, color = "ghost", onClick, full = true, small }) {
  const map = {
    green: { bg: "rgba(74,222,128,0.09)",  bd: "rgba(74,222,128,0.28)", tx: "var(--green)" },
    red:   { bg: "rgba(230,57,70,0.09)",   bd: "rgba(230,57,70,0.28)",  tx: "var(--red)"   },
    gold:  { bg: "rgba(255,183,0,0.09)",   bd: "rgba(255,183,0,0.28)",  tx: "var(--gold)"  },
    ghost: { bg: "var(--surface2)",        bd: "var(--border)",         tx: "var(--text-3)" },
  };
  const c = map[color];
  return (
    <button className="adm-btn" onClick={onClick} style={{
      flex: full ? 1 : "none",
      height: small ? 30 : 36,
      padding: small ? "0 12px" : "0",
      borderRadius: 10,
      background: c.bg, border: `1px solid ${c.bd}`, color: c.tx,
      fontSize: small ? 11 : 12, fontWeight: 600,
    }}>{label}</button>
  );
}

function BtnRow({ children }) {
  return <div style={{ display: "flex", gap: 8 }}>{children}</div>;
}

function Field({ placeholder, type = "text", value, onChange }) {
  return (
    <input type={type} className="adm-in" placeholder={placeholder} value={value} onChange={onChange}
      style={{
        display: "block", width: "100%", height: 38, borderRadius: 10, marginBottom: 8,
        background: "var(--surface2)", border: "1px solid var(--border)",
        color: "var(--text)", fontSize: 13, padding: "0 12px",
      }}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={onChange} className="adm-in" style={{
      display: "block", width: "100%", height: 38, borderRadius: 10, marginBottom: 8,
      background: "var(--surface2)", border: "1px solid var(--border)",
      color: value ? "var(--text)" : "var(--text-3)",
      fontSize: 13, padding: "0 12px", appearance: "none",
    }}>
      <option value="">Select reason…</option>
      {options.map(o => <option key={o.id} value={o.reason}>{o.reason}</option>)}
    </select>
  );
}

function Search({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", marginBottom: 12 }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="var(--text-3)" strokeWidth="2.2" strokeLinecap="round"
        style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
      <input className="adm-in" placeholder={placeholder} value={value} onChange={onChange}
        style={{
          width: "100%", height: 42, borderRadius: 12,
          background: "var(--surface)", border: "1px solid var(--border)",
          color: "var(--text)", fontSize: 13, paddingLeft: 34, paddingRight: 12,
        }}
      />
    </div>
  );
}

function Pills({ options, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
      {options.map(o => (
        <button key={o.value} className="adm-pill adm-btn" onClick={() => onChange(o.value)} style={{
          height: 28, padding: "0 12px", borderRadius: 9999, flexShrink: 0,
          background: active === o.value ? "var(--red)" : "transparent",
          border: `1px solid ${active === o.value ? "var(--red)" : "var(--border)"}`,
          color: active === o.value ? "var(--text)" : "var(--text-3)",
          fontSize: 11, fontWeight: active === o.value ? 600 : 400,
        }}>{o.label}</button>
      ))}
    </div>
  );
}

function Empty({ icon = "◌", text }) {
  return (
    <div style={{ textAlign: "center", padding: "44px 0" }}>
      <div style={{ fontSize: 30, opacity: 0.12, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 12, color: "var(--text-3)" }}>{text}</div>
    </div>
  );
}

function Loader() {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "44px 0" }}>
      {[0, 1, 2].map(i => (
        <div key={i} className="adm-dot" style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "var(--red)", animationDelay: `${i * 0.18}s`,
        }} />
      ))}
    </div>
  );
}

/* ─── Stats mini strip ──────────────────────────────────────────────────────── */
function MiniStats({ stats }) {
  return (
    <div style={{
      display: "flex", borderTop: "1px solid var(--border)",
      background: "var(--surface2)",
    }}>
      {stats.map((s, i, arr) => (
        <div key={s.label} style={{
          flex: 1, padding: "8px 0", textAlign: "center",
          borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none",
        }}>
          <div className="adm-mono" style={{ fontSize: 14, fontWeight: 700, color: s.color ?? "var(--text)", lineHeight: 1 }}>
            {s.value}
          </div>
          <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.8px" }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Section heading ───────────────────────────────────────────────────────── */
function SectionHead({ children }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, color: "var(--text-3)",
      textTransform: "uppercase", letterSpacing: "2px", marginBottom: 14,
    }}>{children}</div>
  );
}

/* ─── Left-bar card shell ──────────────────────────────────────────────────── */
function ItemCard({ status, children, style }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderLeft: `4px solid ${STATUS_COLOR[status] ?? "var(--border)"}`,
      borderRadius: 14, marginBottom: 8, overflow: "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  OVERVIEW TAB                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function OverviewTab({ stats }) {
  const tiles = [
    { label: "Active Jobs",           value: stats.activeJobs,      color: "var(--green)", stripe: "rgba(74,222,128,0.70)"  },
    { label: "Online Mechanics",      value: stats.onlineMechanics, color: "var(--green)", stripe: "rgba(74,222,128,0.70)"  },
    { label: "Pending Verifications", value: stats.pendingVerify,   color: "var(--red)",   stripe: "rgba(230,57,70,0.85)"   },
    { label: "Pending Reports",       value: stats.pendingReports,  color: "var(--gold)",  stripe: "rgba(255,183,0,0.75)"   },
  ];

  return (
    <>
      {/* 2 × 2 stat grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        {tiles.map(t => (
          <div key={t.label} style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 16, overflow: "hidden",
          }}>
            <div style={{ height: 3, background: t.stripe }} />
            <div style={{ padding: "16px 14px 14px" }}>
              <div style={{
                fontSize: 42, fontWeight: 800, color: t.color,
                lineHeight: 1, letterSpacing: "-2px",
                fontVariantNumeric: "tabular-nums",
              }}>
                {t.value ?? "—"}
              </div>
              <div style={{
                fontSize: 9, fontWeight: 600, color: "var(--text-3)",
                marginTop: 10, textTransform: "uppercase", letterSpacing: "1.5px",
              }}>
                {t.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live feed */}
      <SectionHead>Live Feed</SectionHead>

      {!(stats.recentActivity?.length) ? (
        <Empty icon="📡" text="No recent activity" />
      ) : (
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 14, overflow: "hidden",
        }}>
          {stats.recentActivity.map((item, i, arr) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 14px",
              borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
            }}>
              <div className="adm-dot" style={{
                width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                background: item.color, boxShadow: `0 0 6px ${item.color}`,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{item.name}</span>
                <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 7 }}>{item.action}</span>
              </div>
              <span className="adm-mono" style={{ fontSize: 10, color: "var(--text-3)", flexShrink: 0 }}>
                {item.time}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  VERIFY TAB                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

function VerifyTab({ rejectionReasons, onAction }) {
  const [pending, setPending]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [openReject, setOpenReject] = useState(null);
  const [reason, setReason]         = useState({});

  useEffect(() => {
    api.get("/admin/mechanics/pending")
      .then(r => setPending(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const approve = async (id) => {
    await api.patch(`/admin/mechanics/${id}/verify`, { action: "APPROVE" });
    setPending(p => p.filter(m => m.id !== id));
    onAction();
  };

  const reject = async (id) => {
    if (!reason[id]) return;
    await api.patch(`/admin/mechanics/${id}/verify`, { action: "REJECT", rejectionReason: reason[id] });
    setPending(p => p.filter(m => m.id !== id));
    setOpenReject(null);
    onAction();
  };

  if (loading) return <Loader />;
  if (!pending.length) return <Empty icon="✓" text="No pending applications" />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {pending.map(m => (
        <ItemCard key={m.id} status="PENDING">
          {/* Profile row */}
          <div style={{ padding: "14px 14px 12px", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <Avatar name={m.name} size="md" variant="gold" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.2px", marginBottom: 3 }}>
                {m.name}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                {m.phone} · {m.serviceRadiusKm}km radius
              </div>
              {m.area && (
                <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>📍 {m.area}</div>
              )}
              <span className="adm-mono" style={{ fontSize: 10, color: "var(--text-3)", marginTop: 4, display: "block" }}>
                Applied {m.createdAt ? new Date(m.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              </span>
            </div>
            <SBadge status="PENDING" />
          </div>

          {/* Expertise chips */}
          {m.expertiseSummary?.length > 0 && (
            <div style={{ padding: "0 14px 12px", display: "flex", flexWrap: "wrap", gap: 5 }}>
              {m.expertiseSummary.slice(0, 5).map((tag, i) => (
                <span key={i} style={{
                  background: "var(--surface2)", border: "1px solid var(--border)",
                  borderRadius: 9999, padding: "3px 9px", fontSize: 10, color: "var(--text-2)",
                }}>{tag}</span>
              ))}
              {m.expertiseSummary.length > 5 && (
                <span style={{
                  background: "var(--surface2)", border: "1px solid var(--border)",
                  borderRadius: 9999, padding: "3px 9px", fontSize: 10, color: "var(--text-3)",
                }}>+{m.expertiseSummary.length - 5} more</span>
              )}
            </div>
          )}

          {/* Decision buttons */}
          <div style={{ padding: "0 14px 14px", display: "flex", gap: 8 }}>
            <ABtn label="✓  Approve" color="green" onClick={() => approve(m.id)} />
            <ABtn
              label={openReject === m.id ? "Cancel" : "✕  Reject"}
              color={openReject === m.id ? "ghost" : "red"}
              onClick={() => setOpenReject(openReject === m.id ? null : m.id)}
            />
          </div>

          {/* Reject form */}
          <Slide open={openReject === m.id}>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8 }}>Select rejection reason</div>
            <Select
              value={reason[m.id] || ""}
              onChange={e => setReason(p => ({ ...p, [m.id]: e.target.value }))}
              options={rejectionReasons}
            />
            <ABtn label="Confirm Reject" color="red" onClick={() => reject(m.id)} />
          </Slide>
        </ItemCard>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MECHANICS TAB                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MechanicsTab() {
  const [mechanics, setMechanics]     = useState([]);
  const [search, setSearch]           = useState("");
  const [filter, setFilter]           = useState("");
  const [loading, setLoading]         = useState(true);
  const [expanded, setExpanded]       = useState(null);
  const [suspendForm, setSuspendForm] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (filter) p.set("status", filter);
    api.get(`/admin/mechanics?${p}`).then(r => setMechanics(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [search, filter]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const suspend   = async (id) => {
    const f = suspendForm[id] || {};
    if (!f.reason || !f.days) return;
    await api.post(`/admin/mechanics/${id}/suspend`, { reason: f.reason, suspensionDays: parseInt(f.days) });
    setExpanded(null); load();
  };
  const unsuspend = async (id) => { await api.post(`/admin/mechanics/${id}/unsuspend`); load(); };
  const del       = async (id) => {
    if (!window.confirm("Permanently delete mechanic?")) return;
    await api.delete(`/admin/mechanics/${id}`); load();
  };

  const toggle = id => setExpanded(e => e === id ? null : id);

  return (
    <>
      <Search value={search} onChange={e => setSearch(e.target.value)} placeholder="Search mechanics…" />
      <Pills
        options={[
          { value: "", label: "All" }, { value: "VERIFIED", label: "Verified" },
          { value: "SUSPENDED", label: "Suspended" }, { value: "REJECTED", label: "Rejected" },
        ]}
        active={filter} onChange={setFilter}
      />

      {loading ? <Loader /> : !mechanics.length ? <Empty text="No mechanics found" /> :
        mechanics.map(m => {
          const st = m.verificationStatus;
          const isOpen = expanded === m.mechanicProfileId;
          const isSuspended = st === "SUSPENDED";

          return (
            <ItemCard key={m.mechanicProfileId} status={st}>
              {/* Header row — tap to expand */}
              <div className="adm-row" onClick={() => toggle(m.mechanicProfileId)} style={{
                padding: "13px 14px", display: "flex", alignItems: "center", gap: 12,
              }}>
                <Avatar name={m.name} size="sm" variant={isSuspended ? "red" : "muted"} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: isSuspended ? "var(--text-3)" : "var(--text)", letterSpacing: "-0.1px" }}>
                    {m.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                    {m.rating ? `⭐ ${Number(m.rating).toFixed(1)}` : "New"} · {m.serviceRadiusKm}km radius
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <SBadge status={st} />
                  <span style={{ color: "var(--text-3)", display: "flex" }}>
                    <Chevron open={isOpen} />
                  </span>
                </div>
              </div>

              {/* Stats strip */}
              <MiniStats stats={[
                { label: "Jobs",    value: m.totalJobsCompleted ?? 0,    color: "var(--text)" },
                { label: "Cancels", value: m.midJobCancels ?? 0,         color: m.midJobCancels > 0 ? "var(--red)" : "var(--text)" },
                { label: "Radius",  value: `${m.serviceRadiusKm ?? 0}km`, color: "var(--text)" },
              ]} />

              {/* Suspension reason banner */}
              {isSuspended && m.suspensionReason && (
                <div style={{
                  margin: "10px 14px 0",
                  background: "rgba(230,57,70,0.06)", border: "1px solid rgba(230,57,70,0.18)",
                  borderRadius: 8, padding: "7px 10px", fontSize: 11, color: "var(--red)",
                }}>
                  ⚠ {m.suspensionReason}
                  {m.suspensionEndsAt && (
                    <span style={{ color: "var(--text-3)" }}> · ends {new Date(m.suspensionEndsAt).toLocaleDateString("en-IN")}</span>
                  )}
                </div>
              )}

              {/* Expandable actions */}
              <Slide open={isOpen}>
                {isSuspended ? (
                  <BtnRow>
                    <ABtn label="Unsuspend" color="green" onClick={() => unsuspend(m.mechanicProfileId)} />
                    <ABtn label="Delete" color="red" onClick={() => del(m.mechanicProfileId)} />
                  </BtnRow>
                ) : (
                  <>
                    <Field
                      placeholder="Suspension reason…"
                      value={suspendForm[m.mechanicProfileId]?.reason || ""}
                      onChange={e => setSuspendForm(p => ({ ...p, [m.mechanicProfileId]: { ...p[m.mechanicProfileId], reason: e.target.value } }))}
                    />
                    <Field
                      type="number"
                      placeholder="Days (e.g. 3)"
                      value={suspendForm[m.mechanicProfileId]?.days || ""}
                      onChange={e => setSuspendForm(p => ({ ...p, [m.mechanicProfileId]: { ...p[m.mechanicProfileId], days: e.target.value } }))}
                    />
                    <BtnRow>
                      <ABtn label="Suspend" color="gold" onClick={() => suspend(m.mechanicProfileId)} />
                      <ABtn label="Delete"  color="red"  onClick={() => del(m.mechanicProfileId)} />
                    </BtnRow>
                  </>
                )}
              </Slide>
            </ItemCard>
          );
        })
      }
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  JOBS TAB                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

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

  const forceComplete = async (id) => { await api.post(`/admin/jobs/${id}/force-complete`); load(); };

  const vLabel = v => ({ TWO_WHEELER: "2-Wheeler", THREE_WHEELER: "3-Wheeler", FOUR_WHEELER: "4-Wheeler", SIX_PLUS_WHEELER: "6W+" }[v] || v);
  const pLabel = p => p?.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) || "—";

  return (
    <>
      <Search value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs…" />
      <Pills
        options={[
          { value: "", label: "All" }, { value: "PENDING", label: "Pending" },
          { value: "IN_PROGRESS", label: "Active" }, { value: "COMPLETED", label: "Completed" },
          { value: "CANCELLED", label: "Cancelled" },
        ]}
        active={filter} onChange={setFilter}
      />

      {loading ? <Loader /> : !jobs.length ? <Empty text="No jobs found" /> :
        jobs.map(j => {
          const st = j.status;
          const isActive = ["PENDING", "ACCEPTED", "IN_PROGRESS"].includes(st);
          return (
            <ItemCard key={j.id} status={st}>
              <div style={{ padding: "13px 14px" }}>
                {/* Top row: job id + badge */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                  <span className="adm-mono" style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "1.5px" }}>
                    JOB #{j.id}
                  </span>
                  <SBadge status={st} />
                </div>

                {/* Problem */}
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>
                  {vLabel(j.vehicleType)} · {pLabel(j.problemType)}
                </div>

                {/* Parties */}
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                  {j.userName || "Unknown"}
                  {j.mechanicName && (
                    <> <span style={{ color: "var(--border)", margin: "0 4px" }}>→</span> {j.mechanicName}</>
                  )}
                </div>
                {(j.broadcastRing || j.area) && (
                  <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 3 }}>
                    {j.broadcastRing && `Ring ${j.broadcastRing}`}{j.broadcastRing && j.area && " · "}{j.area}
                  </div>
                )}
              </div>

              {isActive && (
                <div style={{ padding: "0 14px 13px", display: "flex", gap: 8 }}>
                  {st === "IN_PROGRESS" && (
                    <ABtn label="Force Complete" color="green" small onClick={() => forceComplete(j.id)} />
                  )}
                  <ABtn label="Force Cancel" color="red" small onClick={() => {}} />
                </div>
              )}
            </ItemCard>
          );
        })
      }
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  USERS TAB                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function UsersTab() {
  const [users, setUsers]       = useState([]);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [toHours, setToHours]   = useState({});

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    api.get(`/admin/users?${p}`).then(r => setUsers(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const ban     = async (id) => { await api.post(`/admin/users/${id}/ban`);   load(); };
  const unban   = async (id) => { await api.post(`/admin/users/${id}/unban`); load(); };
  const del     = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    await api.delete(`/admin/users/${id}`); load();
  };
  const timeout = async (id) => {
    await api.post(`/admin/users/${id}/timeout`, { hours: parseInt(toHours[id] || "0") });
    setExpanded(null); load();
  };

  const isTimedOut = u => u.sosTimeoutUntil && new Date(u.sosTimeoutUntil) > new Date();
  const userSt     = u => u.isBanned ? "BANNED" : isTimedOut(u) ? "TIMED_OUT" : "ACTIVE";
  const toggle     = id => setExpanded(e => e === id ? null : id);

  return (
    <>
      <Search value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…" />

      {loading ? <Loader /> : !users.length ? <Empty text="No users found" /> :
        users.map(u => {
          const st = userSt(u);
          const isOpen = expanded === u.id;
          return (
            <ItemCard key={u.id} status={st}>
              {/* Header row */}
              <div className="adm-row" onClick={() => toggle(u.id)} style={{
                padding: "13px 14px", display: "flex", alignItems: "center", gap: 12,
              }}>
                <Avatar name={u.name} size="sm" variant={u.isBanned ? "red" : "muted"} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: u.isBanned ? "var(--text-3)" : "var(--text)", letterSpacing: "-0.1px" }}>
                    {u.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.email}
                  </div>
                  {isTimedOut(u) && (
                    <div style={{ fontSize: 10, color: "var(--gold)", marginTop: 2 }}>
                      ⏱ timeout until {new Date(u.sosTimeoutUntil).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <SBadge status={st} />
                  <span style={{ color: "var(--text-3)", display: "flex" }}>
                    <Chevron open={isOpen} />
                  </span>
                </div>
              </div>

              {/* Stats strip */}
              <MiniStats stats={[
                { label: "SOS Sent", value: u.totalSos ?? 0 },
                { label: "Cancels",  value: u.sosCancelCount ?? 0, color: u.sosCancelCount > 0 ? "var(--gold)" : "var(--text)" },
              ]} />

              {/* Expandable actions */}
              <Slide open={isOpen}>
                {u.isBanned ? (
                  <BtnRow>
                    <ABtn label="Unban" color="green" onClick={() => unban(u.id)} />
                    <ABtn label="Delete" color="red" onClick={() => del(u.id)} />
                  </BtnRow>
                ) : (
                  <>
                    <Field
                      type="number"
                      placeholder="Timeout hours (0 = clear)"
                      value={toHours[u.id] || ""}
                      onChange={e => setToHours(p => ({ ...p, [u.id]: e.target.value }))}
                    />
                    <BtnRow>
                      <ABtn label="Set Timeout" color="gold" onClick={() => timeout(u.id)} />
                      <ABtn label="Ban"         color="red"  onClick={() => ban(u.id)} />
                      <ABtn label="Delete" color="ghost" full={false} small onClick={() => del(u.id)} />
                    </BtnRow>
                  </>
                )}
              </Slide>
            </ItemCard>
          );
        })
      }
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  REASONS TAB                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ReasonsTab({ reasons, onAdd, onDelete }) {
  const [val, setVal] = useState("");

  const add = () => {
    const t = val.trim();
    if (!t) return;
    onAdd(t);
    setVal("");
  };

  return (
    <>
      <SectionHead>Rejection Reasons</SectionHead>

      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 14, overflow: "hidden", marginBottom: 12,
      }}>
        {!reasons.length ? <Empty text="No reasons yet" /> : reasons.map((r, i) => (
          <div key={r.id} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 14px",
            borderBottom: i < reasons.length - 1 ? "1px solid var(--border)" : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--red)", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "var(--text-2)" }}>{r.reason}</span>
            </div>
            <button className="adm-btn" onClick={() => onDelete(r.id)} style={{
              width: 26, height: 26, borderRadius: 8,
              background: "rgba(230,57,70,0.08)", border: "1px solid rgba(230,57,70,0.20)",
              color: "var(--red)", fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>×</button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input className="adm-in" placeholder="New rejection reason…" value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
          style={{
            flex: 1, height: 42, borderRadius: 12,
            background: "var(--surface)", border: "1px solid var(--border)",
            color: "var(--text)", fontSize: 13, padding: "0 12px",
          }}
        />
        <button className="adm-btn" onClick={add} style={{
          height: 42, padding: "0 18px", borderRadius: 12,
          background: "var(--red)", border: "none",
          color: "var(--text)", fontSize: 13, fontWeight: 600,
        }}>Add</button>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  REPORTS TAB                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ReportsTab({ onAction }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get("/admin/reports")
      .then(r => setReports(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const resolve = async (id) => {
    await api.post(`/admin/reports/${id}/resolve`).catch(() => {});
    load();
    onAction?.();
  };

  if (loading) return <Loader />;
  if (!reports.length) return <Empty icon="📋" text="No pending reports" />;

  return (
    <>
      <SectionHead>Pending Reports</SectionHead>
      {reports.map(r => (
        <ItemCard key={r.id} status="SUSPENDED">
          <div style={{ padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{r.reporterName}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>reported <span style={{ color: "var(--text-2)" }}>{r.mechanicName}</span></div>
              </div>
              <div style={{ fontSize: 10, color: "var(--text-3)" }}>Job #{r.jobId}</div>
            </div>
            <div style={{
              background: "var(--surface2)", borderRadius: 8, padding: "7px 10px",
              fontSize: 12, color: "var(--text-2)", marginBottom: r.description ? 6 : 12,
              borderLeft: "3px solid var(--red)",
            }}>
              {r.reason}
            </div>
            {r.description && (
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12, paddingLeft: 4 }}>
                {r.description}
              </div>
            )}
            <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 10 }}>
              {new Date(r.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </div>
            <BtnRow>
              <ABtn label="Resolve" color="green" onClick={() => resolve(r.id)} />
            </BtnRow>
          </div>
        </ItemCard>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  APPEALS TAB                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function AppealsTab({ onAction }) {
  const [appeals, setAppeals]   = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get("/admin/appeals")
      .then(r => setAppeals(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (id) => {
    await api.post(`/admin/appeals/${id}/approve`).catch(() => {});
    load();
    onAction?.();
  };

  const reject = async (id) => {
    await api.post(`/admin/appeals/${id}/reject`).catch(() => {});
    load();
    onAction?.();
  };

  if (loading) return <Loader />;
  if (!appeals.length) return <Empty icon="📋" text="No pending appeals" />;

  return (
    <>
      <SectionHead>Pending Appeals</SectionHead>
      {appeals.map(m => (
        <ItemCard key={m.mechanicProfileId} status="SUSPENDED">
          <div style={{ padding: "12px 14px" }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)", marginBottom: 2 }}>{m.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8 }}>{m.email}</div>
            {m.suspensionReason && (
              <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Suspended for: </span>
                {m.suspensionReason}
              </div>
            )}
            {m.appealReason && (
              <div style={{
                background: "var(--surface2)", borderRadius: 8, padding: "8px 10px",
                fontSize: 12, color: "var(--text-2)", marginBottom: 12,
                borderLeft: "3px solid var(--gold)",
              }}>
                {m.appealReason}
              </div>
            )}
            <BtnRow>
              <ABtn label="Approve" color="green" onClick={() => approve(m.mechanicProfileId)} />
              <ABtn label="Reject"  color="red"   onClick={() => reject(m.mechanicProfileId)} />
            </BtnRow>
          </div>
        </ItemCard>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AdminDashboardPage() {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  const [tab, setTab]             = useState("overview");
  const [reasons, setReasons]     = useState([]);
  const [pending, setPending]     = useState(0);
  const [pendingAppeals, setPendingAppeals] = useState(0);
  const [stats, setStats]         = useState({
    activeJobs: null, onlineMechanics: null, pendingVerify: null, pendingReports: 0, recentActivity: [],
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
      api.get("/admin/appeals").catch(() => ({ data: [] })),
      api.get("/admin/reports").catch(() => ({ data: [] })),
    ]).then(([jobs, mechs, pend, appeals, reports]) => {
      const pv = pend.data.length;
      setPending(pv);
      setPendingAppeals(appeals.data.length);
      setStats(s => ({
        ...s,
        activeJobs:      jobs.data.length,
        onlineMechanics: mechs.data.filter(m => m.isAvailable).length,
        pendingVerify:   pv,
        pendingReports:  reports.data.length,
      }));
    });
  }, []);

  useEffect(() => { loadReasons(); loadStats(); }, [loadReasons, loadStats]);

  const addReason = async (r) => { await api.post("/admin/rejection-reasons", { reason: r }); loadReasons(); };
  const delReason = async (id) => { await api.delete(`/admin/rejection-reasons/${id}`); loadReasons(); };

  const TABS = [
    { id: "overview",  label: "Overview"  },
    { id: "verify",    label: "Verify",    badge: pending },
    { id: "mechanics", label: "Mechanics" },
    { id: "jobs",      label: "Jobs"      },
    { id: "users",     label: "Users"     },
    { id: "reports",   label: "Reports",  badge: stats.pendingReports },
    { id: "appeals",   label: "Appeals",  badge: pendingAppeals },
    { id: "reasons",   label: "Reasons"   },
  ];

  return (
    <div className="adm">
      {/* Iron Man signature — 2px red line at absolute top */}
      <div style={{ height: 2, background: "var(--red)", position: "sticky", top: 0, zIndex: 100 }} />

      <div style={{ maxWidth: 480, margin: "0 auto" }}>

        {/* TopBar */}
        <div style={{ padding: "16px 16px 0" }}>
          <TopBar
            centerContent={<Badge variant="red">ADMIN</Badge>}
            rightContent={
              <button className="adm-btn" onClick={() => { logout(); navigate("/login"); }} style={{
                height: 32, padding: "0 14px", borderRadius: 9,
                background: "transparent", border: "1px solid var(--border)",
                color: "var(--text-3)", fontSize: 12,
              }}>Logout</button>
            }
          />
        </div>

        {/* Tab strip */}
        <div className="adm-tabs" style={{
          display: "flex", overflowX: "auto",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg)",
          position: "sticky", top: 2, zIndex: 20,
          paddingLeft: 16,
          marginTop: 12,
        }}>
          {TABS.map(t => (
            <button key={t.id} className="adm-tab adm-btn" onClick={() => setTab(t.id)} style={{
              height: 46, padding: "0 16px", flexShrink: 0, background: "transparent",
              border: "none",
              borderBottom: tab === t.id ? "2px solid var(--red)" : "2px solid transparent",
              color: tab === t.id ? "var(--red)" : "var(--text-3)",
              fontSize: 12, fontWeight: tab === t.id ? 600 : 400,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {t.label}
              {t.badge > 0 && (
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  background: "var(--red)", color: "var(--text)", borderRadius: "50%",
                  width: 18, height: 18, fontSize: 10, fontWeight: 700,
                  boxShadow: "0 0 8px rgba(230,57,70,0.5)",
                }}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: "20px 16px 32px" }}>
          {tab === "overview"  && <OverviewTab stats={stats} />}
          {tab === "verify"    && <VerifyTab rejectionReasons={reasons} onAction={loadStats} />}
          {tab === "mechanics" && <MechanicsTab />}
          {tab === "jobs"      && <JobsTab />}
          {tab === "users"     && <UsersTab />}
          {tab === "reports"   && <ReportsTab onAction={loadStats} />}
          {tab === "appeals"   && <AppealsTab onAction={loadStats} />}
          {tab === "reasons"   && <ReasonsTab reasons={reasons} onAdd={addReason} onDelete={delReason} />}
        </div>
      </div>
    </div>
  );
}

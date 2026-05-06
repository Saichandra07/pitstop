import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import Avatar from "../components/Avatar";
import StatGrid from "../components/StatGrid";
import Badge from "../components/Badge";

const PencilIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M9 18l6-6-6-6" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const KeyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="7.5" cy="15.5" r="5.5" stroke="var(--text-2)" strokeWidth="1.5"/>
    <path d="M11 12l7-7M18 5l2 2M15 8l2 2" stroke="var(--text-2)" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round"/>
    <polyline points="16 17 21 12 16 7" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="21" y1="12" x2="9" y2="12" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

function verificationBadgeVariant(status) {
  switch (status) {
    case "VERIFIED":  return "green";
    case "PENDING":   return "gold";
    case "REJECTED":
    case "SUSPENDED": return "red";
    default:          return "dim";
  }
}

function MenuRow({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 14,
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 12, padding: "14px 16px", cursor: "pointer",
        textAlign: "left", marginBottom: 8,
      }}
    >
      <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--surface2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: danger ? "var(--red)" : "var(--text)" }}>{label}</span>
      <ChevronIcon />
    </button>
  );
}

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const isMechanic = user?.role === "MECHANIC";

  const [profile, setProfile]     = useState(null);
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const meRes = await api.get("/accounts/me");
        setProfile(meRes.data);
        setNameInput(meRes.data.name || "");

        if (!isMechanic) {
          const histRes = await api.get("/jobs/my/history");
          setHistory(histRes.data || []);
        }
      } catch {
        // silently fail — display whatever we have from auth context
        setNameInput(user?.name || "");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isMechanic, user?.name]);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const startEdit = () => {
    setNameInput(profile?.name || user?.name || "");
    setSaveError("");
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setSaveError("");
  };

  const saveName = async () => {
    if (!nameInput.trim()) { setSaveError("Name cannot be blank"); return; }
    setSaving(true);
    try {
      await api.patch("/accounts/name", { name: nameInput.trim() });
      setProfile(p => ({ ...p, name: nameInput.trim() }));
      updateUser({ name: nameInput.trim() });
      setEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="ps-spinner" />
      </div>
    );
  }

  const displayName = profile?.name || user?.name || "—";
  const displayEmail = profile?.email || user?.email || "—";

  const completedCount = history.filter(j => j.status === "COMPLETED").length;
  const cancelledCount = history.filter(j => j.status === "CANCELLED").length;

  const userStats = [
    { value: completedCount, label: "Completed" },
    { value: cancelledCount, label: "Cancelled"  },
  ];

  const mechStats = [
    { value: profile?.verificationStatus || "—", label: "Status" },
    { value: profile?.isAvailable ? "Online" : "Offline", label: "Now" },
  ];

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font)", paddingBottom: 72 }}>

      {/* ── TopBar ── */}
      <div style={{ borderBottom: "1px solid var(--border)", padding: "0 16px" }}>
        <TopBar centerContent={<span style={{ fontSize: 15, fontWeight: 600 }}>Profile</span>} />
      </div>

      <div style={{ padding: "28px 20px 0" }}>

        {/* ── Hero ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <Avatar
            name={displayName}
            size="lg"
            variant={isMechanic ? "gold" : "red"}
          />

          {/* Name row */}
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
            {editing ? (
              <input
                ref={inputRef}
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") cancelEdit(); }}
                style={{
                  background: "var(--surface2)", border: "1px solid var(--gold)", borderRadius: 8,
                  padding: "6px 12px", fontSize: 18, fontWeight: 700, color: "var(--text)",
                  fontFamily: "var(--font)", textAlign: "center", width: 200, outline: "none",
                }}
              />
            ) : (
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>{displayName}</span>
            )}
            {!editing && (
              <div onClick={startEdit} style={{ cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }}>
                <PencilIcon />
              </div>
            )}
          </div>

          {saveError && <p style={{ fontSize: 11, color: "var(--red)", margin: "4px 0 0" }}>{saveError}</p>}

          {/* Edit action buttons */}
          {editing && (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button onClick={cancelEdit} className="ps-btn-ghost" style={{ padding: "7px 18px", fontSize: 12, width: "auto" }}>Cancel</button>
              <button onClick={saveName} disabled={saving} className="ps-btn" style={{ padding: "7px 18px", fontSize: 12, width: "auto", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          )}

          {/* Role / verification badge */}
          <div style={{ marginTop: 10 }}>
            {isMechanic && profile?.verificationStatus ? (
              <Badge variant={verificationBadgeVariant(profile.verificationStatus)}>
                {profile.verificationStatus.charAt(0) + profile.verificationStatus.slice(1).toLowerCase()}
              </Badge>
            ) : (
              <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "1px", textTransform: "uppercase" }}>User</span>
            )}
          </div>
        </div>

        {/* ── Email row ── */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 4 }}>Email</div>
          <div style={{ fontSize: 14, color: "var(--text-2)" }}>{displayEmail}</div>
        </div>

        {/* ── Stats ── */}
        <div style={{ marginBottom: 24 }}>
          <StatGrid stats={isMechanic ? mechStats : userStats} />
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: "var(--border)", marginBottom: 16 }} />

        {/* ── Menu rows ── */}
        <MenuRow
          icon={<KeyIcon />}
          label="Change Password"
          onClick={() => navigate("/forgot-password")}
        />
        <MenuRow
          icon={<LogoutIcon />}
          label="Log out"
          onClick={handleLogout}
          danger
        />
      </div>

      {/* ── Footer ── */}
      <div style={{ textAlign: "center", padding: "32px 0 16px", fontSize: 11, color: "var(--text-3)" }}>
        PitStop v1.0.0
      </div>

      <BottomNav role={isMechanic ? "mechanic" : "user"} active="profile" />
    </div>
  );
}

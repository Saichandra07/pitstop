import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function AdminDashboardPage() {
  const [pendingMechanics, setPendingMechanics] = useState([]);
  const [rejectionReasons, setRejectionReasons] = useState([]);
  const [newReason, setNewReason] = useState("");
  const [selectedReasons, setSelectedReasons] = useState({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPending();
    fetchReasons();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await api.get("/admin/mechanics/pending");
      setPendingMechanics(res.data);
    } catch {
      setMessage("Failed to load pending mechanics");
    }
  };

  const fetchReasons = async () => {
    try {
      const res = await api.get("/admin/rejection-reasons");
      setRejectionReasons(res.data);
    } catch {
      setMessage("Failed to load rejection reasons");
    }
  };

  const handleVerify = async (id, action) => {
    const rejectionReason = selectedReasons[id] || null;
    if (action === "REJECT" && !rejectionReason) {
      setMessage("Please select a rejection reason before rejecting.");
      return;
    }
    try {
      await api.patch(`/admin/mechanics/${id}/verify`, { action, rejectionReason });
      setMessage(action === "APPROVE" ? "Mechanic approved ✅" : "Mechanic rejected ❌");
      fetchPending();
    } catch {
      setMessage("Action failed. Try again.");
    }
  };

  const handleAddReason = async () => {
    if (!newReason.trim()) return;
    try {
      await api.post("/admin/rejection-reasons", { reason: newReason.trim() });
      setNewReason("");
      fetchReasons();
    } catch {
      setMessage("Failed to add reason. It may already exist.");
    }
  };

  const handleDeleteReason = async (id) => {
    try {
      await api.delete(`/admin/rejection-reasons/${id}`);
      fetchReasons();
    } catch {
      setMessage("Failed to delete reason.");
    }
  };

    const { logout } = useAuth();

    const handleLogout = () => {
    logout();
    window.location.href = "/login";
    };

  return (
    <div style={styles.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
  <h1 style={{ ...styles.title, marginBottom: 0 }}>PitStop <span style={styles.accent}>Admin</span></h1>
  <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
</div>

      {message && (
        <div style={styles.messageBanner} onClick={() => setMessage("")}>
          {message} <span style={styles.dismiss}>✕</span>
        </div>
      )}

      {/* Verification Queue */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Verification Queue
          {pendingMechanics.length > 0 && (
            <span style={styles.badge}>{pendingMechanics.length}</span>
          )}
        </h2>

        {pendingMechanics.length === 0 ? (
          <p style={styles.empty}>No pending applications.</p>
        ) : (
          pendingMechanics.map((m) => (
            <div key={m.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.mechanicName}>{m.name}</span>
                <span style={styles.pendingBadge}>PENDING</span>
              </div>
              <div style={styles.cardDetails}>
                <span>{m.email}</span>
                <span>📞 {m.phone}</span>
                <span>📍 {m.serviceRadiusKm} km radius</span>
                <span>Applied: {new Date(m.createdAt).toLocaleDateString()}</span>
              </div>

              <div style={styles.cardActions}>
                <select
                  style={styles.select}
                  value={selectedReasons[m.id] || ""}
                  onChange={(e) =>
                    setSelectedReasons({ ...selectedReasons, [m.id]: e.target.value })
                  }
                >
                  <option value="">Select rejection reason...</option>
                  {rejectionReasons.map((r) => (
                    <option key={r.id} value={r.reason}>{r.reason}</option>
                  ))}
                </select>

                <div style={styles.buttonRow}>
                  <button style={styles.approveBtn} onClick={() => handleVerify(m.id, "APPROVE")}>
                    ✅ Approve
                  </button>
                  <button style={styles.rejectBtn} onClick={() => handleVerify(m.id, "REJECT")}>
                    ❌ Reject
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Rejection Reasons Management */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Rejection Reasons</h2>

        <div style={styles.addRow}>
          <input
            style={styles.input}
            placeholder="Add new reason..."
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddReason()}
          />
          <button style={styles.addBtn} onClick={handleAddReason}>Add</button>
        </div>

        {rejectionReasons.length === 0 ? (
          <p style={styles.empty}>No rejection reasons yet.</p>
        ) : (
          rejectionReasons.map((r) => (
            <div key={r.id} style={styles.reasonRow}>
              <span style={styles.reasonText}>{r.reason}</span>
              <button style={styles.deleteBtn} onClick={() => handleDeleteReason(r.id)}>
                Delete
              </button>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

const styles = {
  page: {
    backgroundColor: "#141414",
    minHeight: "100vh",
    padding: "32px 24px",
    fontFamily: "monospace",
    color: "#fff",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "24px",
    letterSpacing: "1px",
  },
  accent: { color: "#E63946" },
  messageBanner: {
    backgroundColor: "#1e1e1e",
    border: "1px solid #E63946",
    borderRadius: "8px",
    padding: "12px 16px",
    marginBottom: "20px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dismiss: { color: "#E63946", fontWeight: "bold" },
  section: {
    backgroundColor: "#1a1a1a",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "32px",
    border: "1px solid #2a2a2a",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  badge: {
    backgroundColor: "#E63946",
    color: "#fff",
    borderRadius: "12px",
    padding: "2px 10px",
    fontSize: "13px",
    fontWeight: "bold",
  },
  empty: { color: "#666", fontSize: "14px" },
  card: {
    backgroundColor: "#222",
    borderRadius: "10px",
    padding: "18px",
    marginBottom: "16px",
    border: "1px solid #2e2e2e",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  mechanicName: { fontSize: "16px", fontWeight: "bold" },
  pendingBadge: {
    backgroundColor: "#FAC775",
    color: "#141414",
    borderRadius: "6px",
    padding: "2px 10px",
    fontSize: "11px",
    fontWeight: "bold",
  },
  cardDetails: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    fontSize: "13px",
    color: "#aaa",
    marginBottom: "14px",
  },
  cardActions: { display: "flex", flexDirection: "column", gap: "10px" },
  select: {
    backgroundColor: "#2a2a2a",
    color: "#fff",
    border: "1px solid #3a3a3a",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "13px",
    width: "100%",
  },
  buttonRow: { display: "flex", gap: "10px" },
  approveBtn: {
    flex: 1,
    backgroundColor: "#61cd96",
    color: "#141414",
    border: "none",
    borderRadius: "8px",
    padding: "10px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "14px",
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: "#E63946",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "14px",
  },
  addRow: { display: "flex", gap: "10px", marginBottom: "16px" },
  input: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    color: "#fff",
    border: "1px solid #3a3a3a",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "14px",
  },
  addBtn: {
    backgroundColor: "#E63946",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "14px",
  },
  reasonRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    backgroundColor: "#222",
    borderRadius: "8px",
    marginBottom: "8px",
    border: "1px solid #2e2e2e",
  },
  reasonText: { fontSize: "14px", color: "#ccc" },
  deleteBtn: {
    backgroundColor: "transparent",
    color: "#E63946",
    border: "1px solid #E63946",
    borderRadius: "6px",
    padding: "4px 12px",
    cursor: "pointer",
    fontSize: "12px",
  },
  logoutBtn: {
  backgroundColor: "transparent",
  color: "#666",
  border: "1px solid #333",
  borderRadius: "8px",
  padding: "8px 20px",
  cursor: "pointer",
  fontSize: "14px",
},
};
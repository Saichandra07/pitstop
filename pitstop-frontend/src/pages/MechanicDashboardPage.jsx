import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

// ── Wall screens ────────────────────────────────────────────────

function PendingWall({ onLogout }) {
  return (
    <div style={styles.wall}>
      <div style={styles.wallCard}>
        <div style={styles.wallIcon}>⏳</div>
        <h2 style={styles.wallTitle}>Application Received</h2>
        <p style={styles.wallText}>
          Your application is under review. You'll be notified once approved.
        </p>
        <div style={styles.statusBadge("#FAC775")}>PENDING VERIFICATION</div>
        <button style={styles.logoutBtn} onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}

function RejectedWall({ reason, onLogout }) {
  return (
    <div style={styles.wall}>
      <div style={styles.wallCard}>
        <div style={styles.wallIcon}>❌</div>
        <h2 style={styles.wallTitle}>Application Rejected</h2>
        {reason && (
          <div style={styles.reasonBox}>
            <span style={styles.reasonLabel}>Reason:</span> {reason}
          </div>
        )}
        <p style={styles.wallText}>
          You can resubmit your application with updated information.
        </p>
        <button style={styles.resubmitBtn} onClick={() => window.location.href = "/register/mechanic"}>
          Resubmit Application
        </button>
        <button style={styles.logoutBtn} onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}

function SuspendedWall({ onLogout }) {
  return (
    <div style={styles.wall}>
      <div style={styles.wallCard}>
        <div style={styles.wallIcon}>🚫</div>
        <h2 style={styles.wallTitle}>Account Suspended</h2>
        <p style={styles.wallText}>
          Your account has been suspended. Please contact support or submit an appeal.
        </p>
        <div style={styles.statusBadge("#E63946")}>SUSPENDED</div>
        <button style={styles.logoutBtn} onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}

// ── Main dashboard ───────────────────────────────────────────────

export default function MechanicDashboardPage() {
  const { logout } = useAuth();
  const [me, setMe] = useState(null);
  const [pendingJobs, setPendingJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe();
  }, []);

  const fetchMe = async () => {
    try {
      const res = await api.get("/accounts/me");
      setMe(res.data);
      if (res.data.verificationStatus === "VERIFIED") {
        fetchPendingJobs();
        fetchActiveJob();
      }
    } catch {
      setMessage("Failed to load account.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingJobs = async () => {
    try {
      const res = await api.get("/jobs/pending");
      setPendingJobs(res.data);
    } catch {
      // unverified mechanic gets 403 here — swallow silently
    }
  };

  const fetchActiveJob = async () => {
    try {
      const res = await api.get("/jobs/mechanic/active");
      setActiveJob(res.data);
    } catch {
      setActiveJob(null);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      await api.patch("/accounts/availability");
      setMe(prev => ({ ...prev, isAvailable: !prev.isAvailable }));
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to toggle availability.");
    }
  };

  const handleAssign = async (jobId) => {
    try {
      await api.post(`/jobs/${jobId}/assign`);
      setMessage("Job accepted ✅");
      fetchPendingJobs();
      fetchActiveJob();
    } catch {
      setMessage("Failed to accept job.");
    }
  };

  const handleStatusUpdate = async (jobId, status) => {
    try {
      await api.patch(`/jobs/${jobId}/status`, { status });
      setMessage(`Job marked as ${status} ✅`);
      fetchActiveJob();
      fetchPendingJobs();
    } catch {
      setMessage("Failed to update status.");
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <p style={{ color: "#666", textAlign: "center", paddingTop: "40px" }}>Loading...</p>
      </div>
    );
  }

  // ── Verification gates ────────────────────────────────────────
  if (!me) return null;

  if (me.verificationStatus === "PENDING" || me.verificationStatus === "UNVERIFIED") {
    return <PendingWall onLogout={handleLogout} />;
  }

  if (me.verificationStatus === "REJECTED") {
    return <RejectedWall reason={me.rejectionReason} onLogout={handleLogout} />;
  }

  if (me.verificationStatus === "SUSPENDED") {
    return <SuspendedWall onLogout={handleLogout} />;
  }

  // ── Verified dashboard ────────────────────────────────────────
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          Mechanic <span style={{ color: "#E63946" }}>Dashboard</span>
        </h1>
        <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
      </div>

      {message && (
        <div style={styles.messageBanner} onClick={() => setMessage("")}>
          {message} <span style={{ color: "#E63946" }}>✕</span>
        </div>
      )}

      {/* Availability toggle */}
      <div style={styles.availabilityCard}>
        <div>
          <div style={styles.availabilityLabel}>Status</div>
          <div style={{
            color: me.isAvailable ? "#61cd96" : "#666",
            fontWeight: "bold",
            fontSize: "16px"
          }}>
            {me.isAvailable ? "🟢 Online" : "⚫ Offline"}
          </div>
        </div>
        <button
          style={me.isAvailable ? styles.goOfflineBtn : styles.goOnlineBtn}
          onClick={handleToggleAvailability}
        >
          {me.isAvailable ? "Go Offline" : "Go Online"}
        </button>
      </div>

      {/* Active job */}
      {activeJob && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Active Job</h2>
          <div style={styles.jobCard}>
            <div style={styles.jobDetail}>🚗 {activeJob.vehicleType}</div>
            <div style={styles.jobDetail}>🔧 {activeJob.problemType}</div>
            <div style={styles.jobDetail}>🚘 {activeJob.vehicleName}</div>
            {activeJob.description && (
              <div style={styles.jobDetail}>📝 {activeJob.description}</div>
            )}
            <div style={styles.jobStatus}>{activeJob.status}</div>
            <div style={styles.buttonRow}>
              {activeJob.status === "ACCEPTED" && (
                <button style={styles.actionBtn} onClick={() => handleStatusUpdate(activeJob.id, "IN_PROGRESS")}>
                  Mark Arrived
                </button>
              )}
              {activeJob.status === "IN_PROGRESS" && (
                <button style={styles.actionBtn} onClick={() => handleStatusUpdate(activeJob.id, "COMPLETED")}>
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pending jobs */}
      {me.isAvailable && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            Incoming Requests
            {pendingJobs.length > 0 && (
              <span style={styles.badge}>{pendingJobs.length}</span>
            )}
          </h2>
          {pendingJobs.length === 0 ? (
            <p style={styles.empty}>No pending requests right now.</p>
          ) : (
            pendingJobs.map(job => (
              <div key={job.id} style={styles.jobCard}>
                <div style={styles.jobDetail}>🚗 {job.vehicleType}</div>
                <div style={styles.jobDetail}>🔧 {job.problemType}</div>
                <div style={styles.jobDetail}>🚘 {job.vehicleName}</div>
                {job.description && (
                  <div style={styles.jobDetail}>📝 {job.description}</div>
                )}
                <button style={styles.acceptBtn} onClick={() => handleAssign(job.id)}>
                  Accept Job
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const statusColor = (color) => ({
  display: "inline-block",
  backgroundColor: color + "22",
  color: color,
  border: `1px solid ${color}`,
  borderRadius: "8px",
  padding: "4px 14px",
  fontSize: "12px",
  fontWeight: "bold",
  marginTop: "12px",
});

const styles = {
  page: {
    backgroundColor: "#141414",
    minHeight: "100vh",
    padding: "24px",
    fontFamily: "monospace",
    color: "#fff",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  title: { fontSize: "24px", fontWeight: "bold", margin: 0 },
  messageBanner: {
    backgroundColor: "#1e1e1e",
    border: "1px solid #E63946",
    borderRadius: "8px",
    padding: "12px 16px",
    marginBottom: "16px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
  },
  availabilityCard: {
    backgroundColor: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  availabilityLabel: { color: "#666", fontSize: "12px", marginBottom: "4px" },
  goOnlineBtn: {
    backgroundColor: "#61cd96",
    color: "#141414",
    border: "none",
    borderRadius: "8px",
    padding: "10px 24px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "14px",
  },
  goOfflineBtn: {
    backgroundColor: "#2a2a2a",
    color: "#fff",
    border: "1px solid #3a3a3a",
    borderRadius: "8px",
    padding: "10px 24px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "14px",
  },
  section: {
    backgroundColor: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "24px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  badge: {
    backgroundColor: "#E63946",
    color: "#fff",
    borderRadius: "12px",
    padding: "2px 10px",
    fontSize: "12px",
  },
  empty: { color: "#666", fontSize: "14px" },
  jobCard: {
    backgroundColor: "#222",
    border: "1px solid #2e2e2e",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "12px",
  },
  jobDetail: { color: "#ccc", fontSize: "14px", marginBottom: "6px" },
  jobStatus: {
    color: "#FAC775",
    fontSize: "12px",
    fontWeight: "bold",
    marginTop: "8px",
  },
  buttonRow: { display: "flex", gap: "10px", marginTop: "12px" },
  actionBtn: {
    backgroundColor: "#FAC775",
    color: "#141414",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "14px",
  },
  acceptBtn: {
    backgroundColor: "#61cd96",
    color: "#141414",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "14px",
    marginTop: "10px",
    width: "100%",
  },
  // Wall screen styles
  wall: {
    backgroundColor: "#141414",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: "monospace",
  },
  wallCard: {
    backgroundColor: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "16px",
    padding: "40px 32px",
    maxWidth: "400px",
    width: "100%",
    textAlign: "center",
  },
  wallIcon: { fontSize: "48px", marginBottom: "16px" },
  wallTitle: { fontSize: "22px", fontWeight: "bold", marginBottom: "12px" },
  wallText: { color: "#888", fontSize: "14px", lineHeight: "1.6", marginBottom: "20px" },
  statusBadge: (color) => ({
    display: "inline-block",
    backgroundColor: color + "22",
    color: color,
    border: `1px solid ${color}`,
    borderRadius: "8px",
    padding: "4px 14px",
    fontSize: "12px",
    fontWeight: "bold",
    marginBottom: "24px",
  }),
  reasonBox: {
    backgroundColor: "#222",
    border: "1px solid #E63946",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "14px",
    color: "#ccc",
    marginBottom: "16px",
    textAlign: "left",
  },
  reasonLabel: { color: "#E63946", fontWeight: "bold" },
  resubmitBtn: {
    backgroundColor: "#E63946",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 24px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "14px",
    width: "100%",
    marginBottom: "12px",
  },
  logoutBtn: {
    backgroundColor: "transparent",
    color: "#666",
    border: "1px solid #333",
    borderRadius: "8px",
    padding: "10px 24px",
    cursor: "pointer",
    fontSize: "14px",
    width: "100%",
  },
};
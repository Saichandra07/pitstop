import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { login } = useAuth();

  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("No verification token found in the link.");
      return;
    }

    axios.post(`/auth/verify-email?token=${token}`)
      .then(res => {
        login(res.data);
        setStatus("success");
        setTimeout(() => {
          if (res.data.role === "ADMIN") navigate("/admin/dashboard");
          else if (res.data.role === "MECHANIC") navigate("/mechanic/dashboard");
          else navigate("/dashboard");
        }, 1500);
      })
      .catch(err => {
        const msg = err.response?.data?.message;
        setStatus("error");
        setErrorMsg(msg || "Verification link is invalid or expired.");
      });
  }, []);

  if (status === "verifying") return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
        <h2 style={styles.title}>Verifying your email...</h2>
        <p style={styles.subtitle}>Just a moment.</p>
      </div>
    </div>
  );

  if (status === "success") return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
        <h2 style={styles.title}>Email verified!</h2>
        <p style={styles.subtitle}>Taking you to your dashboard...</p>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
        <h2 style={styles.title}>Verification failed</h2>
        <p style={styles.subtitle}>{errorMsg}</p>
        <button style={styles.button} onClick={() => navigate("/login")}>
          Back to Login
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", backgroundColor: "#141414", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#1e1e1e", borderRadius: 16, padding: 32, width: "100%", maxWidth: 400, textAlign: "center" },
  title: { color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 8 },
  subtitle: { color: "#888", fontSize: 14, marginBottom: 24 },
  button: { width: "100%", padding: "14px", borderRadius: 10, backgroundColor: "#E63946", color: "#fff", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer" },
};
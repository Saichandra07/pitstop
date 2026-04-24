import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "../pitstop.css";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { login } = useAuth();

  const [status, setStatus] = useState("verifying");
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
    <div className="ps-page" style={{ justifyContent: "center" }}>
      <div className="ps-card" style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Verifying your email...</h2>
        <p style={{ color: "#888", fontSize: 14 }}>Just a moment.</p>
      </div>
    </div>
  );

  if (status === "success") return (
    <div className="ps-page" style={{ justifyContent: "center" }}>
      <div className="ps-card" style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Email verified!</h2>
        <p style={{ color: "#888", fontSize: 14 }}>Taking you to your dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="ps-page" style={{ justifyContent: "center" }}>
      <div className="ps-card" style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
        <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Verification failed</h2>
        <p className="ps-alert-error" style={{ marginBottom: 24 }}>{errorMsg}</p>
        <button className="ps-btn" onClick={() => navigate("/login")}>Back to Login</button>
      </div>
    </div>
  );
}
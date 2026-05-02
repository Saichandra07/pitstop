import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setMessage("Invalid or missing verification link."); return; }
    axios.post("/auth/verify-email", { token })
      .then((res) => { login(res.data); setStatus("success"); })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed. Link may have expired.");
      });
  }, []);

  return (
    <div style={{
      minHeight: "100dvh",
      background: "radial-gradient(ellipse at 50% 35%, #1f0a0d 0%, #0A0A0F 60%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "24px 16px",
    }}>

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{
          width: "56px", height: "56px", borderRadius: "16px",
          background: "rgba(230,57,70,0.15)", border: "1.5px solid var(--red)",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px",
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"
              stroke="#E63946" strokeWidth="2" strokeLinejoin="round" fill="none"/>
          </svg>
        </div>
        <p style={{ fontSize: "24px", fontWeight: "900", letterSpacing: "2px", color: "var(--text)", marginBottom: "5px" }}>PITSTOP</p>
        <p style={{ fontSize: "12px", color: "var(--text-3)", letterSpacing: "0.3px" }}>Roadside help, instantly.</p>
      </div>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: "420px", background: "var(--surface)",
        border: "1px solid var(--border)", borderRadius: "16px", padding: "32px 20px",
        textAlign: "center",
      }}>

        {status === "verifying" && (
          <>
            <div style={{
              width: "52px", height: "52px", borderRadius: "50%",
              background: "rgba(255,183,0,0.1)", border: "1.5px solid var(--gold)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                  stroke="#FFB700" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={{ fontSize: "18px", fontWeight: "700", color: "var(--text)", marginBottom: "8px" }}>Verifying...</p>
            <p style={{ fontSize: "12px", color: "var(--text-3)" }}>Please wait a moment</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{
              width: "52px", height: "52px", borderRadius: "50%",
              background: "rgba(74,222,128,0.1)", border: "1.5px solid var(--green)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ fontSize: "18px", fontWeight: "700", color: "var(--text)", marginBottom: "8px" }}>Email verified!</p>
            <p style={{ fontSize: "12px", color: "var(--text-2)", marginBottom: "24px" }}>
              You're all set. Taking you to your dashboard...
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                width: "100%", padding: "14px", borderRadius: "12px",
                background: "var(--red)", border: "none", color: "var(--text)",
                fontSize: "14px", fontWeight: "700", fontFamily: "inherit", cursor: "pointer",
              }}
            >
              Go to dashboard
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{
              width: "52px", height: "52px", borderRadius: "50%",
              background: "rgba(230,57,70,0.1)", border: "1.5px solid var(--red)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#E63946" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={{ fontSize: "18px", fontWeight: "700", color: "var(--text)", marginBottom: "8px" }}>Verification failed</p>
            <p style={{ fontSize: "12px", color: "var(--text-2)", marginBottom: "24px" }}>{message}</p>
            <Link to="/login" style={{
              display: "block", padding: "14px", borderRadius: "12px",
              background: "var(--surface2)", border: "1px solid var(--border)",
              color: "var(--text)", fontSize: "14px", fontWeight: "600",
              textDecoration: "none",
            }}>
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
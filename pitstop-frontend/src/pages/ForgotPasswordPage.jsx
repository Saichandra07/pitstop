import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) { setError("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email"); return; }
    setError(""); setLoading(true);
    try {
      await axios.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Try again.");
    } finally { setLoading(false); }
  };

  const labelStyle = {
    display: "block",
    textAlign: "left",
    fontSize: "10px",
    fontWeight: "600",
    color: "var(--text-3)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "6px",
  };

  const inputStyle = (hasError) => ({
    width: "100%",
    background: "var(--surface2)",
    border: `1px solid ${hasError ? "var(--red)" : "var(--border)"}`,
    borderRadius: "10px",
    padding: "11px 13px",
    fontSize: "13px",
    color: "var(--text)",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  });

  return (
    <div style={{
      minHeight: "100dvh",
      background: "radial-gradient(ellipse at 50% 35%, #1f0a0d 0%, #0A0A0F 60%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
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
        width: "100%", maxWidth: "420px",
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "16px", padding: "24px 20px 28px",
      }}>

        {!sent ? (
          <>
            <p style={{ fontSize: "18px", fontWeight: "700", color: "var(--text)", marginBottom: "4px", textAlign: "center" }}>
              Forgot password?
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-2)", marginBottom: "20px", textAlign: "center" }}>
              Enter your email and we'll send a reset link
            </p>

            {error && (
              <div style={{
                background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.3)",
                borderRadius: "10px", padding: "10px 12px", fontSize: "12px",
                color: "var(--red)", marginBottom: "16px", textAlign: "left",
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                style={inputStyle(!!error)}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%", padding: "14px", borderRadius: "12px",
                background: loading ? "var(--surface3)" : "var(--red)",
                border: "none", color: "var(--text)", fontSize: "14px",
                fontWeight: "700", fontFamily: "inherit",
                cursor: loading ? "not-allowed" : "pointer", marginBottom: "20px",
              }}
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>

            <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-2)" }}>
              Remembered it?{" "}
              <Link to="/login" style={{ color: "var(--red)", textDecoration: "none", fontWeight: "600" }}>
                Sign in
              </Link>
            </p>
          </>
        ) : (
          /* Sent state */
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{
              width: "52px", height: "52px", borderRadius: "50%",
              background: "rgba(74,222,128,0.1)", border: "1.5px solid var(--green)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ fontSize: "18px", fontWeight: "700", color: "var(--text)", marginBottom: "8px" }}>
              Check your inbox
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-2)", marginBottom: "4px" }}>
              Reset link sent to
            </p>
            <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--gold)", marginBottom: "24px" }}>
              {email}
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-3)", marginBottom: "20px" }}>
              Link expires in 15 minutes. Check spam if you don't see it.
            </p>
            <Link to="/login" style={{
              display: "block", padding: "14px", borderRadius: "12px",
              background: "var(--surface2)", border: "1px solid var(--border)",
              color: "var(--text)", fontSize: "14px", fontWeight: "600",
              textDecoration: "none", textAlign: "center",
            }}>
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
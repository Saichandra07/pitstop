import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) { setError("Enter your email."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email."); return; }
    setLoading(true); setError("");
    try {
      await axios.post("/auth/forgot-password", { email });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  if (sent) return (
    <div className="ps-page">
      <div className="ps-logo">
        <div className="ps-logo-mark">
          <div className="ps-logo-icon">🔧</div>
          <span className="ps-logo-text">PitStop</span>
        </div>
      </div>
      <div className="ps-card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>📬</div>
        <div className="ps-card-title" style={{ textAlign: "center" }}>Check your email</div>
        <div className="ps-card-sub" style={{ textAlign: "center" }}>
          If an account exists for <strong style={{ color: "#f0f0f0" }}>{email}</strong>, a reset link has been sent. It expires in 15 minutes.
        </div>
        <div className="ps-spacer" />
        <Link to="/login" className="ps-btn" style={{ display: "block", textDecoration: "none", textAlign: "center" }}>
          Back to Sign in
        </Link>
      </div>
    </div>
  );

  return (
    <div className="ps-page">
      <div className="ps-logo">
        <div className="ps-logo-mark">
          <div className="ps-logo-icon">🔧</div>
          <span className="ps-logo-text">PitStop</span>
        </div>
        <div className="ps-logo-sub">On-demand roadside mechanics</div>
      </div>

      <div className="ps-card">
        <div className="ps-card-title">Forgot password</div>
        <div className="ps-card-sub">Enter your email and we'll send you a reset link.</div>

        {error && <div className="ps-alert-error">{error}</div>}

        <div className="ps-field">
          <label className="ps-label">Email</label>
          <input className="ps-input" type="email" placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        </div>

        <button className="ps-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </button>

        <div className="ps-divider">
          <div className="ps-divider-line" /><span className="ps-divider-text">OR</span><div className="ps-divider-line" />
        </div>

        <Link to="/login" style={{ display: "block", textAlign: "center", fontSize: "13px", color: "#888", textDecoration: "none" }}>
          Remember it? <span className="ps-link">Sign in</span>
        </Link>
      </div>
    </div>
  );
}
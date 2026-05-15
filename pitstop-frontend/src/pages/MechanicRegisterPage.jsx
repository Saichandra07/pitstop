import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import PitStopLogo from "../components/PitStopLogo";
import ProgressBar from "../components/ProgressBar";

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
  color: "var(--text)",
  fontSize: "14px",
  outline: "none",
  fontFamily: "'Inter', sans-serif",
  boxSizing: "border-box",
});

export default function MechanicRegisterPage() {
  const [step, setStep] = useState(1);
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validateStep1 = () => {
    const e = {};
    if (!form.name.trim())             e.name = "Name is required";
    if (!form.email.trim())            e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password)                e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Minimum 6 characters";
    if (!form.confirmPassword)         e.confirmPassword = "Please confirm your password";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    return e;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.phone.trim()) e.phone = "Phone number is required";
    return e;
  };

  const handleNext = () => {
    const e = validateStep1();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep(2);
  };

  const handleBack = () => {
    setErrors({});
    setStep(1);
  };

  const handleSubmit = async () => {
    const e = validateStep2();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setGlobalError("");
    setLoading(true);
    try {
      await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: "MECHANIC",
        phone: form.phone,
        expertise: null,
      });
      setRegisteredEmail(form.email);
      setRegistered(true);
    } catch (err) {
      setGlobalError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div style={{
        minHeight: "100dvh", background: "var(--bg)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px",
      }}>
        <PitStopLogo variant="auth" />
        <div className="ps-auth-card" style={{ textAlign: "center" }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "rgba(255,183,0,0.10)", border: "1.5px solid var(--gold)",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                stroke="#FFB700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Check your inbox</p>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 4 }}>
            We sent a verification link to
          </p>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--gold)", marginBottom: 20 }}>{registeredEmail}</p>
          <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 20, lineHeight: "1.6" }}>
            Click the link in the email to activate your account. Check spam if you don't see it.
          </p>
          <Link to="/login" style={{
            display: "block", padding: "13px", borderRadius: 12,
            background: "var(--surface2)", border: "1px solid var(--border)",
            color: "var(--text)", fontSize: 13, fontWeight: 600, textDecoration: "none",
          }}>
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="ps-scroll-hide"
      style={{
        minHeight: "100dvh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px 40px",
        overflowX: "hidden",
      }}
    >
      <PitStopLogo variant="auth" />

      <div className="ps-auth-card">
        <div style={{ marginBottom: 4 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px", margin: 0 }}>
            Join as Mechanic
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
            {step === 1 ? "Step 1 of 2 — Account details" : "Step 2 of 2 — Contact number"}
          </p>
        </div>

        <ProgressBar steps={2} current={step} />

        {globalError && (
          <div style={{
            background: "rgba(230,57,70,0.10)",
            border: "1px solid rgba(230,57,70,0.30)",
            borderRadius: 10,
            padding: "10px 13px",
            color: "var(--red)",
            fontSize: 13,
            marginBottom: 16,
          }}>
            {globalError}
          </div>
        )}

        {step === 1 && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Full name</label>
              <input
                style={inputStyle(!!errors.name)}
                type="text"
                placeholder="Lewis Hamilton"
                value={form.name}
                onChange={set("name")}
              />
              {errors.name && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>{errors.name}</div>}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email</label>
              <input
                style={inputStyle(!!errors.email)}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set("email")}
              />
              {errors.email && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>{errors.email}</div>}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Password</label>
              <input
                style={inputStyle(!!errors.password)}
                type="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={set("password")}
              />
              {errors.password && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>{errors.password}</div>}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Confirm password</label>
              <input
                style={inputStyle(!!errors.confirmPassword)}
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
                onKeyDown={(e) => e.key === "Enter" && handleNext()}
              />
              {errors.confirmPassword && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>{errors.confirmPassword}</div>}
            </div>

            <button
              className="ps-btn"
              onClick={handleNext}
              style={{ borderRadius: 12, fontSize: 14, height: 48 }}
            >
              Next →
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>OR</span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>

            <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-3)", margin: 0 }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color: "var(--red)", fontWeight: 600, textDecoration: "none" }}>
                Sign in
              </Link>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            {/* Gold info card */}
            <div style={{
              background: "rgba(255,183,0,0.06)",
              border: "1px solid rgba(255,183,0,0.30)",
              borderRadius: 10,
              padding: "10px 12px",
              marginBottom: 10,
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>📞</span>
              <p style={{ fontSize: 11, color: "var(--text-2)", margin: 0, lineHeight: "1.5" }}>
                Users contact you through this number during active jobs. Use your real number.
              </p>
            </div>

            {/* Red warning card */}
            <div style={{
              background: "rgba(230,57,70,0.06)",
              border: "1px solid rgba(230,57,70,0.25)",
              borderRadius: 10,
              padding: "10px 12px",
              marginBottom: 12,
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
              <p style={{ fontSize: 11, color: "var(--text-2)", margin: 0, lineHeight: "1.6" }}>
                Entering a fake or wrong number will lead to suspension. If reports of an unreachable
                number are received from multiple users, your account will be suspended immediately.
                During appeal you must submit a correct working number. Repeated offenses after appeal
                result in a permanent ban.
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Phone number</label>
              <input
                style={inputStyle(!!errors.phone)}
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={set("phone")}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              {errors.phone && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>{errors.phone}</div>}
            </div>

            <button
              className="ps-btn"
              onClick={handleSubmit}
              disabled={loading}
              style={{ borderRadius: 12, fontSize: 14, height: 48, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer", marginBottom: 12 }}
            >
              {loading ? "Creating account…" : "Continue →"}
            </button>

            <button
              onClick={handleBack}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                color: "var(--text-3)",
                fontSize: 13,
                cursor: "pointer",
                padding: "8px 0",
                fontFamily: "inherit",
              }}
            >
              ← Back
            </button>
          </>
        )}
      </div>

      <p style={{ marginTop: 20, fontSize: 12, color: "var(--text-3)", textAlign: "center" }}>
        Registering as a user?{" "}
        <Link to="/register" style={{ color: "var(--text-2)", fontWeight: 600, textDecoration: "none" }}>
          Create user account
        </Link>
      </p>
    </div>
  );
}

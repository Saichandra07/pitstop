import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";
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
  fontSize: "13px",
  color: "var(--text)",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
});

const errorText = (msg) => (
  <p style={{ fontSize: "11px", color: "var(--red)", marginTop: "4px", textAlign: "left" }}>{msg}</p>
);

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validateStep1 = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Minimum 8 characters";
    if (!form.confirm) e.confirm = "Please confirm your password";
    else if (form.confirm !== form.password) e.confirm = "Passwords don't match";
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
      await axios.post("/auth/register", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: "USER",
      });
      setRegisteredEmail(form.email);
      setRegistered(true);
    } catch (err) {
      setGlobalError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div style={{
        minHeight: "100dvh", background: "radial-gradient(ellipse at 50% 35%, #1f0a0d 0%, #0A0A0F 60%)",
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
        background: "radial-gradient(ellipse at 50% 35%, #1f0a0d 0%, #0A0A0F 60%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <PitStopLogo variant="auth" />

      <div className="ps-auth-card">
        <div style={{ marginBottom: 4 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px", margin: 0 }}>
            Create account
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
            {step === 1 ? "Step 1 of 2 — Account details" : "Step 2 of 2 — Contact number"}
          </p>
        </div>

        <ProgressBar steps={2} current={step} />

        {globalError && (
          <div style={{
            background: "rgba(230,57,70,0.1)",
            border: "1px solid rgba(230,57,70,0.3)",
            borderRadius: "10px",
            padding: "10px 12px",
            fontSize: "12px",
            color: "var(--red)",
            marginBottom: "16px",
            textAlign: "left",
          }}>
            {globalError}
          </div>
        )}

        {step === 1 && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Full name</label>
              <input
                type="text"
                placeholder="Ravi Kumar"
                value={form.name}
                onChange={set("name")}
                style={inputStyle(errors.name)}
              />
              {errors.name && errorText(errors.name)}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set("email")}
                style={inputStyle(errors.email)}
              />
              {errors.email && errorText(errors.email)}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={set("password")}
                style={inputStyle(errors.password)}
              />
              {errors.password && errorText(errors.password)}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Confirm password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.confirm}
                onChange={set("confirm")}
                onKeyDown={(e) => e.key === "Enter" && handleNext()}
                style={inputStyle(errors.confirm)}
              />
              {errors.confirm && errorText(errors.confirm)}
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
              <span style={{ fontSize: 10, color: "var(--text-3)" }}>OR</span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>

            <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-2)", margin: 0 }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color: "var(--red)", textDecoration: "none", fontWeight: 600 }}>
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
              marginBottom: 12,
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>📞</span>
              <p style={{ fontSize: 11, color: "var(--text-2)", margin: 0, lineHeight: "1.5" }}>
                Your mechanic will call this number when they're on the way. Use your real number.
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Phone number</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={set("phone")}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                style={inputStyle(errors.phone)}
              />
              {errors.phone && errorText(errors.phone)}
            </div>

            <button
              className="ps-btn"
              onClick={handleSubmit}
              disabled={loading}
              style={{ borderRadius: 12, fontSize: 14, height: 48, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer", marginBottom: 12 }}
            >
              {loading ? "Creating account..." : "Create account"}
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

      <div style={{ marginTop: 20 }}>
        <Link to="/register/mechanic" style={{ fontSize: 12, color: "var(--text-3)", textDecoration: "none" }}>
          Are you a mechanic?{" "}
          <span style={{ color: "var(--gold)", fontWeight: 600 }}>Join as a mechanic →</span>
        </Link>
      </div>
    </div>
  );
}

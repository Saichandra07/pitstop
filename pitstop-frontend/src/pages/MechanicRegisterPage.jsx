import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
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
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    password: "", confirmPassword: "", serviceRadiusKm: "",
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.name.trim())             e.name = "Name is required";
    if (!form.email.trim())            e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.phone.trim())            e.phone = "Phone number is required";
    if (!form.password)                e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Minimum 6 characters";
    if (!form.confirmPassword)         e.confirmPassword = "Please confirm your password";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    if (!form.serviceRadiusKm)         e.serviceRadiusKm = "Service radius is required";
    else if (parseFloat(form.serviceRadiusKm) <= 0) e.serviceRadiusKm = "Must be greater than 0";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({}); setGlobalError(""); setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: "MECHANIC",
        phone: form.phone,
        serviceRadiusKm: parseFloat(form.serviceRadiusKm),
        expertise: null,
      });
      login(res.data);
      navigate("/mechanic/onboarding/vehicles");
    } catch (err) {
      setGlobalError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

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

      {/* Card */}
      <div className="ps-auth-card">
        {/* Title */}
        <div style={{ marginBottom: 4 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px", margin: 0 }}>
            Join as Mechanic
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
            Step 1 of 3 — Create your account
          </p>
        </div>

        <ProgressBar steps={3} current={1} />

        {/* Global error */}
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

        {/* Full name */}
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

        {/* Email */}
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

        {/* Phone */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Phone number</label>
          <input
            style={inputStyle(!!errors.phone)}
            type="tel"
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={set("phone")}
          />
          {errors.phone && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>{errors.phone}</div>}
        </div>

        {/* Password */}
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

        {/* Confirm password */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Confirm password</label>
          <input
            style={inputStyle(!!errors.confirmPassword)}
            type="password"
            placeholder="••••••••"
            value={form.confirmPassword}
            onChange={set("confirmPassword")}
          />
          {errors.confirmPassword && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>{errors.confirmPassword}</div>}
        </div>

        {/* Service radius */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Service radius (km)</label>
          <input
            style={inputStyle(!!errors.serviceRadiusKm)}
            type="number"
            placeholder="e.g. 10"
            value={form.serviceRadiusKm}
            onChange={set("serviceRadiusKm")}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            min="1"
          />
          {errors.serviceRadiusKm
            ? <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>{errors.serviceRadiusKm}</div>
            : <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>How far you're willing to travel for a job</div>
          }
        </div>

        {/* Submit */}
        <button
          className="ps-btn"
          onClick={handleSubmit}
          disabled={loading}
          style={{ borderRadius: 12, fontSize: 14, height: 48, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Creating account…" : "Continue →"}
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>OR</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        {/* Sign in link */}
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-3)", margin: 0 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--red)", fontWeight: 600, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>

      {/* User register link — outside card */}
      <p style={{ marginTop: 20, fontSize: 12, color: "var(--text-3)", textAlign: "center" }}>
        Registering as a user?{" "}
        <Link to="/register" style={{ color: "var(--text-2)", fontWeight: 600, textDecoration: "none" }}>
          Create user account
        </Link>
      </p>
    </div>
  );
}

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Minimum 8 characters";
    if (!form.confirm) e.confirm = "Please confirm your password";
    else if (form.confirm !== form.password) e.confirm = "Passwords don't match";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({}); setGlobalError(""); setLoading(true);
    try {
      const res = await axios.post("/auth/register", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: "USER",
      });
      login(res.data);
      navigate("/dashboard");
    } catch (err) {
      setGlobalError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

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
          width: "56px",
          height: "56px",
          borderRadius: "16px",
          background: "rgba(230,57,70,0.15)",
          border: "1.5px solid var(--red)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 14px",
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"
              stroke="#E63946" strokeWidth="2" strokeLinejoin="round" fill="none"/>
          </svg>
        </div>
        <p style={{ fontSize: "24px", fontWeight: "900", letterSpacing: "2px", color: "var(--text)", marginBottom: "5px" }}>
          PITSTOP
        </p>
        <p style={{ fontSize: "12px", color: "var(--text-3)", letterSpacing: "0.3px" }}>
          Roadside help, instantly.
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: "100%",
        maxWidth: "420px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "24px 20px 28px",
      }}>

        <p style={{ fontSize: "18px", fontWeight: "700", color: "var(--text)", marginBottom: "4px", textAlign: "center" }}>
          Create account
        </p>
        <p style={{ fontSize: "12px", color: "var(--text-2)", marginBottom: "20px", textAlign: "center" }}>
          Join PitStop today
        </p>

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

        {/* Name */}
        <div style={{ marginBottom: "12px" }}>
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

        {/* Email */}
        <div style={{ marginBottom: "12px" }}>
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

        {/* Phone */}
        <div style={{ marginBottom: "12px" }}>
          <label style={labelStyle}>Phone number</label>
          <input
            type="tel"
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={set("phone")}
            style={inputStyle(errors.phone)}
          />
          {errors.phone && errorText(errors.phone)}
        </div>

        {/* Password */}
        <div style={{ marginBottom: "12px" }}>
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

        {/* Confirm password */}
        <div style={{ marginBottom: "20px" }}>
          <label style={labelStyle}>Confirm password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={form.confirm}
            onChange={set("confirm")}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            style={inputStyle(errors.confirm)}
          />
          {errors.confirm && errorText(errors.confirm)}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            background: loading ? "var(--surface3)" : "var(--red)",
            border: "none",
            color: "var(--text)",
            fontSize: "14px",
            fontWeight: "700",
            fontFamily: "inherit",
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: "20px",
          }}
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          <span style={{ fontSize: "10px", color: "var(--text-3)" }}>OR</span>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        </div>

        {/* Sign in link */}
        <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-2)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--red)", textDecoration: "none", fontWeight: "600" }}>
            Sign in
          </Link>
        </p>
      </div>

      {/* Join as mechanic */}
      <div style={{ marginTop: "24px" }}>
        <Link to="/register/mechanic" style={{ fontSize: "12px", color: "var(--text-3)", textDecoration: "none" }}>
          Are you a mechanic?{" "}
          <span style={{ color: "var(--gold)", fontWeight: "600" }}>Join as a mechanic →</span>
        </Link>
      </div>
    </div>
  );
}
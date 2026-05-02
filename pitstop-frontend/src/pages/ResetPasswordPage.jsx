import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Minimum 8 characters";
    if (!form.confirm) e.confirm = "Please confirm your password";
    else if (form.confirm !== form.password) e.confirm = "Passwords don't match";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (!token) { setGlobalError("Invalid or missing reset token."); return; }
    setErrors({}); setGlobalError(""); setLoading(true);
    try {
      const res = await axios.post("/auth/reset-password", { token, newPassword: form.password });
      login(res.data);
      navigate("/dashboard");
    } catch (err) {
      setGlobalError(err.response?.data?.message || "Reset failed. Link may have expired.");
    } finally { setLoading(false); }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const labelStyle = {
    display: "block", textAlign: "left", fontSize: "10px", fontWeight: "600",
    color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px",
  };

  const inputStyle = (hasError) => ({
    width: "100%", background: "var(--surface2)",
    border: `1px solid ${hasError ? "var(--red)" : "var(--border)"}`,
    borderRadius: "10px", padding: "11px 13px", fontSize: "13px",
    color: "var(--text)", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  });

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
        border: "1px solid var(--border)", borderRadius: "16px", padding: "24px 20px 28px",
      }}>
        <p style={{ fontSize: "18px", fontWeight: "700", color: "var(--text)", marginBottom: "4px", textAlign: "center" }}>
          Set new password
        </p>
        <p style={{ fontSize: "12px", color: "var(--text-2)", marginBottom: "20px", textAlign: "center" }}>
          Choose something strong
        </p>

        {globalError && (
          <div style={{
            background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.3)",
            borderRadius: "10px", padding: "10px 12px", fontSize: "12px",
            color: "var(--red)", marginBottom: "16px", textAlign: "left",
          }}>
            {globalError}
          </div>
        )}

        <div style={{ marginBottom: "12px" }}>
          <label style={labelStyle}>New password</label>
          <input
            type="password" placeholder="Min. 8 characters"
            value={form.password} onChange={set("password")}
            style={inputStyle(errors.password)}
          />
          {errors.password && <p style={{ fontSize: "11px", color: "var(--red)", marginTop: "4px" }}>{errors.password}</p>}
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={labelStyle}>Confirm password</label>
          <input
            type="password" placeholder="••••••••"
            value={form.confirm} onChange={set("confirm")}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            style={inputStyle(errors.confirm)}
          />
          {errors.confirm && <p style={{ fontSize: "11px", color: "var(--red)", marginTop: "4px" }}>{errors.confirm}</p>}
        </div>

        <button
          onClick={handleSubmit} disabled={loading}
          style={{
            width: "100%", padding: "14px", borderRadius: "12px",
            background: loading ? "var(--surface3)" : "var(--red)",
            border: "none", color: "var(--text)", fontSize: "14px",
            fontWeight: "700", fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Updating..." : "Update password"}
        </button>
      </div>
    </div>
  );
}
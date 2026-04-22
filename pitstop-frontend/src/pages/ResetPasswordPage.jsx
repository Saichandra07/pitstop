import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.newPassword) e.newPassword = "Password is required";
    else if (form.newPassword.length < 6) e.newPassword = "Minimum 6 characters";
    if (!form.confirmPassword) e.confirmPassword = "Please confirm your password";
    else if (form.newPassword !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    return e;
  };

  const handleSubmit = async () => {
    if (!token) { setGlobalError("Invalid or missing reset token."); return; }
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({}); setGlobalError(""); setLoading(true);
    try {
      const res = await axios.post("/auth/reset-password", { token, newPassword: form.newPassword });
      login(res.data);
      if (res.data.role === "ADMIN") navigate("/admin/dashboard");
      else if (res.data.role === "MECHANIC") navigate("/mechanic/dashboard");
      else navigate("/dashboard");
    } catch (err) {
      setGlobalError(err.response?.data?.message || "Reset link is invalid or expired.");
    } finally { setLoading(false); }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

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
        <div className="ps-card-title">Reset password</div>
        <div className="ps-card-sub">Enter your new password below.</div>

        {globalError && <div className="ps-alert-error">{globalError}</div>}

        <div className="ps-field">
          <label className="ps-label">New password</label>
          <input className={`ps-input${errors.newPassword ? " error" : ""}`} type="password"
            placeholder="Min 6 characters" value={form.newPassword} onChange={set("newPassword")} />
          {errors.newPassword && <div className="ps-input-error">{errors.newPassword}</div>}
        </div>

        <div className="ps-field">
          <label className="ps-label">Confirm password</label>
          <input className={`ps-input${errors.confirmPassword ? " error" : ""}`} type="password"
            placeholder="••••••••" value={form.confirmPassword} onChange={set("confirmPassword")}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
          {errors.confirmPassword && <div className="ps-input-error">{errors.confirmPassword}</div>}
        </div>

        <button className="ps-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Resetting..." : "Reset password"}
        </button>
      </div>
    </div>
  );
}
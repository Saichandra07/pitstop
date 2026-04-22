import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({}); setGlobalError(""); setLoading(true);
    try {
      const res = await axios.post("/auth/login", form);
      login(res.data);
      const { role } = res.data;
      if (role === "ADMIN") { navigate("/admin/dashboard"); return; }
      if (role === "MECHANIC") {
        const me = await axios.get("/accounts/me");
        navigate(me.data.hasExpertise ? "/mechanic/dashboard" : "/mechanic/onboarding/vehicles");
        return;
      }
      navigate("/dashboard");
    } catch (err) {
      setGlobalError(err.response?.data?.message || "Invalid email or password");
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
        <div className="ps-card-title">Welcome back</div>
        <div className="ps-card-sub">Sign in to your account</div>

        {globalError && <div className="ps-alert-error">{globalError}</div>}

        <div className="ps-field">
          <label className="ps-label">Email</label>
          <input className={`ps-input${errors.email ? " error" : ""}`} type="email"
            placeholder="you@example.com" value={form.email} onChange={set("email")}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
          {errors.email && <div className="ps-input-error">{errors.email}</div>}
        </div>

        <div className="ps-field" style={{ marginBottom: "6px" }}>
          <label className="ps-label">Password</label>
          <input className={`ps-input${errors.password ? " error" : ""}`} type="password"
            placeholder="••••••••" value={form.password} onChange={set("password")}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
          {errors.password && <div className="ps-input-error">{errors.password}</div>}
        </div>

<div style={{ textAlign: "center", marginBottom: "20px" }}>
  <Link to="/forgot-password" className="ps-link" style={{ fontSize: "12px" }}>Forgot password?</Link>
</div>

        <button className="ps-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <div className="ps-divider">
          <div className="ps-divider-line" /><span className="ps-divider-text">OR</span><div className="ps-divider-line" />
        </div>

        <Link to="/register" style={{ display: "block", textAlign: "center", fontSize: "13px", color: "#888", textDecoration: "none" }}>
          Don't have an account? <span className="ps-link">Create one</span>
        </Link>
      </div>

      <div className="ps-spacer" />
      <Link to="/register/mechanic" style={{ fontSize: "12px", color: "#555", textDecoration: "none" }}>
        Are you a mechanic? <span className="ps-link-yellow">Join as a mechanic →</span>
      </Link>
    </div>
  );
}

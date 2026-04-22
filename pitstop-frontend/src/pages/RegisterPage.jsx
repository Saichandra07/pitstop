import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Minimum 6 characters";
    if (!form.confirmPassword) e.confirmPassword = "Please confirm your password";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({}); setGlobalError(""); setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        name: form.name, email: form.email, password: form.password, role: "USER"
      });
      login(res.data);
      navigate("/dashboard");
    } catch (err) {
      setGlobalError(err.response?.data?.message || "Registration failed. Try again.");
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
        <div className="ps-card-title">Create account</div>
        <div className="ps-card-sub">Get help when you need it most</div>

        {globalError && <div className="ps-alert-error">{globalError}</div>}

        <div className="ps-field">
          <label className="ps-label">Full name</label>
          <input className={`ps-input${errors.name ? " error" : ""}`} type="text"
            placeholder="Max Hamilton" value={form.name} onChange={set("name")} />
          {errors.name && <div className="ps-input-error">{errors.name}</div>}
        </div>

        <div className="ps-field">
          <label className="ps-label">Email</label>
          <input className={`ps-input${errors.email ? " error" : ""}`} type="email"
            placeholder="you@example.com" value={form.email} onChange={set("email")} />
          {errors.email && <div className="ps-input-error">{errors.email}</div>}
        </div>

        <div className="ps-field">
          <label className="ps-label">Password</label>
          <input className={`ps-input${errors.password ? " error" : ""}`} type="password"
            placeholder="Min 6 characters" value={form.password} onChange={set("password")} />
          {errors.password && <div className="ps-input-error">{errors.password}</div>}
        </div>

        <div className="ps-field">
          <label className="ps-label">Confirm password</label>
          <input className={`ps-input${errors.confirmPassword ? " error" : ""}`} type="password"
            placeholder="••••••••" value={form.confirmPassword} onChange={set("confirmPassword")}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
          {errors.confirmPassword && <div className="ps-input-error">{errors.confirmPassword}</div>}
        </div>

        <button className="ps-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>

        <div className="ps-divider">
          <div className="ps-divider-line" /><span className="ps-divider-text">OR</span><div className="ps-divider-line" />
        </div>

        <Link to="/login" style={{ display: "block", textAlign: "center", fontSize: "13px", color: "#888", textDecoration: "none" }}>
          Already have an account? <span className="ps-link">Sign in</span>
        </Link>
      </div>

      <div className="ps-spacer" />
      <Link to="/register/mechanic" style={{ fontSize: "12px", color: "#555", textDecoration: "none" }}>
        Are you a mechanic? <span className="ps-link-yellow">Join as a mechanic →</span>
      </Link>
    </div>
  );
}
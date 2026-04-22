import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function MechanicRegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    phone: "", serviceRadiusKm: ""
  });
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
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (!form.serviceRadiusKm) e.serviceRadiusKm = "Service radius is required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({}); setGlobalError(""); setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        name: form.name, email: form.email, password: form.password,
        role: "MECHANIC", phone: form.phone,
        serviceRadiusKm: parseFloat(form.serviceRadiusKm),
        expertise: null
      });
      login(res.data);
      navigate("/mechanic/onboarding/vehicles");
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
        <div className="ps-card-title">Join as Mechanic</div>
        <div className="ps-card-sub">Step 1 of 3 — Create your account</div>

        <div className="ps-steps">
          <div className="ps-step active" />
          <div className="ps-step" />
          <div className="ps-step" />
        </div>

        {globalError && <div className="ps-alert-error">{globalError}</div>}

        <div className="ps-field">
          <label className="ps-label">Full name</label>
          <input className={`ps-input${errors.name ? " error" : ""}`} type="text"
            placeholder="Lewis Verstappen" value={form.name} onChange={set("name")} />
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
            placeholder="••••••••" value={form.confirmPassword} onChange={set("confirmPassword")} />
          {errors.confirmPassword && <div className="ps-input-error">{errors.confirmPassword}</div>}
        </div>

        <div className="ps-field">
          <label className="ps-label">Phone number</label>
          <input className={`ps-input${errors.phone ? " error" : ""}`} type="tel"
            placeholder="+91 98765 43210" value={form.phone} onChange={set("phone")} />
          {errors.phone && <div className="ps-input-error">{errors.phone}</div>}
        </div>

        <div className="ps-field">
          <label className="ps-label">Service radius (km)</label>
          <input className={`ps-input${errors.serviceRadiusKm ? " error" : ""}`} type="number"
            placeholder="e.g. 10" value={form.serviceRadiusKm} onChange={set("serviceRadiusKm")}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
          {errors.serviceRadiusKm && <div className="ps-input-error">{errors.serviceRadiusKm}</div>}
        </div>

        <button className="ps-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Creating account..." : "Continue →"}
        </button>

        <div className="ps-divider">
          <div className="ps-divider-line" /><span className="ps-divider-text">OR</span><div className="ps-divider-line" />
        </div>

        <Link to="/login" style={{ display: "block", textAlign: "center", fontSize: "13px", color: "#888", textDecoration: "none" }}>
          Already have an account? <span className="ps-link">Sign in</span>
        </Link>
      </div>

      <div className="ps-spacer" />
      <Link to="/register" style={{ fontSize: "12px", color: "#555", textDecoration: "none" }}>
        Registering as a user? <span className="ps-link">Create user account</span>
      </Link>
    </div>
  );
}
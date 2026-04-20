import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function RegisterPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [form, setForm] = useState({
        name: "", email: "", password: "", confirmPassword: ""
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = e =>
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const validate = () => {
        if (!form.name || !form.email || !form.password || !form.confirmPassword)
            return "All fields are required.";
        if (!/\S+@\S+\.\S+/.test(form.email))
            return "Enter a valid email.";
        if (form.password.length < 6)
            return "Password must be at least 6 characters.";
        if (form.password !== form.confirmPassword)
            return "Passwords do not match.";
        return null;
    };

    const handleSubmit = async () => {
        setError("");
        const err = validate();
        if (err) { setError(err); return; }

        try {
            setLoading(true);
            const res = await api.post("/auth/register", {
                name: form.name,
                email: form.email,
                password: form.password,
                role: "USER"
            });
            // Auto login after register — same pattern as mechanic register
            login(res.data.token, {
                id: res.data.id,
                name: res.data.name,
                email: res.data.email,
                role: res.data.role,
                verificationStatus: res.data.verificationStatus
            });
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <div style={styles.logo}>⚡ PitStop</div>
                    <h1 style={styles.title}>Create account</h1>
                    <p style={styles.subtitle}>Get help when you need it most</p>
                </div>

                {error && <div style={styles.error}>{error}</div>}

                <input style={styles.input} name="name" placeholder="Full name"
                    value={form.name} onChange={handleChange} />
                <input style={styles.input} name="email" placeholder="Email address"
                    type="email" value={form.email} onChange={handleChange} />
                <input style={styles.input} name="password" placeholder="Password (min 6 chars)"
                    type="password" value={form.password} onChange={handleChange} />
                <input style={styles.input} name="confirmPassword" placeholder="Confirm password"
                    type="password" value={form.confirmPassword} onChange={handleChange} />

                <button
                    style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Creating account..." : "Create Account"}
                </button>

                <div style={styles.divider}>
                    <div style={styles.dividerLine} />
                    <span style={styles.dividerText}>or</span>
                    <div style={styles.dividerLine} />
                </div>

                <Link to="/register/mechanic" style={styles.mechanicBtn}>
                    🔧 Join as a Mechanic
                </Link>

                <p style={styles.footer}>
                    Already have an account?{" "}
                    <Link to="/login" style={styles.link}>Sign in</Link>
                </p>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh", background: "#141414",
        display: "flex", justifyContent: "center", alignItems: "center",
        padding: "24px 16px"
    },
    card: {
        width: "100%", maxWidth: "400px",
        background: "#1a1a1a", borderRadius: "16px", padding: "36px 24px"
    },
    header: { textAlign: "center", marginBottom: "28px" },
    logo: { color: "#E63946", fontSize: "20px", fontWeight: "700", marginBottom: "12px" },
    title: { color: "#fff", fontSize: "26px", fontWeight: "700", margin: "0 0 8px" },
    subtitle: { color: "#888", fontSize: "14px", margin: 0 },
    error: {
        background: "#2a1518", border: "1px solid #E63946",
        borderRadius: "8px", padding: "12px", color: "#E63946",
        fontSize: "14px", marginBottom: "16px"
    },
    input: {
        width: "100%", background: "#242424", border: "1px solid #2a2a2a",
        borderRadius: "10px", padding: "13px 14px", color: "#fff",
        fontSize: "15px", marginBottom: "10px", boxSizing: "border-box", outline: "none"
    },
    btn: {
        width: "100%", background: "#E63946", border: "none",
        borderRadius: "12px", padding: "15px", color: "#fff",
        fontSize: "16px", fontWeight: "700", cursor: "pointer", marginTop: "4px"
    },
    btnDisabled: { opacity: 0.6, cursor: "not-allowed" },
    divider: {
        display: "flex", alignItems: "center", gap: "12px", margin: "20px 0"
    },
    dividerLine: { flex: 1, height: "1px", background: "#2a2a2a" },
    dividerText: { color: "#555", fontSize: "13px" },
    mechanicBtn: {
        display: "block", width: "100%", background: "#242424",
        border: "1px solid #2a2a2a", borderRadius: "12px", padding: "14px",
        color: "#fff", fontSize: "15px", fontWeight: "600",
        textAlign: "center", textDecoration: "none", boxSizing: "border-box",
        marginBottom: "4px"
    },
    footer: { textAlign: "center", color: "#666", fontSize: "14px", marginTop: "16px" },
    link: { color: "#E63946", textDecoration: "none" }
};
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async () => {
        setError("");
        if (!email || !password) { setError("All fields are required."); return; }

        try {
            setLoading(true);
            const res = await api.post("/auth/login", { email, password });

            login(res.data.token, {
                id: res.data.id,
                name: res.data.name,
                email: res.data.email,
                role: res.data.role,
                verificationStatus: res.data.verificationStatus
            });

            const role = res.data.role;

            if (role === "ADMIN") {
                navigate("/admin/dashboard");
                return;
            }

            if (role === "USER") {
                navigate("/dashboard");
                return;
            }

            if (role === "MECHANIC") {
                // Check if mechanic has completed expertise onboarding
                const meRes = await api.get("/accounts/me");
                if (!meRes.data.hasExpertise) {
                    navigate("/mechanic/onboarding/vehicles");
                } else {
                    navigate("/mechanic/dashboard");
                }
            }

        } catch (err) {
            setError("Invalid email or password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <div style={styles.logo}>⚡ PitStop</div>
                    <h1 style={styles.title}>Welcome back</h1>
                    <p style={styles.subtitle}>Sign in to your account</p>
                </div>

                {error && <div style={styles.error}>{error}</div>}

                <input
                    style={styles.input}
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
                <input
                    style={styles.input}
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />

                <button
                    style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Signing in..." : "Sign In"}
                </button>

                <p style={styles.footer}>
                    Don't have an account?{" "}
                    <Link to="/register" style={styles.link}>Register here</Link>
                </p>
                <p style={styles.footer}>
                    Are you a mechanic?{" "}
                    <Link to="/register/mechanic" style={styles.link}>Join as mechanic</Link>
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
        fontSize: "15px", marginBottom: "12px", boxSizing: "border-box", outline: "none"
    },
    btn: {
        width: "100%", background: "#E63946", border: "none",
        borderRadius: "12px", padding: "15px", color: "#fff",
        fontSize: "16px", fontWeight: "700", cursor: "pointer", marginTop: "4px"
    },
    btnDisabled: { opacity: 0.6, cursor: "not-allowed" },
    footer: { textAlign: "center", color: "#666", fontSize: "14px", marginTop: "16px" },
    link: { color: "#E63946", textDecoration: "none" }
};
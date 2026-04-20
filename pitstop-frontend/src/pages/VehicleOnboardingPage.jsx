import { useState } from "react";
import { useNavigate } from "react-router-dom";

const WHEELER_OPTIONS = [
    { key: "TWO_WHEELER",      label: "2-Wheeler",   sub: "Bike, Scooter",  icon: "🏍️" },
    { key: "THREE_WHEELER",    label: "3-Wheeler",   sub: "Auto, Tempo",    icon: "🛺" },
    { key: "FOUR_WHEELER",     label: "4-Wheeler",   sub: "Car, SUV, Van",  icon: "🚗" },
    { key: "SIX_PLUS_WHEELER", label: "6-Wheeler+",  sub: "Truck, Bus",     icon: "🚛" }
];

export default function VehicleOnboardingPage() {
    const navigate = useNavigate();
    const [selected, setSelected] = useState(new Set());

    const toggle = (key) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const handleNext = () => {
        if (selected.size === 0) return;
        // Pass selected wheelers to next page via location state
        navigate("/mechanic/onboarding/problems", {
            state: { selectedWheelers: Array.from(selected) }
        });
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <div style={styles.logo}>⚡ PitStop</div>
                    <h1 style={styles.title}>What vehicles do you service?</h1>
                    <p style={styles.subtitle}>Step 2 of 3 — Select all that apply</p>
                </div>

                {/* Progress bar */}
                <div style={styles.progressTrack}>
                    <div style={{ ...styles.progressFill, width: "66%" }} />
                </div>

                <div style={styles.grid}>
                    {WHEELER_OPTIONS.map(({ key, label, sub, icon }) => {
                        const isSelected = selected.has(key);
                        return (
                            <div
                                key={key}
                                style={{
                                    ...styles.card2,
                                    ...(isSelected ? styles.card2Selected : {})
                                }}
                                onClick={() => toggle(key)}
                            >
                                {isSelected && <span style={styles.check}>✓</span>}
                                <span style={styles.icon}>{icon}</span>
                                <span style={styles.label}>{label}</span>
                                <span style={styles.sub}>{sub}</span>
                            </div>
                        );
                    })}
                </div>

                <button
                    style={{
                        ...styles.btn,
                        ...(selected.size === 0 ? styles.btnDisabled : {})
                    }}
                    onClick={handleNext}
                    disabled={selected.size === 0}
                >
                    Next →
                </button>
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
        width: "100%", maxWidth: "420px",
        background: "#1a1a1a", borderRadius: "16px", padding: "36px 24px"
    },
    header: { textAlign: "center", marginBottom: "20px" },
    logo: { color: "#E63946", fontSize: "20px", fontWeight: "700", marginBottom: "12px" },
    title: { color: "#fff", fontSize: "22px", fontWeight: "700", margin: "0 0 6px" },
    subtitle: { color: "#888", fontSize: "14px", margin: 0 },
    progressTrack: {
        height: "4px", background: "#2a2a2a", borderRadius: "2px", marginBottom: "28px"
    },
    progressFill: {
        height: "100%", background: "#E63946", borderRadius: "2px"
    },
    grid: {
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px"
    },
    card2: {
        background: "#242424", border: "2px solid #2a2a2a",
        borderRadius: "14px", padding: "20px 12px",
        display: "flex", flexDirection: "column", alignItems: "center",
        cursor: "pointer", position: "relative", userSelect: "none",
        transition: "all 0.15s ease"
    },
    card2Selected: { border: "2px solid #E63946", background: "#2a1518" },
    check: {
        position: "absolute", top: "10px", right: "12px",
        color: "#E63946", fontWeight: "700", fontSize: "14px"
    },
    icon: { fontSize: "32px", marginBottom: "8px" },
    label: { color: "#fff", fontSize: "15px", fontWeight: "600" },
    sub: { color: "#666", fontSize: "12px", marginTop: "3px" },
    btn: {
        width: "100%", background: "#E63946", border: "none",
        borderRadius: "12px", padding: "15px", color: "#fff",
        fontSize: "16px", fontWeight: "700", cursor: "pointer"
    },
    btnDisabled: { opacity: 0.4, cursor: "not-allowed" }
};
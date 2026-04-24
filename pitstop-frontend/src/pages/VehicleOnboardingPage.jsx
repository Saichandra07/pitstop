import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../pitstop.css";

const WHEELER_OPTIONS = [
    { key: "TWO_WHEELER",      label: "2-Wheeler",   icon: "🏍️" },
    { key: "THREE_WHEELER",    label: "3-Wheeler",   icon: "🛺" },
    { key: "FOUR_WHEELER",     label: "4-Wheeler",   icon: "🚗" },
    { key: "SIX_PLUS_WHEELER", label: "6-Wheeler+",  icon: "🚛" }
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
        navigate("/mechanic/onboarding/problems", {
            state: { selectedWheelers: Array.from(selected) }
        });
    };

    return (
    <div style={{ minHeight: "100vh", background: "#141414", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "24px 16px", boxSizing: "border-box" }}>
        <div style={{ width: "100%", maxWidth: 480, background: "#1a1a1a", borderRadius: 16, padding: "36px 24px", marginBottom: 32 }}>

            {/* Back button */}
            <button
                onClick={() => navigate("/register/mechanic")}
                style={{ background: "#242424", border: "none", color: "#fff", width: 36, height: 36, borderRadius: "50%", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}
            >
                ‹
            </button>

            <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>
                What vehicles do you service?
            </h1>
            <p style={{ color: "#888", fontSize: 14, margin: "0 0 20px" }}>
                Step 2 of 3 — Select all that apply
            </p>

            {/* Progress bar */}
            <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#61cd96" }} />
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#E63946" }} />
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#2a2a2a" }} />
            </div>

            {/* Wheeler grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 32 }}>
                {WHEELER_OPTIONS.map(({ key, label, icon }) => {
                    const isSelected = selected.has(key);
                    return (
                        <div
                            key={key}
                            onClick={() => toggle(key)}
                            style={{
                                background: isSelected ? "#2a1518" : "#242424",
                                border: `2px solid ${isSelected ? "#E63946" : "#2a2a2a"}`,
                                borderRadius: 16,
                                padding: "28px 16px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 10,
                                cursor: "pointer",
                                position: "relative",
                                userSelect: "none"
                            }}
                        >
                            {isSelected && (
                                <span style={{ position: "absolute", top: 10, right: 12, color: "#E63946", fontWeight: 700, fontSize: 13 }}>✓</span>
                            )}
                            <span style={{ fontSize: 36 }}>{icon}</span>
                            <span style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>{label}</span>
                        </div>
                    );
                })}
            </div>

            {/* Next button */}
            <button
                onClick={handleNext}
                disabled={selected.size === 0}
                style={{
                    width: "100%",
                    background: "#E63946",
                    border: "none",
                    borderRadius: 12,
                    padding: "15px",
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: selected.size === 0 ? "not-allowed" : "pointer",
                    opacity: selected.size === 0 ? 0.4 : 1
                }}
            >
                Next →
            </button>

        </div>
    </div>
);
}
import { useState, useEffect } from "react";import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";

const PROBLEMS_BY_WHEELER = {
    TWO_WHEELER: [
        "BATTERY_DEAD", "ENGINE_OVERHEATING", "ENGINE_WONT_START", "ENGINE_NOISE",
        "OIL_LEAK", "FLAT_TYRE", "TYRE_BURST", "CHAIN_SNAPPED", "BRAKE_FAILURE",
        "BRAKE_NOISE", "CLUTCH_FAILURE", "SUSPENSION_DAMAGE", "HEADLIGHTS_NOT_WORKING",
        "ACCIDENT_DAMAGE", "VEHICLE_STUCK", "STRANGE_NOISE", "DONT_KNOW"
    ],
    THREE_WHEELER: [
        "BATTERY_DEAD", "ENGINE_OVERHEATING", "ENGINE_WONT_START", "ENGINE_NOISE",
        "OIL_LEAK", "FLAT_TYRE", "TYRE_BURST", "BRAKE_FAILURE", "BRAKE_NOISE",
        "CLUTCH_FAILURE", "SUSPENSION_DAMAGE", "HEADLIGHTS_NOT_WORKING",
        "ACCIDENT_DAMAGE", "VEHICLE_STUCK", "STRANGE_NOISE", "DONT_KNOW",
        "GEAR_STUCK", "STEERING_LOCKED"
    ],
    FOUR_WHEELER: [
        "BATTERY_DEAD", "ENGINE_OVERHEATING", "ENGINE_WONT_START", "ENGINE_NOISE",
        "OIL_LEAK", "FLAT_TYRE", "TYRE_BURST", "BRAKE_FAILURE", "BRAKE_NOISE",
        "CLUTCH_FAILURE", "SUSPENSION_DAMAGE", "HEADLIGHTS_NOT_WORKING",
        "ACCIDENT_DAMAGE", "VEHICLE_STUCK", "STRANGE_NOISE", "DONT_KNOW",
        "GEAR_STUCK", "STEERING_LOCKED", "WARNING_LIGHT"
    ],
    SIX_PLUS_WHEELER: [
        "BATTERY_DEAD", "ENGINE_OVERHEATING", "ENGINE_WONT_START", "ENGINE_NOISE",
        "OIL_LEAK", "FLAT_TYRE", "TYRE_BURST", "BRAKE_FAILURE", "BRAKE_NOISE",
        "CLUTCH_FAILURE", "SUSPENSION_DAMAGE", "HEADLIGHTS_NOT_WORKING",
        "ACCIDENT_DAMAGE", "VEHICLE_STUCK", "STRANGE_NOISE", "DONT_KNOW",
        "GEAR_STUCK", "STEERING_LOCKED", "WARNING_LIGHT"
    ]
};

const WHEELER_LABELS = {
    TWO_WHEELER:      { label: "2-Wheeler",  icon: "🏍️" },
    THREE_WHEELER:    { label: "3-Wheeler",  icon: "🛺" },
    FOUR_WHEELER:     { label: "4-Wheeler",  icon: "🚗" },
    SIX_PLUS_WHEELER: { label: "6-Wheeler+", icon: "🚛" }
};

const formatLabel = val =>
    val.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

export default function ProblemsOnboardingPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Wheelers passed from Step 2 via navigation state
    const selectedWheelers = location.state?.selectedWheelers || [];

    

    const [selectedProblems, setSelectedProblems] = useState({});
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedWheelers.length === 0) {
            navigate("/mechanic/onboarding/vehicles");
        }
    }, []);


    // If someone lands here directly without going through Step 2, send them back
    if (selectedWheelers.length === 0) {
        navigate("/mechanic/onboarding/vehicles");
        return null;
    }

    const toggleProblem = (wheeler, problem) => {
        setSelectedProblems(prev => {
            const current = new Set(prev[wheeler] || []);
            current.has(problem) ? current.delete(problem) : current.add(problem);
            return { ...prev, [wheeler]: current };
        });
    };

    const toggleAll = (wheeler) => {
        const all = PROBLEMS_BY_WHEELER[wheeler];
        const current = selectedProblems[wheeler] || new Set();
        const allSelected = all.every(p => current.has(p));
        setSelectedProblems(prev => ({
            ...prev,
            [wheeler]: allSelected ? new Set() : new Set(all)
        }));
    };

    const validate = () => {
        for (const wheeler of selectedWheelers) {
            const problems = selectedProblems[wheeler];
            if (!problems || problems.size === 0) {
                return `Select at least one problem for ${WHEELER_LABELS[wheeler].label}.`;
            }
        }
        return null;
    };

    const handleSubmit = async () => {
        setError("");
        const err = validate();
        if (err) { setError(err); return; }

        const expertise = {
            expertise: selectedWheelers.map(wheeler => ({
                wheelerType: wheeler,
                problemTypes: Array.from(selectedProblems[wheeler])
            }))
        };

        try {
            setLoading(true);
            await api.patch("/accounts/expertise", expertise);
            navigate("/mechanic/dashboard");
        } catch (err) {
            setError("Failed to save expertise. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <div style={styles.logo}>⚡ PitStop</div>
                    <h1 style={styles.title}>What problems can you fix?</h1>
                    <p style={styles.subtitle}>Step 3 of 3 — Select all you're confident handling</p>
                </div>

                {/* Progress bar */}
                <div style={styles.progressTrack}>
                    <div style={{ ...styles.progressFill, width: "100%" }} />
                </div>

                {selectedWheelers.map(wheeler => {
                    const problems = PROBLEMS_BY_WHEELER[wheeler];
                    const selected = selectedProblems[wheeler] || new Set();
                    const allSelected = problems.every(p => selected.has(p));

                    return (
                        <div key={wheeler} style={styles.block}>
                            <div style={styles.blockHeader}>
                                <span style={styles.blockTitle}>
                                    {WHEELER_LABELS[wheeler].icon} {WHEELER_LABELS[wheeler].label}
                                </span>
                                <button
                                    style={styles.selectAllBtn}
                                    onClick={() => toggleAll(wheeler)}
                                >
                                    {allSelected ? "Deselect all" : "Select all"}
                                </button>
                            </div>
                            <div style={styles.chipGrid}>
                                {problems.map(problem => {
                                    const checked = selected.has(problem);
                                    return (
                                        <div
                                            key={problem}
                                            style={{
                                                ...styles.chip,
                                                ...(checked ? styles.chipSelected : {})
                                            }}
                                            onClick={() => toggleProblem(wheeler, problem)}
                                        >
                                            {checked && <span style={styles.chipCheck}>✓ </span>}
                                            {formatLabel(problem)}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {error && <div style={styles.error}>{error}</div>}

                <button
                    style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Submitting..." : "Submit Application ✓"}
                </button>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh", background: "#141414",
        display: "flex", justifyContent: "center",
        alignItems: "flex-start", padding: "24px 16px"
    },
    card: {
        width: "100%", maxWidth: "480px",
        background: "#1a1a1a", borderRadius: "16px",
        padding: "36px 24px", marginBottom: "32px"
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
    block: {
        background: "#242424", borderRadius: "12px",
        padding: "16px", marginBottom: "12px"
    },
    blockHeader: {
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "12px"
    },
    blockTitle: { color: "#fff", fontSize: "14px", fontWeight: "600" },
    selectAllBtn: {
        background: "none", border: "1px solid #333", borderRadius: "6px",
        color: "#888", fontSize: "12px", padding: "4px 10px", cursor: "pointer"
    },
    chipGrid: { display: "flex", flexWrap: "wrap", gap: "8px" },
    chip: {
        background: "#1a1a1a", border: "1px solid #333",
        borderRadius: "20px", padding: "6px 12px",
        color: "#888", fontSize: "13px", cursor: "pointer", userSelect: "none"
    },
    chipSelected: {
        background: "#2a1518", border: "1px solid #E63946", color: "#fff"
    },
    chipCheck: { color: "#E63946" },
    error: {
        background: "#2a1518", border: "1px solid #E63946", borderRadius: "8px",
        padding: "12px", color: "#E63946", fontSize: "14px", marginBottom: "16px"
    },
    btn: {
        width: "100%", background: "#E63946", border: "none",
        borderRadius: "12px", padding: "15px", color: "#fff",
        fontSize: "16px", fontWeight: "700", cursor: "pointer", marginTop: "8px"
    },
    btnDisabled: { opacity: 0.6, cursor: "not-allowed" }
};
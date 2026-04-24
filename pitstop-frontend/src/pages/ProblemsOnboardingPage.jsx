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
    <div style={{ minHeight: "100vh", background: "#141414", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "24px 16px", boxSizing: "border-box" }}>
        <div style={{ width: "100%", maxWidth: 480, background: "#1a1a1a", borderRadius: 16, padding: "36px 24px", marginBottom: 32 }}>

            {/* Back button */}
            <button
                onClick={() => navigate("/mechanic/onboarding/vehicles")}
                style={{ background: "#242424", border: "none", color: "#fff", width: 36, height: 36, borderRadius: "50%", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}
            >
                ‹
            </button>

            <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>
                What problems can you fix?
            </h1>
            <p style={{ color: "#888", fontSize: 14, margin: "0 0 20px" }}>
                Step 3 of 3 — Select all you're confident handling
            </p>

            {/* Progress bar — 3 segments, all filled for step 3 */}
            <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#61cd96" }} />
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#61cd96" }} />
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#E63946" }} />
            </div>

            {selectedWheelers.map(wheeler => {
                const problems = PROBLEMS_BY_WHEELER[wheeler];
                const selected = selectedProblems[wheeler] || new Set();
                const allSelected = problems.every(p => selected.has(p));

                return (
                    <div key={wheeler} style={{ background: "#242424", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>
                                {WHEELER_LABELS[wheeler].icon} {WHEELER_LABELS[wheeler].label}
                            </span>
                            <button
                                style={{ background: "none", border: "1px solid #333", borderRadius: 6, color: "#888", fontSize: 12, padding: "4px 10px", cursor: "pointer" }}
                                onClick={() => toggleAll(wheeler)}
                            >
                                {allSelected ? "Deselect all" : "Select all"}
                            </button>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {problems.map(problem => {
                                const checked = selected.has(problem);
                                return (
                                    <div
                                        key={problem}
                                        onClick={() => toggleProblem(wheeler, problem)}
                                        style={{
                                            background: checked ? "#2a1518" : "#1a1a1a",
                                            border: `1px solid ${checked ? "#E63946" : "#333"}`,
                                            borderRadius: 20,
                                            padding: "6px 12px",
                                            color: checked ? "#fff" : "#888",
                                            fontSize: 13,
                                            cursor: "pointer",
                                            userSelect: "none"
                                        }}
                                    >
                                        {checked && <span style={{ color: "#E63946" }}>✓ </span>}
                                        {formatLabel(problem)}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {error && (
                <div style={{ background: "#2a1518", border: "1px solid #E63946", borderRadius: 8, padding: 12, color: "#E63946", fontSize: 14, marginBottom: 16 }}>
                    {error}
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                    width: "100%",
                    background: "#E63946",
                    border: "none",
                    borderRadius: 12,
                    padding: "15px",
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                    marginTop: 8
                }}
            >
                {loading ? "Submitting..." : "Submit Application ✓"}
            </button>

        </div>
    </div>
);
}
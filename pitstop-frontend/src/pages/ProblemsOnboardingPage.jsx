import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import TopBar from "../components/TopBar";
import ProgressBar from "../components/ProgressBar";

const WHEELER_META = {
  TWO_WHEELER:      { label: "2-Wheeler",   icon: "🛵" },
  THREE_WHEELER:    { label: "3-Wheeler",   icon: "🛺" },
  FOUR_WHEELER:     { label: "4-Wheeler",   icon: "🚗" },
  SIX_PLUS_WHEELER: { label: "6-Wheeler+",  icon: "🚛" },
};

const PROBLEMS_BY_WHEELER = {
  TWO_WHEELER: [
    "BATTERY_DEAD", "ENGINE_OVERHEATING", "ENGINE_WONT_START", "ENGINE_NOISE",
    "OIL_LEAK", "FLAT_TYRE", "TYRE_BURST", "CHAIN_SNAPPED", "BRAKE_FAILURE",
    "BRAKE_NOISE", "CLUTCH_FAILURE", "SUSPENSION_DAMAGE", "HEADLIGHTS_NOT_WORKING",
    "ACCIDENT_DAMAGE", "VEHICLE_STUCK", "STRANGE_NOISE", "DONT_KNOW",
  ],
  THREE_WHEELER: [
    "BATTERY_DEAD", "ENGINE_OVERHEATING", "ENGINE_WONT_START", "ENGINE_NOISE",
    "OIL_LEAK", "FLAT_TYRE", "TYRE_BURST", "BRAKE_FAILURE", "BRAKE_NOISE",
    "CLUTCH_FAILURE", "SUSPENSION_DAMAGE", "HEADLIGHTS_NOT_WORKING",
    "ACCIDENT_DAMAGE", "VEHICLE_STUCK", "STRANGE_NOISE", "DONT_KNOW",
    "GEAR_STUCK", "STEERING_LOCKED",
  ],
  FOUR_WHEELER: [
    "BATTERY_DEAD", "ENGINE_OVERHEATING", "ENGINE_WONT_START", "ENGINE_NOISE",
    "OIL_LEAK", "FLAT_TYRE", "TYRE_BURST", "BRAKE_FAILURE", "BRAKE_NOISE",
    "CLUTCH_FAILURE", "SUSPENSION_DAMAGE", "HEADLIGHTS_NOT_WORKING",
    "ACCIDENT_DAMAGE", "VEHICLE_STUCK", "STRANGE_NOISE", "DONT_KNOW",
    "GEAR_STUCK", "STEERING_LOCKED", "WARNING_LIGHT",
  ],
  SIX_PLUS_WHEELER: [
    "BATTERY_DEAD", "ENGINE_OVERHEATING", "ENGINE_WONT_START", "ENGINE_NOISE",
    "OIL_LEAK", "FLAT_TYRE", "TYRE_BURST", "BRAKE_FAILURE", "BRAKE_NOISE",
    "CLUTCH_FAILURE", "SUSPENSION_DAMAGE", "HEADLIGHTS_NOT_WORKING",
    "ACCIDENT_DAMAGE", "VEHICLE_STUCK", "STRANGE_NOISE", "DONT_KNOW",
    "GEAR_STUCK", "STEERING_LOCKED", "WARNING_LIGHT",
  ],
};

const PROBLEM_LABELS = {
  BATTERY_DEAD:           "Battery dead",
  ENGINE_OVERHEATING:     "Engine overheating",
  ENGINE_WONT_START:      "Won't start",
  ENGINE_NOISE:           "Engine noise",
  OIL_LEAK:               "Oil leak",
  FLAT_TYRE:              "Flat tyre",
  TYRE_BURST:             "Tyre burst",
  CHAIN_SNAPPED:          "Chain snapped",
  BRAKE_FAILURE:          "Brake failure",
  BRAKE_NOISE:            "Brake noise",
  CLUTCH_FAILURE:         "Clutch failure",
  SUSPENSION_DAMAGE:      "Suspension",
  HEADLIGHTS_NOT_WORKING: "Headlights",
  ACCIDENT_DAMAGE:        "Accident damage",
  VEHICLE_STUCK:          "Vehicle stuck",
  STRANGE_NOISE:          "Strange noise",
  GEAR_STUCK:             "Gear stuck",
  STEERING_LOCKED:        "Steering locked",
  WARNING_LIGHT:          "Warning light",
  DONT_KNOW:              "Don't know",
};

export default function ProblemsOnboardingPage() {
  const navigate   = useNavigate();
  const location   = useLocation();

  const selectedWheelers = location.state?.selectedWheelers || [];

  const [selectedProblems, setSelectedProblems] = useState({});
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedWheelers.length === 0) navigate("/mechanic/onboarding/vehicles");
  }, []);

  if (selectedWheelers.length === 0) return null;

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
      [wheeler]: allSelected ? new Set() : new Set(all),
    }));
  };

  const validate = () => {
    for (const wheeler of selectedWheelers) {
      const problems = selectedProblems[wheeler];
      if (!problems || problems.size === 0)
        return `Select at least one problem for ${WHEELER_META[wheeler].label}.`;
    }
    return null;
  };

  const handleSubmit = async () => {
    setError("");
    const err = validate();
    if (err) { setError(err); return; }

    try {
      setLoading(true);
      await api.patch("/accounts/expertise", {
        expertise: selectedWheelers.map(wheeler => ({
          wheelerType: wheeler,
          problemTypes: Array.from(selectedProblems[wheeler]),
        })),
      });
      navigate("/mechanic/dashboard");
    } catch {
      setError("Failed to save expertise. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100dvh",
      background: "var(--bg)",
      display: "flex",
      flexDirection: "column",
      padding: "0 16px 32px",
      fontFamily: "'Inter', sans-serif",
    }}>
      <TopBar
        centerContent={
          <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500, letterSpacing: "0.5px" }}>
            Step 3 of 3
          </span>
        }
        showBack
        onBack={() => navigate("/mechanic/onboarding/vehicles", { state: { selectedWheelers } })}
      />

      <ProgressBar steps={3} current={3} />

      <div style={{ marginTop: 8, marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px", marginBottom: 4 }}>
          What problems can you fix?
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-3)" }}>Select all you're confident handling</p>
      </div>

      {/* Wheeler sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        {selectedWheelers.map(wheeler => {
          const problems = PROBLEMS_BY_WHEELER[wheeler];
          const sel = selectedProblems[wheeler] || new Set();
          const allSelected = problems.every(p => sel.has(p));
          const meta = WHEELER_META[wheeler];

          return (
            <div key={wheeler} style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: 14,
            }}>
              {/* Section header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{meta.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{meta.label}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: "var(--gold)",
                    background: "rgba(255,183,0,0.10)", border: "1px solid rgba(255,183,0,0.25)",
                    borderRadius: 9999, padding: "2px 8px",
                  }}>
                    {sel.size}/{problems.length}
                  </span>
                </div>
                <button
                  onClick={() => toggleAll(wheeler)}
                  style={{
                    background: "var(--surface3)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--text-3)",
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "4px 10px",
                    cursor: "pointer",
                    letterSpacing: "0.3px",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {allSelected ? "Deselect all" : "Select all"}
                </button>
              </div>

              {/* Problem chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {problems.map(problem => {
                  const checked = sel.has(problem);
                  return (
                    <button
                      key={problem}
                      onClick={() => toggleProblem(wheeler, problem)}
                      style={{
                        background: checked ? "rgba(230,57,70,0.10)" : "var(--surface2)",
                        border: `1px solid ${checked ? "rgba(230,57,70,0.30)" : "var(--border)"}`,
                        borderRadius: 9999,
                        padding: "6px 12px",
                        color: checked ? "var(--text)" : "var(--text-3)",
                        fontSize: 12,
                        fontWeight: checked ? 600 : 400,
                        cursor: "pointer",
                        fontFamily: "'Inter', sans-serif",
                        transition: "all 0.15s ease",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {PROBLEM_LABELS[problem] ?? problem}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "rgba(230,57,70,0.10)",
          border: "1px solid rgba(230,57,70,0.30)",
          borderRadius: 10,
          padding: "10px 13px",
          color: "var(--red)",
          fontSize: 13,
          marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="ps-btn"
        style={{
          borderRadius: 14,
          fontSize: 15,
          height: 52,
          opacity: loading ? 0.6 : 1,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Saving…" : "Complete registration →"}
      </button>
    </div>
  );
}

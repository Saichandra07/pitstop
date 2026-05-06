import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import OptionCard from "../components/OptionCard";
import ProgressBar from "../components/ProgressBar";

const WHEELERS = [
  { value: "TWO_WHEELER",      label: "2-Wheeler",   sublabel: "Bike, Scooter",     icon: "🛵" },
  { value: "THREE_WHEELER",    label: "3-Wheeler",   sublabel: "Auto, Tempo",       icon: "🛺" },
  { value: "FOUR_WHEELER",     label: "4-Wheeler",   sublabel: "Car, SUV, Van",     icon: "🚗" },
  { value: "SIX_PLUS_WHEELER", label: "6-Wheeler+",  sublabel: "Truck, Bus, Lorry", icon: "🚛" },
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
      state: { selectedWheelers: Array.from(selected) },
    });
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
            Step 2 of 3
          </span>
        }
        showBack
        onBack={() => navigate("/register/mechanic")}
      />

      <ProgressBar steps={3} current={2} />

      <div style={{ marginTop: 8, marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px", marginBottom: 4 }}>
          What vehicles do you service?
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-3)" }}>Select all that apply</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 32 }}>
        {WHEELERS.map(w => (
          <OptionCard
            key={w.value}
            icon={w.icon}
            label={w.label}
            sublabel={w.sublabel}
            selected={selected.has(w.value)}
            onClick={() => toggle(w.value)}
          />
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <button
        onClick={handleNext}
        disabled={selected.size === 0}
        className="ps-btn"
        style={{
          borderRadius: 14,
          fontSize: 15,
          height: 52,
          opacity: selected.size === 0 ? 0.4 : 1,
          cursor: selected.size === 0 ? "not-allowed" : "pointer",
        }}
      >
        Continue →
      </button>

      {selected.size === 0 && (
        <p style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", marginTop: 10 }}>
          Select at least one vehicle type to continue
        </p>
      )}
    </div>
  );
}

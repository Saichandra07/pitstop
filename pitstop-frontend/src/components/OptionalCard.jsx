// src/components/OptionCard.jsx

export default function OptionCard({ icon, label, sublabel, selected, onClick }) {
  return (
    <div
      className={`ps-option-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <span className="ps-option-icon">{icon}</span>
      <span className="ps-option-label">{label}</span>
      {sublabel && <span className="ps-option-sub">{sublabel}</span>}
    </div>
  );
}
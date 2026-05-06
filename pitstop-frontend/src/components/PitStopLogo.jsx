// src/components/PitStopLogo.jsx

const LightningBolt = ({ size = 24, color = '#E63946' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon
      points="13,2 3,14 12,14 11,22 21,10 12,10"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export default function PitStopLogo({ variant = 'topbar' }) {
  if (variant === 'auth') {
    return (
      <div className="ps-logo-auth">
        <div className="ps-logo-auth-icon">
          <LightningBolt size={28} />
        </div>
        <span className="ps-logo-auth-name">PitStop</span>
        <span className="ps-logo-auth-tag">Roadside help, instantly.</span>
      </div>
    );
  }

  // variant === 'topbar'
  return (
    <div className="ps-logo-topbar">
      <div className="ps-logo-topbar-icon">
        <LightningBolt size={14} />
      </div>
      <span className="ps-logo-topbar-name">PitStop</span>
    </div>
  );
}
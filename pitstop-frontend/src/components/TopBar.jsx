// src/components/TopBar.jsx

import PitStopLogo from './PitStopLogo';

export default function TopBar({ centerContent, rightContent, showBack, onBack }) {
  return (
    <div style={{ flexShrink: 0 }}>
      {/* Main bar row */}
      <div className="ps-topbar">
        <PitStopLogo variant="topbar" />

        {centerContent && (
          <div className="ps-topbar-center">{centerContent}</div>
        )}

        <div className="ps-topbar-right">
          {rightContent || <div style={{ width: 28 }} />}
        </div>
      </div>

      {/* Back button — renders below main bar when showBack is true */}
      {showBack && (
        <div style={{ paddingBottom: 10 }}>
          <button className="ps-back-btn" onClick={onBack} aria-label="Go back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#E63946" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
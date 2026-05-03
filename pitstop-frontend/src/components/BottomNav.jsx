import { useNavigate } from 'react-router-dom';

const SosIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <polygon points="12,3 22,21 2,21" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
    <path d="M12 10v5M12 17.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const TripsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M14 2v6h6M16 13H8M16 17H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const JobsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const HistoryIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M14 2v6h6M16 13H8M16 17H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ProfileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const USER_TABS = [
  { key: 'sos',     label: 'SOS',     path: '/dashboard',  icon: <SosIcon />     },
  { key: 'trips',   label: 'Trips',   path: '/history',    icon: <TripsIcon />   },
  { key: 'profile', label: 'Profile', path: '/profile',    icon: <ProfileIcon /> },
];

const MECHANIC_TABS = [
  { key: 'jobs',    label: 'Jobs',    path: '/mechanic/dashboard', icon: <JobsIcon />    },
  { key: 'history', label: 'History', path: '/mechanic/history',   icon: <HistoryIcon /> },
  { key: 'profile', label: 'Profile', path: '/mechanic/profile',   icon: <ProfileIcon /> },
];

export default function BottomNav({ role = 'user', active }) {
  const navigate = useNavigate();
  const tabs = role === 'mechanic' ? MECHANIC_TABS : USER_TABS;

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 56,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      background: 'var(--surface)', borderTop: '1px solid var(--border)',
      zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {tabs.map(tab => {
        const isActive = active === tab.key;
        return (
          <div
            key={tab.key}
            onClick={() => navigate(tab.path)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              color: isActive ? 'var(--red)' : 'var(--text-3)',
              cursor: 'pointer', padding: '4px 16px',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {tab.icon}
            <span style={{ fontSize: 10, fontWeight: 500 }}>{tab.label}</span>
          </div>
        );
      })}
    </nav>
  );
}
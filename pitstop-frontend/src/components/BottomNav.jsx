// src/components/BottomNav.jsx

import { useNavigate } from 'react-router-dom';

const USER_TABS = [
  { key: 'sos',     label: 'SOS',     path: '/sos' },
  { key: 'trips',   label: 'Trips',   path: '/history' },
  { key: 'profile', label: 'Profile', path: '/profile' },
];

const MECHANIC_TABS = [
  { key: 'jobs',    label: 'Jobs',    path: '/mechanic/dashboard' },
  { key: 'history', label: 'History', path: '/mechanic/history' },
  { key: 'profile', label: 'Profile', path: '/mechanic/profile' },
];

export default function BottomNav({ role = 'user', active }) {
  const navigate = useNavigate();
  const tabs = role === 'mechanic' ? MECHANIC_TABS : USER_TABS;

  return (
    <nav className="ps-bottom-nav">
      {tabs.map(tab => (
        <div
          key={tab.key}
          className={`ps-nav-item ${active === tab.key ? 'active' : ''}`}
          onClick={() => navigate(tab.path)}
        >
          <div className="ps-nav-dot" />
          <span className="ps-nav-label">{tab.label}</span>
        </div>
      ))}
    </nav>
  );
}
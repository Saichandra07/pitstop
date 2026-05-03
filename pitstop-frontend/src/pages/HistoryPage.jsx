import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';

const NAV_H = 56;

const VEHICLE_EMOJI = {
  TWO_WHEELER: '🛵', THREE_WHEELER: '🛺',
  FOUR_WHEELER: '🚗', SIX_PLUS_WHEELER: '🚛',
};
const PROBLEM_LABEL = {
  BATTERY_DEAD: 'Battery dead', ENGINE_OVERHEATING: 'Engine overheating',
  ENGINE_WONT_START: "Engine won't start", ENGINE_NOISE: 'Engine noise',
  OIL_LEAK: 'Oil leak', FLAT_TYRE: 'Flat tyre', TYRE_BURST: 'Tyre burst',
  CHAIN_SNAPPED: 'Chain snapped', BRAKE_FAILURE: 'Brake failure',
  BRAKE_NOISE: 'Brake noise', CLUTCH_FAILURE: 'Clutch failure',
  SUSPENSION_DAMAGE: 'Suspension damage', HEADLIGHTS_NOT_WORKING: 'Headlights not working',
  ACCIDENT_DAMAGE: 'Accident damage', VEHICLE_STUCK: 'Vehicle stuck',
  STRANGE_NOISE: 'Strange noise', DONT_KNOW: "Don't know — just come",
  GEAR_STUCK: 'Gear stuck', STEERING_LOCKED: 'Steering locked',
  WARNING_LIGHT: 'Warning light',
};

// Icon box color by status
function jobIconStyle(status) {
  if (status === 'COMPLETED') return { background: 'rgba(255,183,0,0.08)', border: '1px solid rgba(255,183,0,0.20)' };
  if (status === 'CANCELLED') return { background: 'rgba(144,144,168,0.08)', border: '1px solid var(--border)' };
  return { background: 'rgba(230,57,70,0.10)', border: '1px solid rgba(230,57,70,0.25)' }; // active
}

function groupByMonth(jobs) {
  const groups = {};
  jobs.forEach(job => {
    const key = new Date(job.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(job);
  });
  return groups;
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const SosNavIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <polygon points="12,3 22,21 2,21" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
    <path d="M12 10v5M12 17.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const TripsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
    <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ProfileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();
  const [jobs, setJobs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    axios.get('/jobs/my/history')
      .then(res => setJobs(res.data || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const activeJobs  = jobs.filter(j => ['PENDING','ACCEPTED','IN_PROGRESS'].includes(j.status));
  const doneJobs    = jobs.filter(j => ['COMPLETED','CANCELLED'].includes(j.status));
  const grouped     = groupByMonth(doneJobs);
  const initials    = user?.name?.charAt(0)?.toUpperCase() || 'U';

  // Month total for most recent month
  const firstMonthJobs = Object.values(grouped)[0] || [];
  const monthCompleted = firstMonthJobs.filter(j => j.status === 'COMPLETED').length;
  const firstMonthKey  = Object.keys(grouped)[0] || '';

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font)', paddingBottom: NAV_H + 16 }}>

      {/* ── TopBar ── */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px 16px 14px', borderBottom: '1px solid var(--border)' }}>
        {/* Logo */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 28, height: 28, background: 'rgba(230,57,70,0.15)', border: '1px solid var(--red-border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" stroke="var(--red)" strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: 0.2 }}>PitStop</span>
        </div>
        {/* Center */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Trips</span>
        </div>
        {/* Avatar */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <div onClick={() => setShowLogout(true)} style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>
            {initials}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}><div className="ps-spinner" /></div>
      ) : jobs.length === 0 ? (
        /* ── Empty state ── */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', gap: 10 }}>
          <span style={{ fontSize: 44 }}>🔧</span>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>No trips yet</p>
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>Your SOS history will appear here.</p>
          <button onClick={() => navigate('/dashboard')} className="ps-btn" style={{ marginTop: 16, width: 'auto', padding: '12px 28px', borderRadius: 9999 }}>
            Request help
          </button>
        </div>
      ) : (
        <div style={{ padding: '16px 16px 0' }}>

          {/* ── Active jobs ── */}
          {activeJobs.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Active</span>
                <span className="ps-tag ps-tag-live">Live</span>
              </div>
              {activeJobs.map(job => (
                <div key={job.id} onClick={() => navigate('/dashboard')} style={{ background: 'var(--surface2)', border: '1px solid var(--red-border)', borderRadius: 16, padding: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(230,57,70,0.10)', border: '1px solid rgba(230,57,70,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {VEHICLE_EMOJI[job.vehicleType]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{PROBLEM_LABEL[job.problemType] || job.problemType}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-3)' }}>{job.vehicleName} · {formatDate(job.createdAt)}</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gold)', flexShrink: 0 }}>
                    {job.status === 'IN_PROGRESS' ? 'In progress' : job.status === 'ACCEPTED' ? 'En route' : 'Searching...'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ── My Jobs heading ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>My Jobs</span>
            {firstMonthKey && (
              <span className="ps-tag ps-tag-dim">{firstMonthKey}</span>
            )}
          </div>

          {/* ── Job cards ── */}
          {doneJobs.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', paddingTop: 24 }}>No completed trips yet.</p>
          ) : (
            Object.entries(grouped).map(([month, monthJobs]) => (
              <div key={month} style={{ marginBottom: 20 }}>
                {Object.keys(grouped).length > 1 && (
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 500 }}>{month}</p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {monthJobs.map(job => {
  const done = job.status === 'COMPLETED';
  return (
    <div
      key={job.id}
      style={{
        background: 'var(--surface2)',
        border: `1px solid ${done ? 'var(--border)' : 'rgba(144,144,168,0.1)'}`,
        borderRadius: 16, padding: '13px 14px',
        display: 'flex', alignItems: 'center', gap: 12,
        opacity: done ? 1 : 0.55,
      }}
    >
      {/* Icon box */}
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        background: done ? 'rgba(255,183,0,0.08)' : 'rgba(144,144,168,0.06)',
        border: `1px solid ${done ? 'rgba(255,183,0,0.20)' : 'rgba(144,144,168,0.12)'}`,
      }}>
        {VEHICLE_EMOJI[job.vehicleType]}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: done ? 'var(--text)' : 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {PROBLEM_LABEL[job.problemType] || job.problemType}
        </p>
        <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-3)' }}>
          {job.vehicleName} · {formatDate(job.createdAt)}
        </p>
      </div>

      {/* Status badge */}
      <span className={`ps-tag ${done ? 'ps-tag-green' : 'ps-tag-dim'}`}>
        {done ? 'Done' : 'Cancelled'}
      </span>
    </div>
  );
})}
                </div>

                {/* Month total card — only for completed jobs */}
                {monthCompleted > 0 && month === firstMonthKey && (
                  <div style={{ background: 'var(--surface2)', border: '1px solid var(--gold-border)', borderRadius: 16, padding: 14, marginTop: 10, position: 'relative', overflow: 'hidden' }}>
                    {/* Gold top stripe */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--gold), var(--red))' }} />
                    <p style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, margin: '0 0 4px' }}>Month total</p>
                    <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--gold)', letterSpacing: '-0.5px', margin: 0 }}>{monthCompleted} jobs completed</p>
                    <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>in {month}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Bottom Nav ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: NAV_H, display: 'flex', justifyContent: 'space-around', alignItems: 'center', background: 'var(--surface)', borderTop: '1px solid var(--border)', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom,0px)' }}>
        {[
          { label: 'SOS',     icon: <SosNavIcon />,  path: '/dashboard' },
          { label: 'Trips',   icon: <TripsIcon />,   path: '/history'   },
          { label: 'Profile', icon: <ProfileIcon />, path: '/profile'   },
        ].map(({ label, icon, path }) => {
          const active = location.pathname === path;
          return (
            <div key={label} onClick={() => navigate(path)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: active ? 'var(--red)' : 'var(--text-3)', cursor: 'pointer', padding: '4px 16px' }}>
              {icon}
              <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* ── Logout sheet ── */}
      {showLogout && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <div onClick={() => setShowLogout(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
          <div className="ps-slide-up" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--surface)', borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', zIndex: 201 }}>
            <p style={{ color: 'var(--text)', fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Log out?</p>
            <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 24 }}>You'll need to sign in again to use PitStop.</p>
            <button onClick={handleLogout} className="ps-btn" style={{ marginBottom: 10 }}>Log out</button>
            <button onClick={() => setShowLogout(false)} className="ps-btn-ghost">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
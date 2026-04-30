import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';

const VEHICLE_EMOJI = {
  TWO_WHEELER: '🛵',
  THREE_WHEELER: '🛺',
  FOUR_WHEELER: '🚗',
  SIX_PLUS_WHEELER: '🚛',
};

const VEHICLE_LABEL = {
  TWO_WHEELER: '2-Wheeler',
  THREE_WHEELER: '3-Wheeler',
  FOUR_WHEELER: '4-Wheeler',
  SIX_PLUS_WHEELER: '6+ Wheeler',
};

const PROBLEM_LABEL = {
  BATTERY_DEAD: 'Battery dead',
  ENGINE_OVERHEATING: 'Engine overheating',
  ENGINE_WONT_START: "Engine won't start",
  ENGINE_NOISE: 'Engine noise',
  OIL_LEAK: 'Oil leak',
  FLAT_TYRE: 'Flat tyre',
  TYRE_BURST: 'Tyre burst',
  CHAIN_SNAPPED: 'Chain snapped',
  BRAKE_FAILURE: 'Brake failure',
  BRAKE_NOISE: 'Brake noise',
  CLUTCH_FAILURE: 'Clutch failure',
  SUSPENSION_DAMAGE: 'Suspension damage',
  HEADLIGHTS_NOT_WORKING: 'Headlights not working',
  ACCIDENT_DAMAGE: 'Accident damage',
  VEHICLE_STUCK: 'Vehicle stuck',
  STRANGE_NOISE: 'Strange noise',
  DONT_KNOW: "Don't know — just come",
  GEAR_STUCK: 'Gear stuck',
  STEERING_LOCKED: 'Steering locked',
  WARNING_LIGHT: 'Warning light',
};

const STATUS_COLOR = {
  COMPLETED: '#61cd96',
  CANCELLED: '#E63946',
  IN_PROGRESS: '#FAC775',
  ACCEPTED: '#FAC775',
  PENDING: '#888',
};

const MOCK_JOBS = [
  {
    id: 'mock-1',
    vehicleType: 'TWO_WHEELER',
    problemType: 'FLAT_TYRE',
    vehicleName: 'Honda Activa',
    status: 'IN_PROGRESS',
    address: 'Kondapur, Hyderabad',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mock-2',
    vehicleType: 'FOUR_WHEELER',
    problemType: 'BATTERY_DEAD',
    vehicleName: 'Swift Dzire',
    status: 'COMPLETED',
    address: 'Banjara Hills, Hyderabad',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'mock-3',
    vehicleType: 'TWO_WHEELER',
    problemType: 'ENGINE_WONT_START',
    vehicleName: 'Royal Enfield',
    status: 'CANCELLED',
    address: 'Madhapur, Hyderabad',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
];

function groupByMonth(jobs) {
  const groups = {};
  jobs.forEach(job => {
    const d = new Date(job.createdAt);
    const key = d.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(job);
  });
  return groups;
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogoutSheet, setShowLogoutSheet] = useState(false);
  const handleLogout = () => { logout(); navigate('/login'); };

  useEffect(() => {
    axios.get('/jobs/my/history')
      .then(res => setJobs(res.data || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const activeJob = jobs.find(j => ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(j.status));
  const historyJobs = jobs.filter(j => ['COMPLETED', 'CANCELLED'].includes(j.status));
  const grouped = groupByMonth(historyJobs);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#141414',
      color: '#fff',
      fontFamily: "'Inter', sans-serif",
      paddingBottom: 96,
    }}>
      {/* Topbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px 20px 12px',
        borderBottom: '1px solid #222',
      }}>
        {/* Left — fixed width */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            backgroundColor: '#E63946',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 14 }}>⚡</span>
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>PitStop</span>
        </div>

        {/* Center — equal flex so it's always truly centered */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Trips</span>
        </div>

        {/* Right — fixed width, right-aligned */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <div
            onClick={() => setShowLogoutSheet(true)}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              backgroundColor: '#E63946',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#555' }}>Loading...</div>
      ) : jobs.length === 0 ? (
        /* Empty state */
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 12,
          color: '#555',
        }}>
          <span style={{ fontSize: 48 }}>🔧</span>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#777', margin: 0 }}>No trips yet</p>
          <p style={{ fontSize: 13, color: '#444', margin: 0 }}>Your SOS history will show up here.</p>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              marginTop: 12,
              padding: '12px 28px',
              backgroundColor: '#E63946',
              color: '#fff',
              border: 'none',
              borderRadius: 24,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Go home
          </button>
        </div>
      ) : (
        <div style={{ padding: '16px 16px 0' }}>

          {/* Active Job Card */}
          {activeJob && (
            <div style={{ marginBottom: 24 }}>
              <p style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.2,
                color: '#FAC775',
                textTransform: 'uppercase',
                marginBottom: 10,
                textAlign: 'left', // FIX 2
              }}>
                In progress
              </p>
              <div style={{
                backgroundColor: '#1a1a1a',
                borderRadius: 16,
                padding: '16px',
                border: '1px solid #2a2a2a',
              }}>
                {/* Origin row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#E63946' }} />
                    <div style={{ width: 2, backgroundColor: '#333', minHeight: 32, flex: 1, margin: '4px 0' }} />{/* FIX 3 */}
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#61cd96' }} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 56 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff' }}>
                        {activeJob.vehicleName}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#555' }}>
                        {activeJob.address || 'Your location'}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: STATUS_COLOR[activeJob.status] }}>
                        {activeJob.status.replace('_', ' ')}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#555' }}>
                        {PROBLEM_LABEL[activeJob.problemType] || activeJob.problemType}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: 28 }}>{VEHICLE_EMOJI[activeJob.vehicleType]}</span>
                </div>
              </div>
            </div>
          )}

          {/* History Section */}
          {Object.keys(grouped).length > 0 && (
            <div>
              <p style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.2,
                color: '#888',
                textTransform: 'uppercase',
                marginBottom: 10,
                textAlign: 'left', // FIX 4
              }}>
                History
              </p>
              {Object.entries(grouped).map(([month, monthJobs]) => (
                <div key={month} style={{ marginBottom: 16 }}>
                  {/* Month label */}
                  <p style={{
                    fontSize: 12,
                    color: '#666', // FIX 5
                    marginBottom: 6,
                    textAlign: 'left',
                  }}>{month}</p>

                  <div style={{
                    backgroundColor: '#1a1a1a',
                    borderRadius: 14,
                    border: '1px solid #222',
                    overflow: 'hidden',
                  }}>
                    {monthJobs.map((job, idx) => (
                      <div
                        key={job.id}
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '14px 16px',
                          borderBottom: idx < monthJobs.length - 1 ? '1px solid #222' : 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {/* Vehicle emoji circle */}
                        <div style={{
                          width: 42,
                          height: 42,
                          borderRadius: '50%',
                          backgroundColor: '#242424',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 20,
                          flexShrink: 0,
                        }}>
                          {VEHICLE_EMOJI[job.vehicleType]}
                        </div>

                        {/* Job info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            margin: 0,
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#fff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {PROBLEM_LABEL[job.problemType] || job.problemType}
                          </p>
                          <p style={{
                            margin: '2px 0 0',
                            fontSize: 12,
                            color: '#555', // FIX 6
                          }}>
                            {job.vehicleName}
                          </p>
                        </div>

                        {/* Status + chevron */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: STATUS_COLOR[job.status] || '#888',
                          }}>
                            {job.status === 'COMPLETED' ? 'Done' : 'Cancelled'}
                          </span>
                          <span style={{ color: '#444', fontSize: 16 }}>›</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom Nav */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        height: 64,
        backgroundColor: '#141414',
        borderTop: '1px solid #222',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 100,
      }}>
        {[
          {
            label: 'SOS',
            path: '/dashboard',
            icon: (active) => (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#E63946' : '#555'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            ),
          },
          {
            label: 'Trips',
            path: '/history',
            icon: (active) => (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#E63946' : '#555'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            ),
          },
          {
            label: 'Profile',
            path: '/profile',
            icon: (active) => (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#E63946' : '#555'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            ),
          },
        ].map(item => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              style={{
                background: 'none', border: 'none',
                color: active ? '#E63946' : '#555',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3,
                cursor: 'pointer', padding: '4px 20px',
              }}
            >
              {item.icon(active)}
              <span style={{ fontSize: 11, color: active ? '#E63946' : '#555' }}>{item.label}</span>
            </button>
          );
        })}
      </div>
      {showLogoutSheet && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
        <div onClick={() => setShowLogoutSheet(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#1a1a1a', borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', zIndex: 201 }}>
          <p style={{ color: '#fff', fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Log out?</p>
          <p style={{ color: '#555', fontSize: 13, marginBottom: 24 }}>You'll need to sign in again to use PitStop.</p>
          <button onClick={handleLogout} style={{ width: '100%', height: 48, borderRadius: 12, background: '#E63946', border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}>Log out</button>
          <button onClick={() => setShowLogoutSheet(false)} style={{ width: '100%', height: 48, borderRadius: 12, background: 'transparent', border: '0.5px solid #2a2a2a', color: '#555', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
)}
    </div>
  );
}
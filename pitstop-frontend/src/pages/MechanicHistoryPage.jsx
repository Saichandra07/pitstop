import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActiveJob } from '../context/ActiveJobContext';
import api from '../api/axios';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import Avatar from '../components/Avatar';
import JobCard from '../components/JobCard';
import BottomSheet from '../components/BottomSheet';
import BroadcastOverlay from '../components/BroadcastOverlay';

const NAV_H = 56;

const PROBLEM_LABELS = {
  BATTERY_DEAD: 'Battery dead', ENGINE_OVERHEATING: 'Engine overheating',
  ENGINE_WONT_START: "Engine won't start", FLAT_TYRE: 'Flat tyre / puncture',
  TYRE_BURST: 'Tyre burst', CHAIN_SNAPPED: 'Chain snapped',
  BRAKE_FAILURE: 'Brake failure', OIL_LEAK: 'Oil leak',
  VEHICLE_STUCK: 'Vehicle stuck', DONT_KNOW: "Don't know — just come",
};

function groupByMonth(jobs) {
  const groups = {};
  jobs.forEach(job => {
    const key = new Date(job.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(job);
  });
  return groups;
}

export default function MechanicHistoryPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { activeJob } = useActiveJob();

  const [jobs, setJobs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    api.get('/jobs/mechanic/history')
      .then(res => setJobs(res.data || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const grouped           = groupByMonth(jobs);
  const monthKeys         = Object.keys(grouped);
  const totalDone         = jobs.length;
  const currentMonthKey   = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const currentMonthCount = (grouped[currentMonthKey] || []).length;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font)', paddingBottom: activeJob ? 128 : NAV_H + 16 }}>

      {/* ── TopBar ── */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '0 16px' }}>
        <TopBar
          centerContent={<span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>History</span>}
          rightContent={
            <Avatar
              name={user?.name || 'M'}
              size="sm"
              variant="gold"
              onClick={() => setShowLogout(true)}
            />
          }
        />
      </div>

      {loading ? (
        <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
          <div className="ps-spinner" />
        </div>

      ) : jobs.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', gap: 10 }}>
          <span style={{ fontSize: 44 }}>🔧</span>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>No jobs completed yet</p>
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>Jobs you complete will appear here.</p>
          <button onClick={() => navigate('/mechanic/dashboard')} className="ps-btn" style={{ marginTop: 16, width: 'auto', padding: '12px 28px', borderRadius: 9999 }}>
            Go online
          </button>
        </div>

      ) : (
        <div style={{ padding: '16px 16px 0' }}>

          {/* ── Top stat tiles ── */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            {currentMonthCount > 0 && (
              <div style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold)' }}>{currentMonthCount}</div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-3)', marginTop: 4 }}>This Month</div>
              </div>
            )}
            <div style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{totalDone}</div>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-3)', marginTop: 4 }}>All Time</div>
            </div>
          </div>

          {/* ── Grouped job cards ── */}
          {monthKeys.map((month) => {
            const monthJobs = grouped[month];
            return (
              <div key={month} style={{ marginBottom: 24 }}>

                {/* Month label */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{month}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{monthJobs.length} job{monthJobs.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Job cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {monthJobs.map(job => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BottomNav role="mechanic" active="history" />

      {/* ── Global broadcast overlay ── */}
      <BroadcastOverlay onAcceptSuccess={() => navigate('/mechanic/dashboard')} />

      {/* ── Logout sheet ── */}
      <BottomSheet isOpen={showLogout} onClose={() => setShowLogout(false)} title="Log out?">
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>
          You'll need to sign in again to use PitStop.
        </p>
        <button onClick={handleLogout} className="ps-btn" style={{ marginBottom: 10 }}>Log out</button>
        <button onClick={() => setShowLogout(false)} className="ps-btn-ghost">Cancel</button>
      </BottomSheet>
    </div>
  );
}

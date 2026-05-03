import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import Avatar from '../components/Avatar';
import JobCard from '../components/JobCard';
import BottomSheet from '../components/BottomSheet';

const NAV_H = 56;

function groupByMonth(jobs) {
  const groups = {};
  jobs.forEach(job => {
    const key = new Date(job.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(job);
  });
  return groups;
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [jobs, setJobs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    axios.get('/jobs/my/history')
      .then(res => setJobs(res.data || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const activeJobs = jobs.filter(j => ['PENDING','ACCEPTED','IN_PROGRESS'].includes(j.status));
  const doneJobs   = jobs.filter(j => ['COMPLETED','CANCELLED'].includes(j.status));
  const grouped    = groupByMonth(doneJobs);

  const firstMonthKey  = Object.keys(grouped)[0] || '';
  const firstMonthJobs = grouped[firstMonthKey] || [];
  const monthCompleted = firstMonthJobs.filter(j => j.status === 'COMPLETED').length;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font)', paddingBottom: NAV_H + 16 }}>

      {/* ── TopBar ── */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '0 16px' }}>
        <TopBar
          centerContent={<span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Trips</span>}
          rightContent={
            <Avatar
              name={user?.name || 'U'}
              size="sm"
              variant="red"
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
                <span style={{ fontSize: 16, fontWeight: 700 }}>Active</span>
                <span className="ps-tag ps-tag-live">Live</span>
              </div>
              {activeJobs.map(job => (
                <JobCard key={job.id} job={job} onClick={() => navigate('/dashboard')} />
              ))}
            </div>
          )}

          {/* ── My Jobs heading ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>My Jobs</span>
            {firstMonthKey && <span className="ps-tag ps-tag-dim">{firstMonthKey}</span>}
          </div>

          {/* ── Job cards grouped by month ── */}
          {doneJobs.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', paddingTop: 24 }}>
              No completed trips yet.
            </p>
          ) : (
            Object.entries(grouped).map(([month, monthJobs]) => (
              <div key={month} style={{ marginBottom: 20 }}>
                {Object.keys(grouped).length > 1 && (
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 500 }}>{month}</p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {monthJobs.map(job => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>

                {/* Month total */}
                {monthCompleted > 0 && month === firstMonthKey && (
                  <div className="ps-earnings-card" style={{ marginTop: 10 }}>
                    <p className="ps-earnings-label">Month total</p>
                    <p className="ps-earnings-amount">
                      {monthCompleted} <span style={{ fontSize: 14, fontWeight: 600 }}>jobs</span>
                    </p>
                    <p className="ps-earnings-meta">{monthCompleted} completed · {month}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Bottom Nav ── */}
      <BottomNav role="user" active="trips" />

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
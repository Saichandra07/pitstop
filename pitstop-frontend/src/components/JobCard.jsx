// src/components/JobCard.jsx

import Badge from './Badge';

const PROBLEM_EMOJI = {
  FLAT_TYRE:            { icon: '🛞', color: 'gold' },
  TYRE_BURST:           { icon: '🛞', color: 'red'  },
  BATTERY_DEAD:         { icon: '🔋', color: 'gold' },
  ENGINE_WONT_START:    { icon: '🔧', color: 'red'  },
  ENGINE_NOISE:         { icon: '🔧', color: 'gold' },
  ENGINE_OVERHEATING:   { icon: '🌡️', color: 'red'  },
  OIL_LEAK:             { icon: '🛢️', color: 'gold' },
  CHAIN_SNAPPED:        { icon: '⛓️', color: 'red'  },
  BRAKE_FAILURE:        { icon: '🛑', color: 'red'  },
  BRAKE_NOISE:          { icon: '🛑', color: 'gold' },
  CLUTCH_FAILURE:       { icon: '⚙️', color: 'gold' },
  SUSPENSION_DAMAGE:    { icon: '🔩', color: 'gold' },
  HEADLIGHTS_NOT_WORKING:{ icon: '💡', color: 'gold' },
  ACCIDENT_DAMAGE:      { icon: '🚗', color: 'red'  },
  VEHICLE_STUCK:        { icon: '🆘', color: 'red'  },
  STRANGE_NOISE:        { icon: '❓', color: 'gold' },
  DONT_KNOW:            { icon: '❓', color: 'muted'},
  GEAR_STUCK:           { icon: '⚙️', color: 'gold' },
  STEERING_LOCKED:      { icon: '🔧', color: 'red'  },
  WARNING_LIGHT:        { icon: '⚠️', color: 'gold' },
};

const STATUS_BADGE = {
  PENDING:     'gold',
  ACCEPTED:    'gold',
  IN_PROGRESS: 'gold',
  COMPLETED:   'green',
  CANCELLED:   'dim',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function JobCard({ job, onClick }) {
  const { icon, color } = PROBLEM_EMOJI[job.problemType] ?? { icon: '🔧', color: 'muted' };
  const badgeVariant = STATUS_BADGE[job.status] ?? 'dim';
  const statusLabel = job.status?.replace('_', ' ') ?? '';

  return (
    <div
      className="ps-card"
      style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      {/* Icon box */}
      <div className={`ps-job-icon ps-job-icon-${color}`}>
        {icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {job.vehicleName}
          </p>
          <Badge variant={badgeVariant}>{statusLabel}</Badge>
        </div>
        <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>
          {icon} {job.problemType?.replace(/_/g, ' ')} · {formatDate(job.createdAt)}
        </p>
      </div>
    </div>
  );
}
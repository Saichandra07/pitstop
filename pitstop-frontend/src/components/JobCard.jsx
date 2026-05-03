import Badge from './Badge';

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

const VEHICLE_EMOJI = {
  TWO_WHEELER: '🛵', THREE_WHEELER: '🛺',
  FOUR_WHEELER: '🚗', SIX_PLUS_WHEELER: '🚛',
};

const STATUS_BADGE = {
  PENDING:     'gold',
  ACCEPTED:    'gold',
  IN_PROGRESS: 'gold',
  COMPLETED:   'green',
  CANCELLED:   'red',
};

const STATUS_LABEL = {
  PENDING:     'Searching',
  ACCEPTED:    'En route',
  IN_PROGRESS: 'In progress',
  COMPLETED:   'Done',
  CANCELLED:   'Cancelled',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function JobCard({ job, onClick }) {
  const done       = job.status === 'COMPLETED';
  const cancelled  = job.status === 'CANCELLED';
  const badgeVariant = STATUS_BADGE[job.status] ?? 'dim';

  // Icon box color
  const iconBg     = done      ? 'rgba(255,183,0,0.10)'  : cancelled ? 'rgba(230,57,70,0.10)'  : 'rgba(255,183,0,0.10)';
  const iconBorder = done      ? 'rgba(255,183,0,0.30)'  : cancelled ? 'rgba(230,57,70,0.30)'  : 'rgba(255,183,0,0.25)';
  const cardBorder = done      ? 'rgba(255,183,0,0.20)'  : cancelled ? 'rgba(230,57,70,0.25)'  : 'rgba(255,183,0,0.20)';

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface2)',
        border: `1.5px solid ${cardBorder}`,
        borderRadius: 16,
        padding: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* Icon box — big, left anchor */}
      <div style={{
        width: 52, height: 52,
        borderRadius: 14, flexShrink: 0,
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 26,
        background: iconBg,
        border: `1.5px solid ${iconBorder}`,
        boxShadow: `0 0 12px ${iconBg}`,
      }}>
        {VEHICLE_EMOJI[job.vehicleType] || '🚗'}
      </div>

      {/* Info — all left aligned */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Problem — primary, always bright */}
        <p style={{
          margin: 0, fontSize: 14, fontWeight: 700,
          color: 'var(--text)', letterSpacing: '-0.2px',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {PROBLEM_LABEL[job.problemType] || job.problemType}
        </p>
        {/* Vehicle name — secondary */}
        <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-2)', fontWeight: 500 }}>
          {job.vehicleName}
        </p>
        {/* Date — muted */}
        <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--text-3)' }}>
          {formatDate(job.createdAt)}
        </p>
      </div>

      {/* Badge — right */}
      <Badge variant={badgeVariant}>
        {STATUS_LABEL[job.status] || job.status}
      </Badge>
    </div>
  );
}
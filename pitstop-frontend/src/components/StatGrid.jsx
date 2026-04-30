// src/components/StatGrid.jsx

export default function StatGrid({ stats = [] }) {
  return (
    <div className="ps-stat-grid">
      {stats.map((stat, i) => (
        <div key={i} className="ps-stat">
          <div className={`ps-stat-value ${stat.color ?? ''}`}>
            {stat.value}
          </div>
          <div className="ps-stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
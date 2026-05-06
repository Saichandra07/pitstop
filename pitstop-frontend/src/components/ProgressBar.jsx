// src/components/ProgressBar.jsx
export default function ProgressBar({ steps, current }) {
  const pct = Math.round((current / steps) * 100);
  return (
    <div style={{
      height: 3,
      background: 'var(--surface3)',
      borderRadius: 4,
      overflow: 'hidden',
      marginTop: 4,
      marginBottom: 16,
    }}>
      <div style={{
        width: `${pct}%`,
        height: '100%',
        background: 'linear-gradient(90deg, var(--red), var(--gold))',
        borderRadius: 4,
        transition: 'width 0.3s ease',
      }} />
    </div>
  );
}

// src/components/ProgressBar.jsx
export default function ProgressBar({ steps, current }) {
  return (
    <div style={{
      display: 'flex',
      gap: '4px',
      height: '3px',
    }}>
      {Array.from({ length: steps }, (_, i) => {
        const stepNum = i + 1;
        let background;

        if (stepNum < current) {
          // Done
          background = 'var(--green)';
        } else if (stepNum === current) {
          // Active
          background = 'linear-gradient(90deg, var(--red), var(--gold))';
        } else {
          // Upcoming
          background = 'var(--surface3)';
        }

        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: '100%',
              borderRadius: '4px',
              background,
            }}
          />
        );
      })}
    </div>
  );
}
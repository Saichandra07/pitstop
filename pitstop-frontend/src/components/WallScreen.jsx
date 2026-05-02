// src/components/WallScreen.jsx
import Badge from './Badge';

export default function WallScreen({ icon, title, subtitle, badge, children }) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      textAlign: 'center',
      gap: '0',
    }}>
      {/* Icon */}
      <div style={{
        width: '72px',
        height: '72px',
        borderRadius: '20px',
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '32px',
        marginBottom: '20px',
      }}>
        {icon}
      </div>

      {/* Badge (optional) */}
      {badge && (
        <div style={{ marginBottom: '14px' }}>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
      )}

      {/* Title */}
      <p style={{
        fontSize: '20px',
        fontWeight: '800',
        color: 'var(--text)',
        letterSpacing: '-0.3px',
        marginBottom: '10px',
      }}>
        {title}
      </p>

      {/* Subtitle */}
      <p style={{
        fontSize: '13px',
        color: 'var(--text-2)',
        lineHeight: '1.6',
        maxWidth: '300px',
        marginBottom: '32px',
      }}>
        {subtitle}
      </p>

      {/* Action buttons (passed as children) */}
      <div style={{
        width: '100%',
        maxWidth: '320px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {children}
      </div>
    </div>
  );
}
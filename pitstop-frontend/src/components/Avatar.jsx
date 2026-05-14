export default function Avatar({ name = '?', size = 'md', variant = 'muted', src, onClick }) {
  const baseStyle = { cursor: onClick ? 'pointer' : 'default' };

  if (src) {
    return (
      <div
        className={`ps-avatar ps-avatar-${size} ps-avatar-${variant}`}
        onClick={onClick}
        style={{ ...baseStyle, overflow: 'hidden', padding: 0 }}
      >
        <img
          src={src}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
        />
      </div>
    );
  }

  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <div className={`ps-avatar ps-avatar-${size} ps-avatar-${variant}`} onClick={onClick} style={baseStyle}>
      {initial}
    </div>
  );
}

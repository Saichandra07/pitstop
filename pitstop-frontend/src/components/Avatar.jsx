// src/components/Avatar.jsx

export default function Avatar({ name = '?', size = 'md', variant = 'muted', onClick }) {
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <div className={`ps-avatar ps-avatar-${size} ps-avatar-${variant}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      {initial}
    </div>
  );
}
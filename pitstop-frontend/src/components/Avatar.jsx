// src/components/Avatar.jsx

export default function Avatar({ name = '?', size = 'md', variant = 'muted' }) {
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <div className={`ps-avatar ps-avatar-${size} ps-avatar-${variant}`}>
      {initial}
    </div>
  );
}
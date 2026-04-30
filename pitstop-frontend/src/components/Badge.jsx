// src/components/Badge.jsx

const VARIANT_CLASS = {
  red:   'ps-tag-red',
  gold:  'ps-tag-gold',
  green: 'ps-tag-green',
  dim:   'ps-tag-dim',
  live:  'ps-tag-live',
};

export default function Badge({ variant = 'dim', children }) {
  const cls = VARIANT_CLASS[variant] ?? 'ps-tag-dim';
  return (
    <span className={`ps-tag ${cls}`}>{children}</span>
  );
}
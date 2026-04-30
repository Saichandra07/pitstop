// src/components/BottomSheet.jsx

export default function BottomSheet({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 200,
        }}
      />

      {/* Sheet */}
      <div
        className="ps-slide-up"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--surface)',
          borderRadius: '20px 20px 0 0',
          border: '1px solid var(--border)',
          borderBottom: 'none',
          padding: '0 16px 32px',
          zIndex: 201,
          maxHeight: '80dvh',
          overflowY: 'auto',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{
            width: 36,
            height: 4,
            borderRadius: 9999,
            background: 'var(--surface3)',
          }} />
        </div>

        {/* Title */}
        {title && (
          <p style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: 14,
            letterSpacing: '-0.3px',
          }}>
            {title}
          </p>
        )}

        {children}
      </div>
    </>
  );
}
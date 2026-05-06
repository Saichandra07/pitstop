import { useState, useRef } from 'react';

const DISMISS_THRESHOLD = 80; // px dragged down to trigger close

export default function BottomSheet({ isOpen, onClose, title, children }) {
  const [dragY, setDragY]       = useState(0);
  const startYRef               = useRef(null);
  const isDraggingRef           = useRef(false);

  if (!isOpen) return null;

  function onTouchStart(e) {
    e.stopPropagation();
    startYRef.current   = e.touches[0].clientY;
    isDraggingRef.current = true;
    setDragY(0);
  }

  function onTouchMove(e) {
    e.stopPropagation();
    if (!isDraggingRef.current || startYRef.current === null) return;
    const delta = e.touches[0].clientY - startYRef.current;
    // Only allow dragging downward
    setDragY(Math.max(0, delta));
  }

  function onTouchEnd(e) {
    e.stopPropagation();
    isDraggingRef.current = false;
    if (dragY >= DISMISS_THRESHOLD) {
      setDragY(0);
      onClose();
    } else {
      setDragY(0);
    }
    startYRef.current = null;
  }

  const dragging = dragY > 0;

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
          opacity: dragging ? Math.max(0.2, 1 - dragY / 200) : 1,
          transition: dragging ? 'none' : 'opacity 0.25s',
        }}
      />

      {/* Sheet */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
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
          overflowY: dragY > 0 ? 'hidden' : 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          transform: `translateY(${dragY}px)`,
          transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
          willChange: 'transform',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px', cursor: 'grab' }}>
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

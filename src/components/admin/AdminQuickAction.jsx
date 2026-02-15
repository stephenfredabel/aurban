import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';

/* ════════════════════════════════════════════════════════════
   ADMIN QUICK-ACTION FAB — Draggable floating button

   • Fixed position, draggable via pointer events (touch + mouse)
   • Persists position in sessionStorage
   • Click (no drag) toggles AdminMessagingPanel
   • Shows unread count badge with pulse animation
   • Rendered inside ProviderAppLayout for admin users only
════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'aurban_admin_fab_pos';
const BTN_SIZE = 56; // w-14 = 56px
const DRAG_THRESHOLD = 4; // px movement before considered a drag

export default function AdminQuickAction({ unreadCount = 0, onClick }) {
  /* ── Position state ─────────────────────────────────────── */
  const [pos, setPos] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0, moved: false });
  const btnRef = useRef(null);

  /* ── Persist position ───────────────────────────────────── */
  useEffect(() => {
    if (pos) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  }, [pos]);

  /* ── Pointer handlers (drag) ────────────────────────────── */
  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: rect.left,
      startPosY: rect.top,
      moved: false,
    };
    setDragging(true);
    btnRef.current?.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      dragRef.current.moved = true;
    }
    const newX = Math.max(0, Math.min(window.innerWidth - BTN_SIZE, dragRef.current.startPosX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - BTN_SIZE, dragRef.current.startPosY + dy));
    setPos({ x: newX, y: newY });
  }, [dragging]);

  const handlePointerUp = useCallback((e) => {
    setDragging(false);
    btnRef.current?.releasePointerCapture(e.pointerId);
    // Fire click only if pointer wasn't dragged
    if (!dragRef.current.moved) onClick?.();
  }, [onClick]);

  /* ── Style ──────────────────────────────────────────────── */
  const style = pos
    ? { position: 'fixed', left: pos.x, top: pos.y, zIndex: 200 }
    : { position: 'fixed', bottom: 24, right: 16, zIndex: 200 };

  return (
    <button
      ref={btnRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={style}
      className={`flex items-center justify-center w-14 h-14 rounded-full
        bg-brand-gold text-white shadow-lg shadow-brand-gold/25
        hover:bg-brand-gold-dark transition-shadow touch-none select-none
        ${unreadCount > 0 ? 'animate-pulse' : ''}
        ${dragging ? 'cursor-grabbing scale-110 shadow-2xl' : 'cursor-grab'}`}
      aria-label="Open admin messaging"
    >
      <MessageSquare size={22} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center
          min-w-[20px] h-5 px-1 bg-red-500 rounded-full text-[10px] font-bold text-white
          ring-2 ring-white dark:ring-gray-900 pointer-events-none">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}

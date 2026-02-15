import { Shield, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { normalizeRole, ROLE_LABELS } from '../../utils/rbac.js';

/* ════════════════════════════════════════════════════════════
   ADMIN FOOTER — Minimal security-focused footer bar

   Desktop only (hidden on mobile — bottom nav takes over).
   Shows: Role identity · Security notice · Platform version.
   No marketplace links, no provider CTA, no company info.
════════════════════════════════════════════════════════════ */

export default function AdminFooter() {
  const { user } = useAuth();
  const role      = normalizeRole(user?.role);
  const roleLabel = ROLE_LABELS[role] || 'Admin';

  return (
    <footer className="hidden md:block bg-gray-900 border-t border-white/5">
      <div className="flex items-center justify-between px-4 py-3 mx-auto sm:px-6 max-w-7xl">

        {/* Left: Role identity */}
        <div className="flex items-center gap-2 text-gray-500">
          <Shield size={12} className="text-brand-gold/60" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">
            {roleLabel}
          </span>
        </div>

        {/* Center: Security notice */}
        <div className="flex items-center gap-1.5 text-gray-600">
          <Lock size={10} />
          <span className="text-[10px]">
            All actions are monitored and logged
          </span>
        </div>

        {/* Right: Platform version */}
        <span className="text-[10px] text-gray-600">
          Aurban Admin v1.0
        </span>
      </div>
    </footer>
  );
}

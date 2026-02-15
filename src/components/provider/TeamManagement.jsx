import { useState } from 'react';
import {
  Users, UserPlus, Mail, Shield, Trash2, Info,
  ChevronDown, ChevronUp,
} from 'lucide-react';

/* ════════════════════════════════════════════════════════════
   TEAM MANAGEMENT — Company provider team panel

   Phase 1:  Up to 3 team members per company account.
   Roles:    owner · manager · agent
   State:    Local mock data (will connect to API later).
════════════════════════════════════════════════════════════ */

const MAX_TEAM_SIZE = 3;

const MOCK_TEAM = [
  { id: 'tm1', name: 'Adebayo Johnson', email: 'adebayo@veritasi.com', role: 'owner',   status: 'active',  joinedAt: '2024-01-15', avatar: null },
  { id: 'tm2', name: 'Ngozi Okafor',    email: 'ngozi@veritasi.com',   role: 'manager', status: 'active',  joinedAt: '2024-06-20', avatar: null },
];

const ROLE_STYLES = {
  owner:   'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  manager: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  agent:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
};

const STATUS_DOT = {
  active:  'bg-emerald-400',
  invited: 'bg-yellow-400',
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TeamManagement() {
  const [team, setTeam]             = useState(MOCK_TEAM);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole]   = useState('agent');

  const isAtCapacity = team.length >= MAX_TEAM_SIZE;

  /* ── Handlers ─────────────────────────────────────────── */
  const handleRemove = (id) => {
    setTeam((prev) => prev.filter((m) => m.id !== id));
  };

  const handleInvite = () => {
    if (!inviteEmail.trim() || isAtCapacity) return;
    const newMember = {
      id:       `tm${Date.now()}`,
      name:     inviteEmail.split('@')[0],
      email:    inviteEmail.trim(),
      role:     inviteRole,
      status:   'invited',
      joinedAt: new Date().toISOString().slice(0, 10),
      avatar:   null,
    };
    setTeam((prev) => [...prev, newMember]);
    setInviteEmail('');
    setInviteRole('agent');
    setShowInvite(false);
  };

  return (
    <div className="space-y-6">

      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-gold/10">
            <Users size={20} className="text-brand-gold" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-display text-brand-charcoal-dark dark:text-white">
              Team Management
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-body">
              Manage your company team members
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-brand-gold/10 text-brand-gold font-display">
          {team.length}/{MAX_TEAM_SIZE}
        </span>
      </div>

      {/* ═══ Team member list ═══ */}
      <div className="space-y-3">
        {team.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl dark:bg-gray-900 dark:border-white/5"
          >
            {/* Avatar placeholder */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full shrink-0 bg-brand-gold/10">
              <Users size={18} className="text-brand-gold" />
            </div>

            {/* Name + email */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-brand-charcoal-dark dark:text-white font-display">
                {member.name}
              </p>
              <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 font-body">
                <Mail size={11} className="shrink-0" aria-hidden />
                <span className="truncate">{member.email}</span>
              </p>
            </div>

            {/* Role badge */}
            <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${ROLE_STYLES[member.role]}`}>
              <Shield size={10} aria-hidden />
              {member.role}
            </span>

            {/* Status dot + label */}
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${STATUS_DOT[member.status]}`} />
              <span className="text-xs capitalize text-gray-500 dark:text-gray-400 font-body">
                {member.status}
              </span>
            </div>

            {/* Joined date (hidden on small screens) */}
            <span className="hidden text-xs text-gray-400 md:block dark:text-gray-500 font-body whitespace-nowrap">
              {formatDate(member.joinedAt)}
            </span>

            {/* Remove button (not for owner) */}
            {member.role !== 'owner' ? (
              <button
                onClick={() => handleRemove(member.id)}
                className="flex items-center justify-center w-8 h-8 text-red-400 transition-colors rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 shrink-0"
                aria-label={`Remove ${member.name}`}
              >
                <Trash2 size={15} />
              </button>
            ) : (
              <div className="w-8 shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* ═══ Add Team Member (collapsible) ═══ */}
      <div className="overflow-hidden border border-gray-100 rounded-2xl dark:border-white/5">
        <button
          onClick={() => setShowInvite(!showInvite)}
          disabled={isAtCapacity}
          className={`flex items-center justify-between w-full px-4 py-3 text-left transition-colors ${
            isAtCapacity
              ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900'
              : 'bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-2">
            <UserPlus size={16} className="text-brand-gold" />
            <span className="text-sm font-semibold text-brand-charcoal-dark dark:text-white font-display">
              Add Team Member
            </span>
            {isAtCapacity && (
              <span className="px-2 py-0.5 text-[10px] font-bold text-amber-600 bg-amber-100 rounded-full dark:bg-amber-500/10 dark:text-amber-400">
                Max reached
              </span>
            )}
          </div>
          {showInvite ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>

        {showInvite && !isAtCapacity && (
          <div className="px-4 pb-4 space-y-3 bg-white dark:bg-gray-900">
            {/* Email input */}
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-500 dark:text-gray-400 font-body">
                Email address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-brand-charcoal-dark dark:bg-gray-800 dark:border-white/10 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/40 font-body"
              />
            </div>

            {/* Role select */}
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-500 dark:text-gray-400 font-body">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-brand-charcoal-dark dark:bg-gray-800 dark:border-white/10 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-gold/40 font-body"
              >
                <option value="manager">Manager</option>
                <option value="agent">Agent</option>
              </select>
            </div>

            {/* Send invite button */}
            <button
              onClick={handleInvite}
              disabled={!inviteEmail.trim()}
              className="flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-bold text-white transition-colors rounded-xl bg-brand-gold hover:bg-brand-gold/90 disabled:opacity-50 disabled:cursor-not-allowed font-display"
            >
              <Mail size={15} />
              Send Invite
            </button>
          </div>
        )}
      </div>

      {/* ═══ Phase 1 notice ═══ */}
      <div className="flex items-start gap-3 p-4 border rounded-2xl bg-amber-50 border-amber-100 dark:bg-amber-500/5 dark:border-amber-500/10">
        <Info size={18} className="mt-0.5 text-amber-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-400 font-display">
            Phase 1 Limit
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400/70 font-body">
            Company accounts can have up to {MAX_TEAM_SIZE} team members. More seats coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}

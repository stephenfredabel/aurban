import { Users, Briefcase, Calendar } from 'lucide-react';

/* ════════════════════════════════════════════════════════════
   HOUSEMATE PROFILES — Shows current housemates for shared
   accommodation listings. Helps potential tenants gauge
   compatibility before moving in.
════════════════════════════════════════════════════════════ */

export default function HousemateProfiles({ housemates = [], communityGuidelines = [] }) {
  if (!housemates.length) return null;

  return (
    <div>
      <h2 className="flex items-center gap-2 mb-3 font-bold font-display text-brand-charcoal-dark dark:text-white">
        <Users size={18} className="text-brand-gold" />
        Your Future Housemates
      </h2>

      <div className="space-y-3 mb-4">
        {housemates.map((mate, i) => {
          const initial = mate.name?.charAt(0) || '?';
          return (
            <div key={i} className="flex items-start gap-3 p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
              {/* Avatar */}
              <div className="flex items-center justify-center w-11 h-11 text-sm font-bold rounded-full shrink-0 bg-brand-gold/15 text-brand-gold">
                {initial}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{mate.name}</p>
                  {mate.age && (
                    <span className="text-[11px] text-gray-400">{mate.age}yo</span>
                  )}
                  {mate.gender && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
                      {mate.gender}
                    </span>
                  )}
                </div>

                {mate.occupation && (
                  <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <Briefcase size={11} /> {mate.occupation}
                  </p>
                )}

                {mate.bio && (
                  <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">{mate.bio}</p>
                )}

                {mate.moveInDate && (
                  <p className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-400">
                    <Calendar size={10} /> Living here since {formatDate(mate.moveInDate)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Community guidelines */}
      {communityGuidelines.length > 0 && (
        <div className="p-4 bg-purple-50 dark:bg-purple-500/10 rounded-2xl border border-purple-100 dark:border-purple-500/20">
          <p className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-2">Community Guidelines</p>
          <ul className="space-y-1.5">
            {communityGuidelines.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-purple-600 dark:text-purple-400">
                <span className="mt-1 w-1 h-1 rounded-full bg-purple-400 shrink-0" />
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

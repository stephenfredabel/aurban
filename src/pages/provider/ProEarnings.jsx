import { useMemo } from 'react';
import {
  Wallet, TrendingUp, Clock, Eye, DollarSign,
} from 'lucide-react';
import { useProBooking } from '../../context/ProBookingContext.jsx';
import { useCurrency } from '../../hooks/useCurrency.js';
import { TIER_CONFIG } from '../../data/proConstants.js';

/* ════════════════════════════════════════════════════════════
   PROVIDER PRO EARNINGS
   Route: /provider/pro-earnings
════════════════════════════════════════════════════════════ */

export default function ProEarnings() {
  const { bookings } = useProBooking();
  const { symbol } = useCurrency();

  const stats = useMemo(() => {
    let total = 0, pending = 0, observation = 0, available = 0;

    bookings.forEach(b => {
      const price = b.price || 0;
      const tierCfg = TIER_CONFIG[b.tier] || TIER_CONFIG[1];
      const commitment = Math.round(price * tierCfg.commitmentFeePercent / 100);
      const balance = price - commitment;

      if (['completed', 'paid'].includes(b.status)) {
        total += price;
        available += price;
      } else if (b.status === 'observation') {
        total += commitment;
        observation += balance;
        available += commitment;
      } else if (['checked_in', 'in_progress', 'complete'].includes(b.status)) {
        pending += balance;
        if (['complete'].includes(b.status)) {
          total += commitment;
          available += commitment;
        }
      } else if (['confirmed', 'provider_confirmed', 'en_route'].includes(b.status)) {
        pending += price;
      }
    });

    return { total, pending, observation, available };
  }, [bookings]);

  const statCards = [
    { label: 'Total Earned', value: stats.total, icon: DollarSign, color: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600' },
    { label: 'Pending Release', value: stats.pending, icon: Clock, color: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600' },
    { label: 'In Observation', value: stats.observation, icon: Eye, color: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600' },
    { label: 'Available', value: stats.available, icon: Wallet, color: 'bg-brand-gold/10 text-brand-gold' },
  ];

  // Monthly breakdown (simplified)
  const monthlyData = useMemo(() => {
    const months = {};
    bookings.forEach(b => {
      if (!['completed', 'paid', 'observation'].includes(b.status)) return;
      const date = new Date(b.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) months[key] = { label: date.toLocaleDateString('en-NG', { month: 'short', year: 'numeric' }), amount: 0, count: 0 };
      months[key].amount += b.price || 0;
      months[key].count += 1;
    });
    return Object.values(months).sort((a, b) => b.label.localeCompare(a.label));
  }, [bookings]);

  return (
    <div>
      <h1 className="section-title mb-1">Pro Earnings</h1>
      <p className="mb-5 text-sm text-gray-400">Your Aurban Pro service earnings overview</p>

      {/* Stat cards */}
      <div className="grid gap-3 mb-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(s => (
          <div key={s.label} className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${s.color}`}>
                <s.icon size={14} />
              </div>
              <span className="text-xs text-gray-400">{s.label}</span>
            </div>
            <p className="text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
              {symbol}{s.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Monthly breakdown */}
      <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
        <h3 className="mb-4 text-sm font-bold text-brand-charcoal-dark dark:text-white">Monthly Breakdown</h3>
        {monthlyData.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400">No earnings data yet</p>
        ) : (
          <div className="space-y-2">
            {monthlyData.map(m => (
              <div key={m.label} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl">
                <div>
                  <p className="text-xs font-bold text-brand-charcoal-dark dark:text-white">{m.label}</p>
                  <p className="text-[10px] text-gray-400">{m.count} booking{m.count !== 1 ? 's' : ''}</p>
                </div>
                <p className="text-sm font-bold text-brand-gold">{symbol}{m.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

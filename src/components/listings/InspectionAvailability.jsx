import { useState } from 'react';
import { Calendar, Clock, Plus, X, Info } from 'lucide-react';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../../data/listingOptions.js';
import Toggle from '../ui/Toggle.jsx';

/**
 * InspectionAvailability
 * Provider sets their available days and time windows for property inspections.
 *
 * Props:
 *   value     — { days: { monday: {enabled, from, to}, … }, maxPerDay, bufferMins, cancelHours }
 *   onChange  — (value) => void
 */

const DEFAULT_DAY_CONFIG = { enabled: false, from: '09:00', to: '17:00' };

const DEFAULT_VALUE = {
  days: Object.fromEntries(
    DAYS_OF_WEEK.map(d => [d.key, { ...DEFAULT_DAY_CONFIG }])
  ),
  maxPerDay:    3,
  bufferMins:   15,
  cancelHours:  12,
};

export default function InspectionAvailability({ value, onChange }) {
  const config = value || DEFAULT_VALUE;

  const updateDay = (dayKey, field, val) => {
    onChange({
      ...config,
      days: {
        ...config.days,
        [dayKey]: { ...config.days[dayKey], [field]: val },
      },
    });
  };

  const toggleDay = (dayKey) => {
    const current = config.days[dayKey] || DEFAULT_DAY_CONFIG;
    updateDay(dayKey, 'enabled', !current.enabled);
  };

  const enabledCount = Object.values(config.days).filter(d => d.enabled).length;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h3 className="mb-1 text-sm font-bold text-brand-charcoal-dark dark:text-white">
          Inspection Availability
        </h3>
        <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          Set the days and times you are available for property inspections. End users will book from your available slots. Bookings automatically sync to your phone calendar.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2.5 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
        <Info size={15} className="text-blue-500 mt-0.5 shrink-0" />
        <div className="text-xs leading-relaxed text-blue-700 dark:text-blue-300">
          Once a visitor books an inspection, <strong>both of you receive a calendar invite</strong> with property address and contact details via Aurban.
        </div>
      </div>

      {/* Day selector */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-brand-charcoal-dark dark:text-white">
          Available days
          {enabledCount > 0 && (
            <span className="ml-2 font-semibold text-emerald-600">{enabledCount} day{enabledCount !== 1 ? 's' : ''} selected</span>
          )}
        </p>

        <div className="space-y-2">
          {DAYS_OF_WEEK.map(({ key, label, short }) => {
            const dayConfig = config.days[key] || DEFAULT_DAY_CONFIG;
            return (
              <div key={key}
                className={[
                  'rounded-xl border transition-all overflow-hidden',
                  dayConfig.enabled
                    ? 'border-brand-gold/40 bg-brand-gold/5 dark:bg-brand-gold/10'
                    : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5',
                ].join(' ')}>

                {/* Day header row */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`w-10 text-sm font-bold ${dayConfig.enabled ? 'text-brand-charcoal-dark dark:text-white' : 'text-gray-400'}`}>
                      {short}
                    </span>
                    <span className={`text-sm ${dayConfig.enabled ? 'text-brand-charcoal dark:text-white/80' : 'text-gray-400'}`}>
                      {label}
                    </span>
                  </div>
                  <Toggle
                    checked={dayConfig.enabled}
                    onChange={() => toggleDay(key)}
                    label={dayConfig.enabled ? 'Available' : 'Unavailable'}
                  />
                </div>

                {/* Time pickers (visible when enabled) */}
                {dayConfig.enabled && (
                  <div className="flex flex-wrap items-center gap-3 px-4 pb-3">
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-gray-400 shrink-0" />
                      <label htmlFor={`${key}-from`} className="text-xs text-gray-500 shrink-0">From</label>
                      <select
                        id={`${key}-from`}
                        value={dayConfig.from}
                        onChange={e => updateDay(key, 'from', e.target.value)}
                        className="text-sm font-semibold font-body text-brand-charcoal-dark dark:text-white
                          bg-white dark:bg-brand-charcoal-dark border border-gray-200 dark:border-white/20
                          rounded-lg px-2.5 py-1.5 outline-none focus:border-brand-gold"
                      >
                        {TIME_SLOTS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <span className="text-sm text-gray-400">—</span>
                    <div className="flex items-center gap-2">
                      <label htmlFor={`${key}-to`} className="text-xs text-gray-500 shrink-0">To</label>
                      <select
                        id={`${key}-to`}
                        value={dayConfig.to}
                        onChange={e => updateDay(key, 'to', e.target.value)}
                        className="text-sm font-semibold font-body text-brand-charcoal-dark dark:text-white
                          bg-white dark:bg-brand-charcoal-dark border border-gray-200 dark:border-white/20
                          rounded-lg px-2.5 py-1.5 outline-none focus:border-brand-gold"
                      >
                        {TIME_SLOTS.filter(t => t > dayConfig.from).map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Slot settings */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Max per day */}
        <div className="p-3 bg-brand-gray-soft dark:bg-white/5 rounded-xl">
          <label className="block mb-2 text-xs font-bold text-brand-charcoal-dark dark:text-white">
            Max inspections/day
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...config, maxPerDay: Math.max(1, config.maxPerDay - 1) })}
              className="flex items-center justify-center w-8 h-8 text-lg font-bold transition-colors bg-white border border-gray-200 rounded-lg dark:bg-white/10 dark:border-white/20 text-brand-charcoal dark:text-white hover:border-brand-gold"
              aria-label="Decrease"
            >
              −
            </button>
            <span className="w-8 font-bold text-center font-display text-brand-charcoal-dark dark:text-white">
              {config.maxPerDay}
            </span>
            <button
              type="button"
              onClick={() => onChange({ ...config, maxPerDay: Math.min(10, config.maxPerDay + 1) })}
              className="flex items-center justify-center w-8 h-8 text-lg font-bold transition-colors bg-white border border-gray-200 rounded-lg dark:bg-white/10 dark:border-white/20 text-brand-charcoal dark:text-white hover:border-brand-gold"
              aria-label="Increase"
            >
              +
            </button>
          </div>
        </div>

        {/* Buffer time */}
        <div className="p-3 bg-brand-gray-soft dark:bg-white/5 rounded-xl">
          <label className="block mb-2 text-xs font-bold text-brand-charcoal-dark dark:text-white">
            Buffer between visits
          </label>
          <select
            value={config.bufferMins}
            onChange={e => onChange({ ...config, bufferMins: Number(e.target.value) })}
            className="w-full text-sm font-semibold font-body text-brand-charcoal-dark dark:text-white
              bg-white dark:bg-brand-charcoal-dark border border-gray-200 dark:border-white/20
              rounded-lg px-2.5 py-2 outline-none focus:border-brand-gold"
          >
            {[0,15,30,45,60].map(v => (
              <option key={v} value={v}>{v === 0 ? 'None' : `${v} min`}</option>
            ))}
          </select>
        </div>

        {/* Cancellation window */}
        <div className="p-3 bg-brand-gray-soft dark:bg-white/5 rounded-xl">
          <label className="block mb-2 text-xs font-bold text-brand-charcoal-dark dark:text-white">
            Cancel notice required
          </label>
          <select
            value={config.cancelHours}
            onChange={e => onChange({ ...config, cancelHours: Number(e.target.value) })}
            className="w-full text-sm font-semibold font-body text-brand-charcoal-dark dark:text-white
              bg-white dark:bg-brand-charcoal-dark border border-gray-200 dark:border-white/20
              rounded-lg px-2.5 py-2 outline-none focus:border-brand-gold"
          >
            {[2,6,12,24,48].map(v => (
              <option key={v} value={v}>{v}h before</option>
            ))}
          </select>
        </div>
      </div>

      {enabledCount === 0 && (
        <div className="flex items-center gap-2 p-3 border bg-amber-50 dark:bg-amber-500/10 rounded-xl border-amber-200 dark:border-amber-500/20">
          <Info size={14} className="text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Enable at least one day so end users can book inspections.
          </p>
        </div>
      )}
    </div>
  );
}
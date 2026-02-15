import { Calendar, Clock } from 'lucide-react';

/**
 * Date/time picker for booking a Pro service.
 */

const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00',
];

export default function ProSchedulePicker({ date, time, onDateChange, onTimeChange, errors }) {
  // Minimum date: tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Max date: 60 days from now
  const maxDate = new Date(Date.now() + 60 * 86400_000).toISOString().split('T')[0];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-1 text-sm font-bold text-brand-charcoal-dark dark:text-white">When do you need the service?</h3>
        <p className="mb-4 text-xs text-gray-400">Select your preferred date and time</p>
      </div>

      {/* Date input */}
      <div>
        <label className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <Calendar size={12} /> Preferred Date
        </label>
        <input
          type="date"
          value={date}
          onChange={e => onDateChange(e.target.value)}
          min={minDate}
          max={maxDate}
          className={`w-full py-2.5 px-3 text-sm border rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none ${
            errors?.scheduledDate ? 'border-red-400' : 'border-gray-200 dark:border-white/10'
          }`}
        />
        {errors?.scheduledDate && <p className="mt-1 text-xs text-red-500">{errors.scheduledDate}</p>}
      </div>

      {/* Time slots */}
      <div>
        <label className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <Clock size={12} /> Preferred Time
        </label>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {TIME_SLOTS.map(slot => (
            <button
              key={slot}
              type="button"
              onClick={() => onTimeChange(slot)}
              className={`py-2 text-xs font-bold rounded-xl border-2 transition-all ${
                time === slot
                  ? 'border-brand-gold bg-brand-gold/10 text-brand-gold'
                  : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/60 hover:border-brand-gold/50'
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
        {errors?.scheduledTime && <p className="mt-1 text-xs text-red-500">{errors.scheduledTime}</p>}
      </div>
    </div>
  );
}

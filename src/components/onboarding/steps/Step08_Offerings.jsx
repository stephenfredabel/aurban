import { useState }       from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X, Clock  } from 'lucide-react';
import { useOnboarding }  from '../../../hooks/useOnboarding.js';
import { useCurrency }    from '../../../hooks/useCurrency.js';
import StepWrapper        from '../StepWrapper.jsx';
import Button             from '../../ui/Button.jsx';
import Input              from '../../ui/Input.jsx';
import Select             from '../../ui/Select.jsx';

const RESPONSE_TIMES = [
  { value: '1h',       label: 'Within 1 hour'   },
  { value: '3h',       label: 'Within 3 hours'  },
  { value: 'same_day', label: 'Same day'         },
  { value: '24h',      label: 'Within 24 hours' },
  { value: '48h',      label: 'Within 48 hours' },
  { value: 'week',     label: 'Within a week'   },
];

const PRICE_UNITS = [
  { value: 'job',     label: '/ job'     },
  { value: 'hour',    label: '/ hour'    },
  { value: 'day',     label: '/ day'     },
  { value: 'week',    label: '/ week'    },
  { value: 'month',   label: '/ month'   },
  { value: 'sqm',     label: '/ m²'      },
  { value: 'project', label: '/ project' },
];

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h    = i % 12 || 12;
  const ampm = i < 12 ? 'AM' : 'PM';
  const val  = i.toString().padStart(2,'0') + ':00';
  return { value: val, label: `${h}:00 ${ampm}` };
});

const DEFAULT_SCHEDULE = DAYS.reduce((acc, d) => {
  acc[d] = { open: d !== 'Sun', from: '08:00', to: '18:00' };
  return acc;
}, {});

export default function Step08_Offerings() {
  const { t }                          = useTranslation();
  const { updateStep, nextStep, data } = useOnboarding();
  const { currency }                   = useCurrency();

  const saved = data.offerings || {};

  const [tagline,      setTagline]      = useState(saved.tagline      || '');
  const [description,  setDescription]  = useState(saved.description  || '');
  const [responseTime, setResponseTime] = useState(saved.responseTime || '');
  const [serviceArea,  setServiceArea]  = useState(saved.serviceArea  || '');
  const [rateCards,    setRateCards]    = useState(
    saved.rateCards || [{ id: '1', service: '', price: '', unit: 'job' }]
  );
  const [schedule, setSchedule] = useState(saved.schedule || DEFAULT_SCHEDULE);
  const [errors,   setErrors]   = useState({});

  // Rate card helpers
  const addRateCard = () => {
    if (rateCards.length >= 8) return;
    setRateCards((prev) => [...prev, {
      id: Math.random().toString(36).slice(2),
      service: '', price: '', unit: 'job',
    }]);
  };

  const updateRateCard = (id, field, value) =>
    setRateCards((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));

  const removeRateCard = (id) =>
    setRateCards((prev) => prev.filter((r) => r.id !== id));

  // Schedule helpers
  const toggleDay = (day) =>
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], open: !prev[day].open } }));

  const setScheduleTime = (day, field, value) =>
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));

  const validate = () => {
    const e = {};
    if (!description.trim() || description.trim().length < 30)
      e.description = 'Please write at least 30 characters describing your service';
    return e;
  };

  const handleSkip = () => {
    updateStep('offerings', { skipped: true });
    nextStep();
  };

  const handleContinue = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    updateStep('offerings', {
      tagline, description, responseTime, serviceArea, rateCards, schedule,
    });
    nextStep();
  };

  return (
    <StepWrapper
      title="Your offerings"
      subtitle="This appears on your public profile. Be clear and specific — it converts browsers to buyers."
      onSkip={handleSkip}
    >

      {/* Tagline */}
      <Input
        label="Tagline"
        placeholder="e.g. Reliable plumber in Lagos — 10+ years experience"
        value={tagline}
        onChange={(e) => setTagline(e.target.value.slice(0, 120))}
        hint={`${tagline.length}/120 characters`}
        recommended
      />

      {/* Description */}
      <Input
        label="Full Description"
        type="textarea"
        rows={5}
        placeholder="Tell clients what you do, how you work, your experience and what makes you different..."
        value={description}
        onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
        error={errors.description}
        hint={`${description.length}/1000 characters`}
        required
      />

      {/* Rate card builder */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="label-sm">Rate Card</p>
            <p className="text-xs text-gray-400 font-body mt-0.5">
              Your services and typical prices (in {currency.code})
            </p>
          </div>
          {rateCards.length < 8 && (
            <button
              type="button"
              onClick={addRateCard}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-gold hover:text-brand-gold-dark transition-colors"
            >
              <Plus size={13} />
              Add service
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {rateCards.map((card, idx) => (
            <div
              key={card.id}
              className="flex items-center gap-2 p-3 bg-brand-gray-soft rounded-xl"
            >
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={`Service ${idx + 1} (e.g. Pipe repair)`}
                  value={card.service}
                  onChange={(e) => updateRateCard(card.id, 'service', e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-brand-charcoal-dark placeholder:text-gray-400 outline-none mb-1.5"
                />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-brand-charcoal shrink-0">
                    {currency.symbol}
                  </span>
                  <input
                    type="number"
                    placeholder="0"
                    min={0}
                    value={card.price}
                    onChange={(e) => updateRateCard(card.id, 'price', e.target.value)}
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm font-bold text-brand-charcoal-dark outline-none focus:border-brand-gold w-24"
                  />
                  <select
                    value={card.unit}
                    onChange={(e) => updateRateCard(card.id, 'unit', e.target.value)}
                    className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-brand-charcoal outline-none focus:border-brand-gold"
                  >
                    {PRICE_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              {rateCards.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRateCard(card.id)}
                  className="flex items-center justify-center text-gray-400 transition-colors rounded-full w-7 h-7 hover:bg-red-100 hover:text-red-500 shrink-0"
                  aria-label="Remove service"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Availability calendar */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock size={14} className="text-brand-gold shrink-0" />
          <p className="label-sm">Availability</p>
        </div>
        <div className="space-y-2">
          {DAYS.map((day) => {
            const slot = schedule[day];
            return (
              <div key={day} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${slot.open ? 'border-brand-gold/20 bg-brand-gold/4' : 'border-gray-100 bg-gray-50'}`}>
                {/* Day toggle */}
                <button
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={[
                    'w-12 h-6 rounded-full border-2 flex items-center transition-colors shrink-0',
                    slot.open ? 'border-brand-gold bg-brand-gold' : 'border-gray-300 bg-white',
                  ].join(' ')}
                  aria-pressed={slot.open}
                  aria-label={`Toggle ${day}`}
                >
                  <span className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${slot.open ? 'translate-x-6' : ''}`} />
                </button>

                <span className={`w-8 text-xs font-bold shrink-0 ${slot.open ? 'text-brand-charcoal-dark' : 'text-gray-400'}`}>
                  {day}
                </span>

                {slot.open ? (
                  <div className="flex items-center flex-1 gap-2">
                    <select
                      value={slot.from}
                      onChange={(e) => setScheduleTime(day, 'from', e.target.value)}
                      className="flex-1 bg-white border border-gray-200 rounded-lg text-xs py-1.5 px-2 outline-none focus:border-brand-gold text-brand-charcoal"
                    >
                      {HOURS.map((h) => (
                        <option key={h.value} value={h.value}>{h.label}</option>
                      ))}
                    </select>
                    <span className="text-xs text-gray-400 shrink-0">to</span>
                    <select
                      value={slot.to}
                      onChange={(e) => setScheduleTime(day, 'to', e.target.value)}
                      className="flex-1 bg-white border border-gray-200 rounded-lg text-xs py-1.5 px-2 outline-none focus:border-brand-gold text-brand-charcoal"
                    >
                      {HOURS.map((h) => (
                        <option key={h.value} value={h.value}>{h.label}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="flex-1 text-xs italic text-gray-400 font-body">Unavailable</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Response time + service area */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          label="Typical Response Time"
          value={responseTime}
          onChange={setResponseTime}
          options={RESPONSE_TIMES}
          placeholder="Select..."
          recommended
        />
        <Input
          label="Service Area"
          placeholder="e.g. Lagos Island, Lekki, VI"
          value={serviceArea}
          onChange={(e) => setServiceArea(e.target.value)}
          hint="Areas or radius you cover"
          recommended
        />
      </div>

      <Button fullWidth size="lg" onClick={handleContinue}>
        Continue
      </Button>
    </StepWrapper>
  );
}
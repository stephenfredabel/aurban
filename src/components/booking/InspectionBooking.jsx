import { useState, useCallback, useMemo } from 'react';
import {
  X, ChevronLeft, ChevronRight, Calendar,
  Clock, CheckCircle2, MapPin, Phone,
  AlertCircle, User, MessageSquare,
  ArrowRight, Bell, Car, Home,
  Mail, Download, Shield,
} from 'lucide-react';
import { format, addDays, startOfDay, isSameDay, isAfter, isBefore } from 'date-fns';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCurrency } from '../../hooks/useCurrency.js';

// ─────────────────────────────────────────────────────────────
// MOCK AVAILABILITY  (replace with /api/v1/listings/:id/availability)
// Provider has set available slots via InspectionAvailability.jsx
// ─────────────────────────────────────────────────────────────

function generateSlots() {
  const slots = {};
  for (let i = 1; i <= 28; i++) {
    const d = addDays(startOfDay(new Date()), i);
    const dow = d.getDay(); // 0=Sun
    // Provider unavailable Sundays
    if (dow === 0) continue;
    const daySlots = [];
    const times = dow === 6
      ? ['10:00', '12:00', '14:00']
      : ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00'];
    times.forEach((t, idx) => {
      // Random availability
      if ((i + idx) % 4 !== 0) {
        daySlots.push({ time: t, available: true });
      }
    });
    if (daySlots.length > 0) slots[format(d, 'yyyy-MM-dd')] = daySlots;
  }
  return slots;
}

const MOCK_SLOTS    = generateSlots();
const MOCK_LISTING  = {
  id:      'prop_001',
  title:   '3-Bedroom Flat in Lekki Phase 1',
  address: 'Admiralty Way, Lekki Phase 1, Lagos',
  type:    'rental',
  inspectionFee: 0,
  provider: {
    name:          'Chukwuemeka Eze',
    responseTime:  '1h',
    cancellationNotice: 12,   // hours
  },
};

// ─────────────────────────────────────────────────────────────
// ICS CALENDAR GENERATOR
// ─────────────────────────────────────────────────────────────

function generateICS(listing, date, time, form) {
  const [hours, minutes] = time.split(':').map(Number);
  const start = new Date(date);
  start.setHours(hours, minutes, 0, 0);
  const end = new Date(start.getTime() + 45 * 60 * 1000); // 45 min

  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Aurban//Booking//EN',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:Inspection — ${listing.title}`,
    `LOCATION:${listing.address}`,
    `DESCRIPTION:Booking with ${listing.provider?.name || 'Provider'}\\nContact: ${form.phone}`,
    'STATUS:CONFIRMED',
    `UID:aurban-${Date.now()}@aurban.com`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return ics;
}

function downloadICS(listing, date, time, form) {
  const ics = generateICS(listing, date, time, form);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aurban-inspection-${format(date, 'yyyy-MM-dd')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────
// WHATSAPP LINK GENERATOR
// ─────────────────────────────────────────────────────────────

function getWhatsAppLink(listing, date, time, form) {
  const msg = encodeURIComponent(
    `Hi, I've booked an inspection on Aurban!\n\n` +
    `📍 ${listing.title}\n` +
    `📅 ${format(date, 'EEEE, d MMMM yyyy')}\n` +
    `🕐 ${time}\n` +
    `📌 ${listing.address}\n\n` +
    `Name: ${form.name}\nPhone: ${form.phone}`
  );
  return `https://wa.me/?text=${msg}`;
}

// ─────────────────────────────────────────────────────────────
// MINI CALENDAR
// ─────────────────────────────────────────────────────────────

function MiniCalendar({ selectedDate, onSelect, availableSlots }) {
  const today = startOfDay(new Date());
  const [viewMonth, setViewMonth] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const y    = viewMonth.getFullYear();
    const m    = viewMonth.getMonth();
    const first = new Date(y, m, 1).getDay();   // 0=Sun
    const last  = new Date(y, m + 1, 0).getDate();
    const cells = [];
    // Pad start
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= last; d++) cells.push(new Date(y, m, d));
    return cells;
  }, [viewMonth]);

  const hasSlots = (d) => {
    if (!d) return false;
    const key = format(d, 'yyyy-MM-dd');
    return !!availableSlots[key] && availableSlots[key].length > 0;
  };

  const isPast  = (d) => d && isBefore(startOfDay(d), today);
  const isToday = (d) => d && isSameDay(d, today);
  const isSel   = (d) => d && selectedDate && isSameDay(d, selectedDate);

  const prevMonth = () => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() - 1));
  const nextMonth = () => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() + 1));

  const canPrev = isAfter(viewMonth, new Date(today.getFullYear(), today.getMonth()));

  return (
    <div className="p-4 bg-white border border-gray-100 select-none dark:bg-brand-charcoal-dark rounded-2xl dark:border-white/10">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={prevMonth} disabled={!canPrev}
          className="flex items-center justify-center w-8 h-8 transition-colors rounded-xl text-brand-charcoal dark:text-white hover:bg-brand-gray-soft dark:hover:bg-white/10 disabled:opacity-20">
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">
          {format(viewMonth, 'MMMM yyyy')}
        </p>
        <button type="button" onClick={nextMonth}
          className="flex items-center justify-center w-8 h-8 transition-colors rounded-xl text-brand-charcoal dark:text-white hover:bg-brand-gray-soft dark:hover:bg-white/10">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-center text-[11px] font-bold text-gray-400 pb-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {daysInMonth.map((d, i) => {
          const avail  = hasSlots(d);
          const past   = isPast(d);
          const today_ = isToday(d);
          const sel    = isSel(d);

          if (!d) return <div key={i} />;

          return (
            <button key={i} type="button"
              disabled={past || !avail}
              onClick={() => onSelect(d)}
              className={[
                'relative w-9 h-9 mx-auto rounded-xl text-xs font-bold transition-all flex items-center justify-center',
                sel    ? 'bg-brand-gold text-white shadow-sm shadow-brand-gold/30'
                : today_ && avail ? 'ring-2 ring-brand-gold text-brand-charcoal-dark dark:text-white hover:bg-brand-gold/10'
                : avail && !past  ? 'text-brand-charcoal-dark dark:text-white hover:bg-brand-gray-soft dark:hover:bg-white/10'
                : 'text-gray-300 dark:text-white/20 cursor-not-allowed',
              ].join(' ')}>
              {d.getDate()}
              {/* Availability dot */}
              {avail && !past && !sel && (
                <span className="absolute w-1 h-1 -translate-x-1/2 rounded-full bottom-1 left-1/2 bg-brand-gold" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-3 mt-4 border-t border-gray-100 dark:border-white/10">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-brand-gold" />
          Slots available
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-2 h-2 bg-gray-200 rounded-full dark:bg-white/20" />
          Unavailable
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function InspectionBooking({
  listing = MOCK_LISTING,
  onClose,
  onSuccess,
  onBookingCreate,
  bookingLabel = 'Book Inspection',
}) {
  const { user }          = useAuth();
  const { format: formatPrice }   = useCurrency();
  const [step, setStep]           = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [submitting,  setSubmitting]    = useState(false);
  const [booked,      setBooked]        = useState(false);
  const [bookingRef,  setBookingRef]    = useState('');

  const [form, setForm] = useState({
    name:    user?.name  || '',
    phone:   user?.phone || '',
    notes:   '',
    transport: 'drive',   // 'drive' | 'transit' | 'walk'
  });

  const [notifications, setNotifications] = useState({
    email:    true,
    calendar: true,
    whatsapp: false,
  });

  const [errors, setErrors] = useState({});

  const hasFee = (listing.inspectionFee || 0) > 0;

  // Dynamic steps based on fee
  const STEPS = useMemo(() => {
    const base = [
      { id: 'date',    label: 'Pick Date'  },
      { id: 'time',    label: 'Pick Time'  },
      { id: 'details', label: 'Your Info'  },
    ];
    if (hasFee) base.push({ id: 'payment', label: 'Payment' });
    base.push({ id: 'confirm', label: 'Confirm' });
    return base;
  }, [hasFee]);

  const dayKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const availableTimes = dayKey ? (MOCK_SLOTS[dayKey] || []) : [];

  // Step index mapping
  const detailsStep = 2;
  const paymentStep = hasFee ? 3 : -1;
  const confirmStep = hasFee ? 4 : 3;

  // ── Step validation ───────────────────────────────────────
  const validateDetails = useCallback(() => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Name required';
    if (!form.phone.trim()) e.phone = 'Phone required';
    if (form.phone && !/^(\+?234|0)[7-9][01]\d{8}$/.test(form.phone.replace(/\s/g,'')))
      e.phone = 'Enter a valid Nigerian mobile number';
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  // ── Navigation ────────────────────────────────────────────
  const next = useCallback(() => {
    if (step === detailsStep && !validateDetails()) return;
    setStep(s => s + 1);
  }, [step, validateDetails, detailsStep]);

  const back = useCallback(() => setStep(s => s - 1), []);

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1800)); // simulate API
    const ref = `AUR-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    setBookingRef(ref);

    // Add to BookingContext if callback provided
    if (onBookingCreate) {
      onBookingCreate({
        listingId:    listing.id,
        listingTitle: listing.title,
        listingType:  listing.type,
        address:      listing.address,
        providerId:   listing.provider?.id || 'unknown',
        providerName: listing.provider?.name || 'Provider',
        date:         format(selectedDate, 'yyyy-MM-dd'),
        time:         selectedTime,
        transport:    form.transport,
        notes:        form.notes,
        userPhone:    form.phone,
        escrowAmount: listing.inspectionFee || 0,
        notifications,
      });
    }

    // Download .ics if calendar notification selected
    if (notifications.calendar && selectedDate) {
      downloadICS(listing, selectedDate, selectedTime, form);
    }

    setBooked(true);
    setSubmitting(false);
    onSuccess?.({ ref, date: selectedDate, time: selectedTime });
  }, [selectedDate, selectedTime, onSuccess, onBookingCreate, listing, form, notifications]);

  // ── Progress bar ──────────────────────────────────────────
  const Progress = () => (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center flex-1 last:flex-none">
          <div className={`flex items-center gap-1.5 ${i <= step ? 'text-brand-gold' : 'text-gray-300 dark:text-white/20'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${i < step ? 'bg-brand-gold border-brand-gold text-white' : i === step ? 'border-brand-gold text-brand-gold bg-white dark:bg-brand-charcoal-dark' : 'border-gray-200 dark:border-white/20 text-gray-300 dark:text-white/20 bg-white dark:bg-brand-charcoal-dark'}`}>
              {i < step ? <CheckCircle2 size={13} /> : i + 1}
            </div>
            <span className={`text-[11px] font-bold hidden sm:inline ${i === step ? 'text-brand-charcoal-dark dark:text-white' : 'text-gray-400 dark:text-white/30'}`}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1.5 transition-all ${i < step ? 'bg-brand-gold' : 'bg-gray-100 dark:bg-white/10'}`} />
          )}
        </div>
      ))}
    </div>
  );

  // ── Booked success screen ─────────────────────────────────
  if (booked) {
    return (
      <div className="flex flex-col items-center px-2 py-6 text-center">
        <div className="flex items-center justify-center w-20 h-20 mb-5 bg-emerald-100 dark:bg-emerald-500/20 rounded-3xl">
          <CheckCircle2 size={38} className="text-emerald-500" />
        </div>
        <h2 className="mb-2 text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
          {bookingLabel === 'Book Appointment' ? 'Appointment Booked!' : 'Inspection Booked!'}
        </h2>
        <p className="mb-1 text-sm text-gray-400">Booking reference</p>
        <p className="mb-5 font-mono text-xl font-extrabold tracking-widest text-brand-gold">{bookingRef}</p>

        <div className="w-full p-4 mb-5 space-y-3 text-left bg-brand-gray-soft dark:bg-white/5 rounded-2xl">
          {[
            { icon: Home,    label: 'Property',  value: listing.title                          },
            { icon: Calendar,label: 'Date',       value: format(selectedDate, 'EEEE, d MMMM yyyy') },
            { icon: Clock,   label: 'Time',       value: selectedTime                            },
            { icon: MapPin,  label: 'Address',    value: listing.address                         },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-brand-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={13} className="text-brand-gold" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Notification confirmation */}
        <div className="flex flex-wrap gap-2 mb-5 w-full justify-center">
          {notifications.email && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 rounded-full">
              <Mail size={12} /> Email sent
            </span>
          )}
          {notifications.calendar && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 rounded-full">
              <Download size={12} /> Calendar added
            </span>
          )}
          {notifications.whatsapp && (
            <a href={getWhatsAppLink(listing, selectedDate, selectedTime, form)}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-500/10 rounded-full hover:bg-green-100 transition-colors">
              💬 Share on WhatsApp
            </a>
          )}
        </div>

        {/* 24hr reminder note */}
        <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-100 dark:border-amber-500/20 text-left w-full mb-5">
          <Bell size={14} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
            You'll receive a <strong>24-hour reminder</strong> and a <strong>1-hour reminder</strong> before your inspection. You can cancel up to <strong>{listing.provider?.cancellationNotice || 12} hours before</strong> at no charge.
          </p>
        </div>

        <div className="flex w-full gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 text-sm font-bold text-white transition-colors rounded-2xl bg-brand-gold hover:bg-brand-gold-dark">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {step > 0 && (
            <button type="button" onClick={back}
              className="flex items-center justify-center w-8 h-8 transition-colors rounded-xl hover:bg-brand-gray-soft dark:hover:bg-white/10 text-brand-charcoal dark:text-white">
              <ChevronLeft size={16} />
            </button>
          )}
          <div>
            <h2 className="text-lg font-extrabold leading-tight font-display text-brand-charcoal-dark dark:text-white">
              {bookingLabel}
            </h2>
            <p className="text-xs text-gray-400 truncate max-w-[200px]">{listing.title}</p>
          </div>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close"
            className="flex items-center justify-center w-8 h-8 transition-colors rounded-xl hover:bg-brand-gray-soft dark:hover:bg-white/10 text-brand-charcoal dark:text-white">
            <X size={16} />
          </button>
        )}
      </div>

      <Progress />

      {/* ── STEP 0: Pick Date ──────────────────────── */}
      {step === 0 && (
        <div className="space-y-5">
          <MiniCalendar
            selectedDate={selectedDate}
            onSelect={d => { setSelectedDate(d); setSelectedTime(null); }}
            availableSlots={MOCK_SLOTS}
          />
          {selectedDate && (
            <div className="p-4 border bg-brand-gold/5 dark:bg-brand-gold/10 rounded-2xl border-brand-gold/20">
              <p className="mb-1 text-sm font-bold text-brand-charcoal-dark dark:text-white">
                {format(selectedDate, 'EEEE, d MMMM yyyy')}
              </p>
              <p className="text-xs text-gray-400">
                {availableTimes.length} time slot{availableTimes.length !== 1 ? 's' : ''} available
              </p>
            </div>
          )}
          <button type="button" onClick={next} disabled={!selectedDate}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl transition-colors">
            Continue <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* ── STEP 1: Pick Time ──────────────────────── */}
      {step === 1 && selectedDate && (
        <div className="space-y-5">
          <div>
            <p className="mb-3 text-sm font-bold text-brand-charcoal-dark dark:text-white">
              Available times for{' '}
              <span className="text-brand-gold">{format(selectedDate, 'EEE, d MMM')}</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              {availableTimes.map(({ time }) => (
                <button key={time} type="button"
                  onClick={() => setSelectedTime(time)}
                  className={[
                    'py-3 rounded-xl border-2 text-sm font-bold transition-all',
                    selectedTime === time
                      ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white'
                      : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-white/70 hover:border-brand-gold/50',
                  ].join(' ')}>
                  {time}
                </button>
              ))}
            </div>
            {availableTimes.length === 0 && (
              <div className="flex flex-col items-center py-8 text-center">
                <Clock size={28} className="mb-2 text-gray-300" />
                <p className="text-sm text-gray-400">No slots available for this day.</p>
                <button type="button" onClick={back} className="mt-3 text-xs font-bold text-brand-gold hover:text-brand-gold-dark">
                  Pick another date
                </button>
              </div>
            )}
          </div>

          {/* Duration note */}
          <div className="flex items-start gap-2.5 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
            <Clock size={13} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-300">
              Inspections typically last <strong>30–45 minutes</strong>. The provider may be slightly delayed — they'll message you if that happens.
            </p>
          </div>

          <button type="button" onClick={next} disabled={!selectedTime}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl transition-colors">
            Continue <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* ── STEP 2: Your Details ───────────────────── */}
      {step === detailsStep && (
        <div className="space-y-5">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="label-sm mb-1.5">Full Name *</label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="text" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your full name"
                  className={`input-field pl-10 ${errors.name ? 'border-red-300 dark:border-red-500/50' : ''}`}
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="label-sm mb-1.5">Phone Number *</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="tel" inputMode="tel" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="0801 234 5678"
                  className={`input-field pl-10 ${errors.phone ? 'border-red-300 dark:border-red-500/50' : ''}`}
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
              <p className="text-[11px] text-gray-400 mt-1">Provider will call this number if they're delayed</p>
            </div>

            {/* How are you getting there */}
            <div>
              <label className="mb-2 label-sm">How are you getting there?</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id:'drive',   icon: Car,        label:'Driving'  },
                  { id:'transit', icon: MapPin,      label:'Transit'  },
                  { id:'walk',    icon: User,        label:'Walking'  },
                ].map(({ id, icon: Icon, label }) => (
                  <button key={id} type="button"
                    onClick={() => setForm(f => ({ ...f, transport: id }))}
                    className={[
                      'flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-bold transition-all',
                      form.transport === id
                        ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white'
                        : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 dark:text-white/60 hover:border-brand-gold/50',
                    ].join(' ')}>
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="label-sm mb-1.5">Message to Provider <span className="font-normal text-gray-400">(optional)</span></label>
              <div className="relative">
                <MessageSquare size={14} className="absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
                <textarea value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any specific rooms you'd like to focus on, accessibility needs, etc."
                  rows={3}
                  maxLength={300}
                  className="pl-10 resize-none input-field"
                />
              </div>
              {form.notes.length > 250 && (
                <p className="text-[11px] text-right text-amber-500 mt-0.5">{form.notes.length}/300</p>
              )}
            </div>
          </div>

          {/* Notification preferences */}
          <div>
            <label className="label-sm mb-2">Notification Preferences</label>
            <div className="space-y-2">
              {[
                { key: 'email',    icon: Mail,     label: 'Email confirmation',  desc: 'Receive booking details via email' },
                { key: 'calendar', icon: Download,  label: 'Add to Calendar',     desc: 'Download .ics calendar file' },
                { key: 'whatsapp', icon: MessageSquare, label: 'WhatsApp reminder', desc: 'Share booking via WhatsApp' },
              ].map(({ key, icon: Icon, label, desc }) => (
                <label key={key}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 cursor-pointer hover:border-brand-gold/30 transition-colors">
                  <input type="checkbox"
                    checked={notifications[key]}
                    onChange={() => setNotifications(n => ({ ...n, [key]: !n[key] }))}
                    className="w-4 h-4 rounded border-gray-300 text-brand-gold focus:ring-brand-gold/20"
                  />
                  <Icon size={14} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-brand-charcoal-dark dark:text-white">{label}</p>
                    <p className="text-[11px] text-gray-400">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Cancellation policy */}
          <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-100 dark:border-amber-500/20">
            <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
              <strong>Cancellation policy:</strong> Free cancellation up to{' '}
              <strong>{listing.provider?.cancellationNotice || 12} hours</strong> before the inspection. Late cancellations may affect your inspection rating.
            </p>
          </div>

          <button type="button" onClick={next}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-gold hover:bg-brand-gold-dark text-white font-bold text-sm rounded-2xl transition-colors">
            {hasFee ? 'Continue to Payment' : 'Review Booking'} <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* ── PAYMENT STEP (only when fee > 0) ─────── */}
      {hasFee && step === paymentStep && (
        <div className="space-y-5">
          {/* Fee card */}
          <div className="p-5 bg-brand-gray-soft dark:bg-white/5 rounded-2xl">
            <p className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-3">Inspection Fee</p>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                {listing.title}
              </span>
              <span className="text-lg font-extrabold text-brand-charcoal-dark dark:text-white">
                {formatPrice(listing.inspectionFee)}
              </span>
            </div>

            {/* Escrow explanation */}
            <div className="flex items-start gap-2.5 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
              <Shield size={14} className="text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1">Protected by Aurban Escrow</p>
                <p className="text-[11px] leading-relaxed text-emerald-600 dark:text-emerald-400">
                  Your payment is held securely until the inspection is complete. You confirm completion and funds are released to the provider.
                </p>
              </div>
            </div>
          </div>

          {/* Payment method selection */}
          <div>
            <label className="label-sm mb-2">Payment Method</label>
            <div className="space-y-2">
              {[
                { id: 'paystack',    label: 'Paystack',     desc: 'Card, Bank Transfer, USSD' },
                { id: 'flutterwave', label: 'Flutterwave',  desc: 'Card, Mobile Money, Bank' },
              ].map(({ id, label, desc }) => (
                <label key={id}
                  className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 cursor-pointer hover:border-brand-gold/50 transition-colors">
                  <input type="radio" name="payment" value={id} defaultChecked={id === 'paystack'}
                    className="w-4 h-4 text-brand-gold border-gray-300 focus:ring-brand-gold/20" />
                  <div>
                    <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{label}</p>
                    <p className="text-[11px] text-gray-400">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button type="button" onClick={next}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-gold hover:bg-brand-gold-dark text-white font-bold text-sm rounded-2xl transition-colors">
            Review Booking <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* ── CONFIRM STEP ─────────────────────────── */}
      {step === confirmStep && (
        <div className="space-y-5">
          {/* Summary card */}
          <div className="p-5 space-y-4 bg-brand-gray-soft dark:bg-white/5 rounded-2xl">
            <p className="text-xs font-bold tracking-wider text-gray-400 uppercase">Booking Summary</p>
            {[
              { label:'Property',  value: listing.title                          },
              { label:'Date',      value: selectedDate ? format(selectedDate, 'EEEE, d MMMM yyyy') : '' },
              { label:'Time',      value: selectedTime                            },
              { label:'Address',   value: listing.address                         },
              { label:'Name',      value: form.name                               },
              { label:'Phone',     value: form.phone                              },
              { label:'Transport', value: { drive:'Driving', transit:'Public Transit', walk:'Walking' }[form.transport] },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <span className="w-20 text-xs font-bold text-gray-400 shrink-0">{label}</span>
                <span className="text-sm font-semibold text-right text-brand-charcoal-dark dark:text-white">{value}</span>
              </div>
            ))}
            {hasFee && (
              <div className="flex items-start justify-between gap-4 pt-3 border-t border-gray-200 dark:border-white/10">
                <span className="w-20 text-xs font-bold text-brand-gold shrink-0">Fee</span>
                <span className="text-sm font-extrabold text-brand-gold">{formatPrice(listing.inspectionFee)}</span>
              </div>
            )}
            {form.notes && (
              <div className="pt-3 border-t border-gray-200 dark:border-white/10">
                <p className="mb-1 text-xs font-bold text-gray-400">Message</p>
                <p className="text-xs text-gray-500 dark:text-white/60">{form.notes}</p>
              </div>
            )}
          </div>

          {/* Free/Escrow badge */}
          {hasFee ? (
            <div className="flex items-center gap-3 p-3.5 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-100 dark:border-amber-500/20">
              <Shield size={15} className="text-amber-500 shrink-0" />
              <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                {formatPrice(listing.inspectionFee)} held in Aurban Escrow until you confirm completion
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                Free inspection booking — no upfront payment required
              </p>
            </div>
          )}

          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="flex items-center justify-center w-full gap-2 py-4 text-sm font-bold text-white transition-colors shadow-lg bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-50 rounded-2xl shadow-brand-gold/20">
            {submitting
              ? <><span className="w-4 h-4 border-2 rounded-full border-white/40 border-t-white animate-spin" /> Booking…</>
              : <><Calendar size={16} /> {hasFee ? 'Pay & Confirm Booking' : `Confirm ${bookingLabel}`}</>
            }
          </button>

          <p className="text-center text-[11px] text-gray-400 leading-relaxed">
            By confirming, you agree to Aurban's{' '}
            <a href="/terms" className="font-semibold text-brand-gold hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/community-guidelines" className="font-semibold text-brand-gold hover:underline">Community Guidelines</a>.
          </p>
        </div>
      )}
    </div>
  );
}

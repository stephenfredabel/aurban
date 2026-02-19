import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Clock, Users, Shield, Star,
  ChevronDown, ChevronUp, Minus, Plus,
  MessageSquare, ArrowRight, AlertCircle,
  CheckCircle2, Moon, Home,
} from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency.js';
import { useAuth }     from '../../context/AuthContext.jsx';

/* ════════════════════════════════════════════════════════════
   BOOKING PANEL — 3-mode smart booking sidebar/bottom panel

   Modes (auto-detected from property.accommodationType):
   ─────────────────────────────────────────────────────────
   1. SHORTLET  → Date picker, guest count, price breakdown
   2. SHARED    → Room selector, move-in date, inquiry
   3. STAY      → Lease inquiry, move-in date, tour booking

   Also works as a generic "Contact Agent" panel when
   accommodationType is null (regular rental/buy/land).
════════════════════════════════════════════════════════════ */

export default function BookingPanel({
  property,
  onBookInspection,
  onRequestBooking,
  onMessage,
  compact: _compact = false,
}) {
  const { format: formatPrice } = useCurrency();
  const { user: _user } = useAuth();

  const mode = property?.accommodationType || 'default';
  const isShortlet = mode === 'shortlet';
  const isShared   = mode === 'shared';
  const isStay     = mode === 'stay';

  /* ── Shortlet state ──────────────────────────────────────── */
  const [checkIn, setCheckIn]   = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests]     = useState(1);
  const [showBreakdown, setShowBreakdown] = useState(false);

  /* ── Shared state ────────────────────────────────────────── */
  const [selectedRoom, setSelectedRoom] = useState(null);

  /* ── Stay state ──────────────────────────────────────────── */
  const [stayMonths, setStayMonths] = useState(property?.availability?.minStay || 3);

  /* ── Shortlet price calculation ──────────────────────────── */
  const shortletCalc = useMemo(() => {
    if (!isShortlet || !checkIn || !checkOut) return null;
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const nights = Math.max(1, Math.round((d2 - d1) / 86400000));
    const nightly = property.pricePerNight || property.price || 0;
    const weekly  = property.pricePerWeek || null;

    // Use weekly rate if >= 7 nights and weekly price exists
    let subtotal;
    let rateLabel;
    if (weekly && nights >= 7) {
      const weeks = Math.floor(nights / 7);
      const extraNights = nights % 7;
      subtotal = (weeks * weekly) + (extraNights * nightly);
      rateLabel = `${weeks} week${weeks > 1 ? 's' : ''}${extraNights ? ` + ${extraNights} night${extraNights > 1 ? 's' : ''}` : ''}`;
    } else {
      subtotal = nights * nightly;
      rateLabel = `${nights} night${nights !== 1 ? 's' : ''} × ${formatPrice(nightly)}`;
    }

    const cleaning = property.cleaningFee || 0;
    const service  = Math.round(subtotal * 0.15); // 15% service fee
    const caution  = property.cautionFee || 0;
    const total    = subtotal + cleaning + service;

    return { nights, subtotal, cleaning, service, caution, total, rateLabel };
  }, [isShortlet, checkIn, checkOut, property, formatPrice]);

  /* ── Stay total calculation ──────────────────────────────── */
  const stayCalc = useMemo(() => {
    if (!isStay) return null;
    const monthly = property.pricePerMonth || property.price || 0;
    const deposit = property.securityDeposit || 0;
    const caution = property.cautionFee || 0;
    const service = property.serviceCharge || 0;
    const legal   = property.legalFee || 0;
    const moveIn  = monthly + deposit + caution + service + legal;
    return { monthly, deposit, caution, service, legal, moveIn, months: stayMonths };
  }, [isStay, property, stayMonths]);

  /* ── Today's date for min date attr ──────────────────────── */
  const today = new Date().toISOString().split('T')[0];

  /* ════════════════════════════════════════════════════════════
     SHORTLET MODE
  ════════════════════════════════════════════════════════════ */
  if (isShortlet) {
    return (
      <div className="p-5 space-y-4 bg-white border border-gray-100 shadow-card dark:bg-brand-charcoal-dark dark:border-white/10 rounded-2xl">
        {/* Price header */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
            {formatPrice(property.pricePerNight || property.price)}
          </span>
          <span className="text-sm text-gray-400">/night</span>
          {property.providerRating && (
            <span className="flex items-center gap-1 ml-auto text-sm font-bold text-brand-charcoal-dark dark:text-white">
              <Star size={14} className="text-brand-gold fill-brand-gold" />
              {property.providerRating}
              <span className="text-xs font-normal text-gray-400">({property.providerReviews})</span>
            </span>
          )}
        </div>

        {/* Date inputs */}
        <div className="grid grid-cols-2 gap-0 overflow-hidden border-2 border-gray-200 dark:border-white/10 rounded-xl">
          <div className="p-3 border-r border-gray-200 dark:border-white/10">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Check-in</label>
            <input
              type="date"
              value={checkIn}
              min={today}
              onChange={e => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(''); }}
              className="w-full mt-1 text-sm font-semibold bg-transparent text-brand-charcoal-dark dark:text-white focus:outline-none"
            />
          </div>
          <div className="p-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Check-out</label>
            <input
              type="date"
              value={checkOut}
              min={checkIn || today}
              onChange={e => setCheckOut(e.target.value)}
              className="w-full mt-1 text-sm font-semibold bg-transparent text-brand-charcoal-dark dark:text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Guest count */}
        <div className="flex items-center justify-between p-3 border-2 border-gray-200 dark:border-white/10 rounded-xl">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Guests</p>
            <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">{guests} guest{guests !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setGuests(g => Math.max(1, g - 1))}
              className="flex items-center justify-center w-8 h-8 border border-gray-200 dark:border-white/10 rounded-full text-gray-400 hover:border-brand-gold hover:text-brand-gold transition-colors disabled:opacity-30"
              disabled={guests <= 1}>
              <Minus size={14} />
            </button>
            <span className="w-6 text-sm font-bold text-center text-brand-charcoal-dark dark:text-white">{guests}</span>
            <button type="button" onClick={() => setGuests(g => Math.min(property.houseRules?.maxGuests || 10, g + 1))}
              className="flex items-center justify-center w-8 h-8 border border-gray-200 dark:border-white/10 rounded-full text-gray-400 hover:border-brand-gold hover:text-brand-gold transition-colors disabled:opacity-30"
              disabled={guests >= (property.houseRules?.maxGuests || 10)}>
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Book button */}
        <button
          type="button"
          onClick={() => onRequestBooking?.({ checkIn, checkOut, guests, ...shortletCalc })}
          disabled={!checkIn || !checkOut}
          className="flex items-center justify-center w-full gap-2 py-4 text-sm font-bold text-white transition-colors shadow-lg bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl"
        >
          {property.availability?.instantBooking ? (
            <><Calendar size={16} /> Reserve</>
          ) : (
            <><MessageSquare size={16} /> Request to Book</>
          )}
        </button>

        {/* Price breakdown */}
        {shortletCalc && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowBreakdown(v => !v)}
              className="flex items-center justify-between w-full text-xs font-bold text-gray-400 hover:text-brand-charcoal-dark dark:hover:text-white transition-colors"
            >
              Price breakdown
              {showBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showBreakdown && (
              <div className="p-4 space-y-2 bg-brand-gray-soft dark:bg-white/5 rounded-xl">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{shortletCalc.rateLabel}</span>
                  <span className="font-semibold text-brand-charcoal-dark dark:text-white">{formatPrice(shortletCalc.subtotal)}</span>
                </div>
                {shortletCalc.cleaning > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Cleaning fee</span>
                    <span className="font-semibold text-brand-charcoal-dark dark:text-white">{formatPrice(shortletCalc.cleaning)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Service fee</span>
                  <span className="font-semibold text-brand-charcoal-dark dark:text-white">{formatPrice(shortletCalc.service)}</span>
                </div>
                <div className="flex justify-between pt-2 text-sm border-t border-gray-200 dark:border-white/10">
                  <span className="font-bold text-brand-charcoal-dark dark:text-white">Total</span>
                  <span className="font-extrabold text-brand-charcoal-dark dark:text-white">{formatPrice(shortletCalc.total)}</span>
                </div>
                {shortletCalc.caution > 0 && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    + {formatPrice(shortletCalc.caution)} refundable caution deposit
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Escrow trust badge */}
        <div className="flex items-start gap-2.5 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
          <Shield size={14} className="text-emerald-500 mt-0.5 shrink-0" />
          <p className="text-[11px] leading-relaxed text-emerald-600 dark:text-emerald-400">
            Payment protected by <strong>Aurban Escrow</strong>. Funds released to host only after check-in confirmation.
          </p>
        </div>

        {/* Availability info */}
        <div className="flex items-center gap-4 text-[11px] text-gray-400">
          {property.availability?.checkIn && (
            <span className="flex items-center gap-1"><Clock size={11} /> Check-in: {property.availability.checkIn}</span>
          )}
          {property.availability?.checkOut && (
            <span className="flex items-center gap-1"><Clock size={11} /> Check-out: {property.availability.checkOut}</span>
          )}
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     SHARED MODE
  ════════════════════════════════════════════════════════════ */
  if (isShared) {
    const rooms = property.rooms || [];
    const availableRooms = rooms.filter(r => r.available);

    return (
      <div className="p-5 space-y-4 bg-white border border-gray-100 shadow-card dark:bg-brand-charcoal-dark dark:border-white/10 rounded-2xl">
        {/* Header */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Rooms from</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
              {formatPrice(Math.min(...rooms.map(r => r.price)))}
            </span>
            <span className="text-sm text-gray-400">/mo</span>
          </div>
        </div>

        {/* Room selector */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-brand-charcoal-dark dark:text-white">
            {availableRooms.length} room{availableRooms.length !== 1 ? 's' : ''} available
          </p>
          {rooms.map(room => (
            <button
              key={room.id}
              type="button"
              disabled={!room.available}
              onClick={() => setSelectedRoom(room.available ? room.id : null)}
              className={[
                'w-full text-left p-3 rounded-xl border-2 transition-all',
                !room.available
                  ? 'opacity-50 cursor-not-allowed border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5'
                  : selectedRoom === room.id
                    ? 'border-brand-gold bg-brand-gold/5 dark:bg-brand-gold/10'
                    : 'border-gray-200 dark:border-white/10 hover:border-brand-gold/50',
              ].join(' ')}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{room.name}</span>
                <span className={`text-sm font-extrabold ${room.available ? 'text-brand-gold' : 'text-gray-400'}`}>
                  {room.available ? formatPrice(room.price) + room.pricePeriod : 'Taken'}
                </span>
              </div>
              {room.features && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {room.features.slice(0, 3).map(f => (
                    <span key={f} className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-white/10 rounded-full text-gray-500 dark:text-gray-400">{f}</span>
                  ))}
                  {room.features.length > 3 && (
                    <span className="text-[10px] text-gray-400">+{room.features.length - 3}</span>
                  )}
                </div>
              )}
              {room.sqm && <p className="text-[10px] text-gray-400 mt-1">{room.sqm}m²</p>}
            </button>
          ))}
        </div>

        {/* Inquiry button */}
        <button
          type="button"
          onClick={() => {
            const room = rooms.find(r => r.id === selectedRoom);
            onMessage?.({ roomName: room?.name });
          }}
          disabled={!selectedRoom}
          className="flex items-center justify-center w-full gap-2 py-4 text-sm font-bold text-white transition-colors shadow-lg bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl"
        >
          <MessageSquare size={16} /> Inquire About Room
        </button>

        {/* Book inspection */}
        {property.inspectionAvailable !== false && (
          <button
            type="button"
            onClick={onBookInspection}
            className="flex items-center justify-center w-full gap-2 py-3 text-sm font-bold transition-colors border-2 border-gray-200 dark:border-white/10 text-brand-charcoal-dark dark:text-white hover:border-brand-gold rounded-2xl"
          >
            <Calendar size={15} /> Book Viewing
          </button>
        )}

        {/* Deposit info */}
        <div className="p-3 space-y-2 bg-brand-gray-soft dark:bg-white/5 rounded-xl">
          {property.securityDeposit && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Security deposit</span>
              <span className="font-semibold text-brand-charcoal-dark dark:text-white">{formatPrice(property.securityDeposit)}</span>
            </div>
          )}
          {property.serviceCharge && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Service charge</span>
              <span className="font-semibold text-brand-charcoal-dark dark:text-white">{formatPrice(property.serviceCharge)}/mo</span>
            </div>
          )}
          {property.availability?.minStay && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Minimum stay</span>
              <span className="font-semibold text-brand-charcoal-dark dark:text-white">{property.availability.minStay} months</span>
            </div>
          )}
        </div>

        {/* Housemate count */}
        {property.housemates?.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Users size={13} />
            <span>{property.housemates.length} current housemate{property.housemates.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     STAY MODE
  ════════════════════════════════════════════════════════════ */
  if (isStay) {
    return (
      <div className="p-5 space-y-4 bg-white border border-gray-100 shadow-card dark:bg-brand-charcoal-dark dark:border-white/10 rounded-2xl">
        {/* Price header */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
              {formatPrice(property.pricePerMonth || property.price)}
            </span>
            <span className="text-sm text-gray-400">/mo</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Fully furnished, move-in ready</p>
        </div>

        {/* Lease duration */}
        <div className="p-3 border-2 border-gray-200 dark:border-white/10 rounded-xl">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lease Duration</label>
          <div className="flex items-center gap-3 mt-2">
            <button type="button" onClick={() => setStayMonths(m => Math.max(property.availability?.minStay || 1, m - 1))}
              className="flex items-center justify-center w-8 h-8 border border-gray-200 dark:border-white/10 rounded-full text-gray-400 hover:border-brand-gold hover:text-brand-gold transition-colors disabled:opacity-30"
              disabled={stayMonths <= (property.availability?.minStay || 1)}>
              <Minus size={14} />
            </button>
            <div className="flex-1 text-center">
              <span className="text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">{stayMonths}</span>
              <span className="ml-1 text-sm text-gray-400">month{stayMonths !== 1 ? 's' : ''}</span>
            </div>
            <button type="button" onClick={() => setStayMonths(m => Math.min(property.availability?.maxStay || 36, m + 1))}
              className="flex items-center justify-center w-8 h-8 border border-gray-200 dark:border-white/10 rounded-full text-gray-400 hover:border-brand-gold hover:text-brand-gold transition-colors disabled:opacity-30"
              disabled={stayMonths >= (property.availability?.maxStay || 36)}>
              <Plus size={14} />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-1">
            Min {property.availability?.minStay || 1} months • Max {property.availability?.maxStay || 24} months
          </p>
        </div>

        {/* Move-in cost breakdown */}
        {stayCalc && (
          <div className="p-4 space-y-2 bg-brand-gray-soft dark:bg-white/5 rounded-xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Move-in Cost Breakdown</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">First month rent</span>
              <span className="font-semibold text-brand-charcoal-dark dark:text-white">{formatPrice(stayCalc.monthly)}</span>
            </div>
            {stayCalc.deposit > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Security deposit</span>
                <span className="font-semibold text-brand-charcoal-dark dark:text-white">{formatPrice(stayCalc.deposit)}</span>
              </div>
            )}
            {stayCalc.caution > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Caution fee</span>
                <span className="font-semibold text-brand-charcoal-dark dark:text-white">{formatPrice(stayCalc.caution)}</span>
              </div>
            )}
            {stayCalc.service > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Service charge</span>
                <span className="font-semibold text-brand-charcoal-dark dark:text-white">{formatPrice(stayCalc.service)}</span>
              </div>
            )}
            {stayCalc.legal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Legal/agreement fee</span>
                <span className="font-semibold text-brand-charcoal-dark dark:text-white">{formatPrice(stayCalc.legal)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 text-sm border-t border-gray-200 dark:border-white/10">
              <span className="font-bold text-brand-charcoal-dark dark:text-white">Total move-in</span>
              <span className="font-extrabold text-brand-gold">{formatPrice(stayCalc.moveIn)}</span>
            </div>
          </div>
        )}

        {/* CTA buttons */}
        <button
          type="button"
          onClick={() => onMessage?.()}
          className="flex items-center justify-center w-full gap-2 py-4 text-sm font-bold text-white transition-colors shadow-lg bg-brand-gold hover:bg-brand-gold-dark rounded-2xl"
        >
          <MessageSquare size={16} /> Request to Stay
        </button>

        {property.inspectionAvailable && (
          <button
            type="button"
            onClick={onBookInspection}
            className="flex items-center justify-center w-full gap-2 py-3 text-sm font-bold transition-colors border-2 border-gray-200 dark:border-white/10 text-brand-charcoal-dark dark:text-white hover:border-brand-gold rounded-2xl"
          >
            <Calendar size={15} /> Book Inspection
          </button>
        )}

        {/* Lease terms */}
        {property.leaseTerms && (
          <div className="p-3 space-y-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
            <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Lease Terms</p>
            {property.leaseTerms.renewalNotice && (
              <p className="text-[11px] text-blue-600 dark:text-blue-400">Renewal: {property.leaseTerms.renewalNotice}</p>
            )}
            {property.leaseTerms.breakClause && (
              <p className="text-[11px] text-blue-600 dark:text-blue-400">Break clause: {property.leaseTerms.breakClause}</p>
            )}
          </div>
        )}

        {/* Escrow badge */}
        <div className="flex items-start gap-2.5 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
          <Shield size={14} className="text-emerald-500 mt-0.5 shrink-0" />
          <p className="text-[11px] leading-relaxed text-emerald-600 dark:text-emerald-400">
            Deposits protected by <strong>Aurban Escrow</strong>. Funds held securely until lease conditions are met.
          </p>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     DEFAULT MODE — Contact Agent (rental/buy/land/lease)
  ════════════════════════════════════════════════════════════ */
  return (
    <div className="p-5 space-y-4 bg-white border border-gray-100 shadow-card dark:bg-brand-charcoal-dark dark:border-white/10 rounded-2xl">
      <div>
        <span className="text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
          {formatPrice(property.price)}
        </span>
        {property.pricePeriod && (
          <span className="text-sm text-gray-400">{property.pricePeriod}</span>
        )}
      </div>
      <button
        type="button"
        onClick={onBookInspection}
        className="flex items-center justify-center w-full gap-2 py-4 text-sm font-bold text-white transition-colors shadow-lg bg-brand-gold hover:bg-brand-gold-dark rounded-2xl"
      >
        <Calendar size={16} /> Book Inspection
      </button>
      <button
        type="button"
        onClick={() => onMessage?.()}
        className="flex items-center justify-center w-full gap-2 py-3 text-sm font-bold transition-colors border-2 border-gray-200 dark:border-white/10 text-brand-charcoal-dark dark:text-white hover:border-brand-gold rounded-2xl"
      >
        <MessageSquare size={16} /> Message Agent
      </button>
    </div>
  );
}

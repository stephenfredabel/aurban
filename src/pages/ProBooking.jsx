import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, MapPin, Home as HomeIcon,
  Navigation, Loader2, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useProListing } from '../context/ProListingContext.jsx';
import { useProBooking } from '../context/ProBookingContext.jsx';
import { useCurrency } from '../hooks/useCurrency.js';
import useProBookingWizard from '../hooks/useProBookingWizard.js';
import { PRO_SERVICE_CATEGORY_MAP } from '../data/proServiceCategoryFields.js';
import {
  TIER_CONFIG, calculatePlatformFee, calculateCommitmentFee,
} from '../data/proConstants.js';
import { NIGERIAN_STATES } from '../context/PropertyContext.jsx';
import ProBookingSteps from '../components/pro/ProBookingSteps.jsx';
import ProSchedulePicker from '../components/pro/ProSchedulePicker.jsx';
import ProScopeForm from '../components/pro/ProScopeForm.jsx';
import ProPaymentSummary from '../components/pro/ProPaymentSummary.jsx';
import ProBookingConfirmation from '../components/pro/ProBookingConfirmation.jsx';
import ProTierBadge from '../components/pro/ProTierBadge.jsx';

/* ════════════════════════════════════════════════════════════
   PRO BOOKING WIZARD
   Route: /pro/book/:id (protected)

   Steps:
   0 — Service overview (confirm)
   1 — Schedule (date + time)
   2 — Location (state + LGA + address)
   3 — Scope (work description + photos)
   4 — Payment (breakdown + method + terms)
   5 — Confirmation (success + next steps)
════════════════════════════════════════════════════════════ */

export default function ProBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getListingById } = useProListing();
  const { addBooking } = useProBooking();
  const { symbol } = useCurrency();

  const service = getListingById(id);
  const wizard = useProBookingWizard(6);
  const { step, data, errors, stepLabels, isFirst, isConfirmation, updateField, updateLocation, next, prev } = wizard;

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (service) {
      updateField('serviceId', service.id);
    }
  }, [service, updateField]);

  useEffect(() => {
    document.title = service ? `Book — ${service.title}` : 'Book Service — Aurban Pro';
    window.scrollTo(0, 0);
  }, [step, service]);

  // Tier & pricing
  const tierCfg = TIER_CONFIG[service?.tier] || TIER_CONFIG[1];
  const platformFee = service?.price ? calculatePlatformFee(service.price) : 0;
  const total = (service?.price || 0) + platformFee;
  const commitmentAmount = service?.price ? calculateCommitmentFee(service.price, tierCfg.commitmentFeePercent) : 0;

  // Milestones for Tier 4
  const milestones = useMemo(() => {
    if (service?.tier !== 4 || !service?.price) return null;
    const catDef = PRO_SERVICE_CATEGORY_MAP[service.category];
    if (!catDef?.milestoneSchedule) return null;
    return catDef.milestoneSchedule.map(m => ({
      ...m,
      amount: Math.round(service.price * m.percent / 100),
    }));
  }, [service]);

  // Created booking (for confirmation step)
  const [createdBooking, setCreatedBooking] = useState(null);

  // Service not found
  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertCircle size={48} className="mb-4 text-gray-200 dark:text-gray-700" />
        <p className="mb-2 text-lg font-bold text-brand-charcoal-dark dark:text-white">Service not found</p>
        <p className="mb-5 text-sm text-gray-400">This listing may no longer be available.</p>
        <Link to="/pro" className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white rounded-xl bg-brand-gold hover:bg-brand-gold-dark">
          Browse Services
        </Link>
      </div>
    );
  }

  const catDef = PRO_SERVICE_CATEGORY_MAP[service.category];

  /* ── Handle booking submission (step 4 → 5) ── */
  async function handleSubmit() {
    if (!wizard.validateStep(4)) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      const ref = `PRO-${Date.now().toString(36).toUpperCase()}`;
      const booking = {
        id: `pb_${Date.now()}`,
        ref,
        serviceId: service.id,
        serviceTitle: service.title,
        category: service.category,
        tier: service.tier,
        providerId: service.providerId,
        providerName: service.providerName,
        clientId: user?.id || 'guest',
        clientName: user?.name || 'Guest User',
        status: 'confirmed',
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        location: data.location,
        scope: data.scope,
        scopePhotos: data.scopePhotos,
        price: service.price,
        platformFee,
        total,
        commitmentAmount,
        paymentMethod: data.paymentMethod,
        escrowStatus: 'held',
        createdAt: new Date().toISOString(),
        timeline: [
          { status: 'confirmed', at: new Date().toISOString(), note: 'Booking confirmed, payment held in escrow' },
        ],
      };

      addBooking(booking);
      setCreatedBooking(booking);
      wizard.goTo(5);
    } catch (err) {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Handle next / submit logic ── */
  function handleNext() {
    if (step === 4) {
      handleSubmit();
    } else {
      next();
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-brand-charcoal-dark">

      {/* ── Top bar ── */}
      {!isConfirmation && (
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 dark:bg-brand-charcoal-dark dark:border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 mx-auto max-w-2xl">
            <button
              onClick={() => step === 0 ? navigate(`/pro/${id}`) : prev()}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-gold transition-colors"
            >
              <ChevronLeft size={16} /> {step === 0 ? 'Back to service' : 'Back'}
            </button>
            <span className="flex-1" />
            <span className="text-xs text-gray-400">Step {step + 1} of 5</span>
          </div>

          {/* Step indicator */}
          <ProBookingSteps steps={stepLabels.slice(0, 5)} currentStep={step} />
        </div>
      )}

      {/* ── Main content ── */}
      <div className="px-4 py-6 mx-auto max-w-2xl">

        {/* === STEP 0: Service Overview === */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="mb-1 text-lg font-extrabold font-display text-brand-charcoal-dark dark:text-white">
                Confirm Service
              </h2>
              <p className="text-xs text-gray-400">Review the service details before proceeding</p>
            </div>

            <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
              {/* Service summary */}
              <div className="flex items-start gap-3 mb-4">
                <div className="flex items-center justify-center w-12 h-12 text-lg rounded-2xl shrink-0 bg-brand-gold/10 font-bold text-brand-gold">
                  {catDef?.icon || '🔧'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{service.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{service.providerName}</p>
                </div>
              </div>

              <div className="space-y-2.5 mb-4 pb-4 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Category</span>
                  <span className="font-semibold text-brand-charcoal-dark dark:text-white">{catDef?.label}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Tier</span>
                  <ProTierBadge tier={service.tier} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Observation Window</span>
                  <span className="font-semibold text-brand-charcoal-dark dark:text-white">{tierCfg.observationDays} days</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Location</span>
                  <span className="font-semibold text-brand-charcoal-dark dark:text-white">{service.state}</span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-brand-charcoal-dark dark:text-white">Service Price</span>
                <span className="text-lg font-extrabold font-display text-brand-gold">
                  {service.pricingMode === 'quote' ? 'Quote' : `${symbol}${service.price?.toLocaleString()}`}
                </span>
              </div>
            </div>

            {/* How escrow works mini */}
            <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
              <p className="mb-2 text-xs font-bold text-blue-700 dark:text-blue-300">How your payment is protected</p>
              <ul className="space-y-1.5 text-[11px] text-blue-600 dark:text-blue-300">
                <li>1. Full payment held securely in Aurban Escrow</li>
                <li>2. {tierCfg.commitmentFeePercent}% released when provider checks in (OTP verified)</li>
                <li>3. Balance released after {tierCfg.observationDays}-day observation window</li>
                <li>4. Report any issues during observation — escrow freezes automatically</li>
              </ul>
            </div>
          </div>
        )}

        {/* === STEP 1: Schedule === */}
        {step === 1 && (
          <ProSchedulePicker
            date={data.scheduledDate}
            time={data.scheduledTime}
            onDateChange={v => updateField('scheduledDate', v)}
            onTimeChange={v => updateField('scheduledTime', v)}
            errors={errors}
          />
        )}

        {/* === STEP 2: Location === */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="mb-1 text-sm font-bold text-brand-charcoal-dark dark:text-white">Where is the work location?</h3>
              <p className="mb-4 text-xs text-gray-400">This helps the provider plan logistics and verify check-in</p>
            </div>

            {/* State */}
            <div>
              <label className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                <MapPin size={12} /> State
              </label>
              <select
                value={data.location.state}
                onChange={e => updateLocation('state', e.target.value)}
                className={`w-full py-2.5 px-3 text-sm border rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none ${
                  errors?.state ? 'border-red-400' : 'border-gray-200 dark:border-white/10'
                }`}
              >
                <option value="">Select state</option>
                {NIGERIAN_STATES.filter(s => s !== 'All States').map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors?.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
            </div>

            {/* LGA */}
            <div>
              <label className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                <Navigation size={12} /> LGA / Area
              </label>
              <input
                type="text"
                value={data.location.lga}
                onChange={e => updateLocation('lga', e.target.value)}
                placeholder="e.g. Lekki, Ikeja, Wuse 2"
                className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none"
              />
            </div>

            {/* Address */}
            <div>
              <label className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                <HomeIcon size={12} /> Full Address
              </label>
              <textarea
                value={data.location.address}
                onChange={e => updateLocation('address', e.target.value)}
                placeholder="House number, street name, estate/neighbourhood"
                rows={3}
                className={`w-full py-2.5 px-3 text-sm border rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none resize-none ${
                  errors?.address ? 'border-red-400' : 'border-gray-200 dark:border-white/10'
                }`}
              />
              {errors?.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
            </div>

            {/* Landmark */}
            <div>
              <label className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                <MapPin size={12} /> Nearest Landmark (optional)
              </label>
              <input
                type="text"
                value={data.location.landmark}
                onChange={e => updateLocation('landmark', e.target.value)}
                placeholder="e.g. Opposite Shoprite, beside GTBank"
                className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none"
              />
            </div>

            {/* GPS note */}
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
              <p className="text-[11px] text-blue-700 dark:text-blue-300">
                <strong>GPS verification:</strong> On the day of service, the provider must check in within 200m of this location using GPS. This ensures they actually arrive.
              </p>
            </div>
          </div>
        )}

        {/* === STEP 3: Scope === */}
        {step === 3 && (
          <ProScopeForm
            scope={data.scope}
            scopePhotos={data.scopePhotos}
            onChange={v => updateField('scope', v)}
            onPhotosChange={v => updateField('scopePhotos', v)}
            errors={errors}
          />
        )}

        {/* === STEP 4: Payment === */}
        {step === 4 && (
          <ProPaymentSummary
            price={service.price}
            tier={service.tier}
            paymentMethod={data.paymentMethod}
            onPaymentMethodChange={v => updateField('paymentMethod', v)}
            agreedToTerms={data.agreedToTerms}
            onAgreeChange={v => updateField('agreedToTerms', v)}
            errors={errors}
            milestones={milestones}
          />
        )}

        {/* === STEP 5: Confirmation === */}
        {step === 5 && (
          <ProBookingConfirmation booking={createdBooking} service={service} />
        )}

        {/* ── Submit error ── */}
        {submitError && (
          <div className="flex items-center gap-2 p-3 mt-4 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 rounded-xl">
            <AlertCircle size={16} />
            {submitError}
          </div>
        )}

        {/* ── Navigation buttons ── */}
        {!isConfirmation && (
          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-white/10">
            {!isFirst && (
              <button
                onClick={prev}
                className="flex items-center gap-1.5 px-5 py-3 text-sm font-bold border border-gray-200 dark:border-white/10 rounded-xl text-brand-charcoal-dark dark:text-white hover:border-brand-gold transition-colors"
              >
                <ChevronLeft size={16} /> Back
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={submitting}
              className="flex items-center justify-center gap-2 flex-1 px-5 py-3 text-sm font-bold text-white rounded-xl bg-brand-gold hover:bg-brand-gold-dark transition-colors disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Processing...
                </>
              ) : step === 4 ? (
                <>Confirm & Pay {symbol}{total.toLocaleString()}</>
              ) : (
                <>
                  Continue <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Aurban Pro — Constants, Status Enums & Configuration
// All status flows, tier config, OTP settings, SLA targets,
// fee structure, and rectification timings
// ─────────────────────────────────────────────────────────────

/* ══════════════════════════════════════════════════════════════
   BOOKING STATUS FLOW
   confirmed → provider_confirmed → en_route → checked_in →
   in_progress → complete → observation → paid → completed
   ├── cancelled (pre-arrival)
   ├── no_show (provider didn't arrive)
   ├── disputed (observation phase)
   └── rectification (post-complete, before paid)
══════════════════════════════════════════════════════════════ */

export const PRO_BOOKING_STATUSES = {
  pending:              { label: 'Pending',              color: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400',       step: 0 },
  confirmed:            { label: 'Confirmed',            color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',         step: 1 },
  provider_confirmed:   { label: 'Provider Confirmed',   color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400',         step: 2 },
  en_route:             { label: 'En Route',             color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400', step: 3 },
  checked_in:           { label: 'Checked In (OTP)',     color: 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400',         step: 4 },
  in_progress:          { label: 'In Progress',          color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',     step: 5 },
  complete:             { label: 'Work Complete',        color: 'bg-lime-50 text-lime-600 dark:bg-lime-500/15 dark:text-lime-400',         step: 6 },
  observation:          { label: 'Observation Window',   color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400', step: 7 },
  paid:                 { label: 'Balance Released',     color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400', step: 8 },
  completed:            { label: 'Completed',            color: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400',     step: 9 },
  cancelled:            { label: 'Cancelled',            color: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400',             step: -1 },
  no_show:              { label: 'No-Show',              color: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',         step: -1 },
  disputed:             { label: 'Disputed',             color: 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400', step: -1 },
  rectification:        { label: 'Rectification',        color: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400', step: -1 },
};

/** Ordered step labels for timeline display */
export const PRO_BOOKING_STEP_LABELS = [
  'Pending', 'Confirmed', 'Provider Confirmed', 'En Route',
  'Checked In', 'In Progress', 'Complete', 'Observation', 'Balance Released', 'Completed',
];


/* ══════════════════════════════════════════════════════════════
   ESCROW STATUS FLOW
   held → commitment_released → observation_active →
   released → completed
   ├── frozen (dispute / SOS)
   ├── refunded (after admin ruling)
   └── auto_released (observation expired with no issues)
══════════════════════════════════════════════════════════════ */

export const PRO_ESCROW_STATUSES = {
  held:                 { label: 'Held in Escrow',       color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400' },
  commitment_released:  { label: 'Commitment Released',  color: 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400' },
  observation_active:   { label: 'Observation Active',   color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400' },
  released:             { label: 'Released to Provider',  color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' },
  auto_released:        { label: 'Auto-Released',        color: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400' },
  frozen:               { label: 'Frozen',               color: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400' },
  refunded:             { label: 'Refunded',             color: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400' },
  milestone_partial:    { label: 'Milestone (Partial)',  color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400' },
};


/* ══════════════════════════════════════════════════════════════
   RECTIFICATION STATUS FLOW
   reported → provider_notified → fix_scheduled →
   fix_in_progress → fix_complete → mini_observation →
   resolved
   └── escalated (provider refuses / fix fails)
══════════════════════════════════════════════════════════════ */

export const PRO_RECTIFICATION_STATUSES = {
  reported:             { label: 'Issue Reported',       color: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400' },
  provider_notified:    { label: 'Provider Notified',    color: 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400' },
  fix_scheduled:        { label: 'Fix Scheduled',        color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400' },
  fix_in_progress:      { label: 'Fix In Progress',      color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400' },
  fix_complete:         { label: 'Fix Complete',         color: 'bg-lime-50 text-lime-600 dark:bg-lime-500/15 dark:text-lime-400' },
  mini_observation:     { label: 'Mini-Observation',     color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400' },
  resolved:             { label: 'Resolved',             color: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400' },
  escalated:            { label: 'Escalated to Admin',   color: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400' },
};


/* ══════════════════════════════════════════════════════════════
   TIER 4 MILESTONE STATUSES
   mobilization → phase_2 → phase_3 → retention → completed
══════════════════════════════════════════════════════════════ */

export const PRO_TIER4_STATUSES = {
  mobilization:   { label: 'Mobilization (30%)',  color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',         phase: 1, percent: 30 },
  phase_2:        { label: 'Structure (40%)',     color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400', phase: 2, percent: 40 },
  phase_3:        { label: 'Finishing (20%)',     color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400', phase: 3, percent: 20 },
  retention:      { label: 'Retention (10%)',     color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',     phase: 4, percent: 10 },
  completed:      { label: 'Completed',           color: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400',     phase: 5, percent: 0 },
};


/* ══════════════════════════════════════════════════════════════
   TIER CONFIGURATION
══════════════════════════════════════════════════════════════ */

export const TIER_CONFIG = {
  1: {
    label: 'Tier 1 — Visual / Immediate',
    shortLabel: 'Tier 1',
    desc: 'Quick visual jobs like cleaning, fumigation, painting',
    observationDays: 3,
    commitmentFeePercent: 20,
    color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    badgeColor: 'bg-emerald-500',
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
  },
  2: {
    label: 'Tier 2 — Functional',
    shortLabel: 'Tier 2',
    desc: 'Functional work — plumbing, electrical, tiling, handyman',
    observationDays: 5,
    commitmentFeePercent: 25,
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
    badgeColor: 'bg-blue-500',
    iconBg: 'bg-blue-100 dark:bg-blue-500/20',
  },
  3: {
    label: 'Tier 3 — Complex / Specialist',
    shortLabel: 'Tier 3',
    desc: 'Complex specialist work — AC/HVAC, solar, security systems',
    observationDays: 7,
    commitmentFeePercent: 30,
    color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400',
    badgeColor: 'bg-purple-500',
    iconBg: 'bg-purple-100 dark:bg-purple-500/20',
  },
  4: {
    label: 'Tier 4 — Custom / Project',
    shortLabel: 'Tier 4',
    desc: 'Large projects — construction, renovation, milestone payments',
    observationDays: 14,
    commitmentFeePercent: 30,
    color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    badgeColor: 'bg-amber-500',
    iconBg: 'bg-amber-100 dark:bg-amber-500/20',
    hasMilestones: true,
  },
};


/* ══════════════════════════════════════════════════════════════
   PROVIDER LEVELS
══════════════════════════════════════════════════════════════ */

export const PRO_PROVIDER_LEVELS = {
  new:       { label: 'New Pro',     color: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400',       minJobs: 0 },
  verified:  { label: 'Verified',    color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',         minJobs: 5 },
  top:       { label: 'Top Pro',     color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400', minJobs: 25 },
  gold:      { label: 'Gold Pro',    color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',     minJobs: 100 },
};


/* ══════════════════════════════════════════════════════════════
   OTP CONFIGURATION
══════════════════════════════════════════════════════════════ */

export const OTP_CONFIG = {
  length: 6,
  expiryMinutes: 30,
  maxAttempts: 3,
  cooldownMinutes: 5,
  regenerateAfterMinutes: 15,
};


/* ══════════════════════════════════════════════════════════════
   GPS VERIFICATION CONFIG
══════════════════════════════════════════════════════════════ */

export const GPS_CONFIG = {
  radiusMeters: 200,
  accuracyThresholdMeters: 50,
  timeoutMs: 15_000,
  maxRetries: 3,
};


/* ══════════════════════════════════════════════════════════════
   RECTIFICATION TIMINGS
══════════════════════════════════════════════════════════════ */

export const RECTIFICATION_CONFIG = {
  providerResponseHours: 24,
  fixDeadlineHours: 72,
  miniObservationDays: 2,
  autoEscalateAfterHours: 72,
  maxRectificationAttempts: 2,
};


/* ══════════════════════════════════════════════════════════════
   SLA TARGETS
══════════════════════════════════════════════════════════════ */

export const SLA_TARGETS = {
  providerConfirmationHours: 4,
  noShowGracePeriodMinutes: 30,
  sosResponseMinutes: 5,
  adminEscalationHours: 24,
  refundProcessingDays: 3,
};


/* ══════════════════════════════════════════════════════════════
   FEE STRUCTURE
══════════════════════════════════════════════════════════════ */

export const PRO_FEE_STRUCTURE = {
  platformFeePercent: 10,
  minPlatformFee: 500,
  maxPlatformFee: 50_000,
  cancellationFees: {
    before_24h: 0,
    within_24h: 10,
    after_provider_confirmed: 25,
    after_en_route: 50,
    after_checked_in: 100,
  },
  noShowPenalty: {
    providerPercent: 100,
    clientPercent: 25,
  },
};


/* ══════════════════════════════════════════════════════════════
   PRICING MODE LABELS
══════════════════════════════════════════════════════════════ */

export const PRO_PRICING_MODES = {
  per_job:   { label: 'Per Job',     desc: 'Fixed price for the entire job' },
  per_sqm:   { label: 'Per Sqm',     desc: 'Price per square meter' },
  per_hour:  { label: 'Per Hour',    desc: 'Hourly rate' },
  per_day:   { label: 'Per Day',     desc: 'Daily rate' },
  quote:     { label: 'Custom Quote', desc: 'Price negotiated per project' },
};


/* ══════════════════════════════════════════════════════════════
   ISSUE CATEGORIES (for rectification reports)
══════════════════════════════════════════════════════════════ */

export const PRO_ISSUE_CATEGORIES = [
  { id: 'incomplete_work',   label: 'Incomplete Work',       desc: 'Provider didn\'t finish all agreed tasks' },
  { id: 'poor_quality',      label: 'Poor Quality',          desc: 'Work quality below acceptable standard' },
  { id: 'wrong_materials',   label: 'Wrong Materials Used',  desc: 'Materials differ from what was agreed' },
  { id: 'damage',            label: 'Property Damage',       desc: 'Provider caused damage during work' },
  { id: 'scope_deviation',   label: 'Scope Deviation',       desc: 'Work done differs from agreed scope' },
  { id: 'safety_concern',    label: 'Safety Concern',        desc: 'Unsafe work that poses a risk' },
  { id: 'late_completion',   label: 'Late Completion',       desc: 'Significantly exceeded estimated duration' },
  { id: 'other',             label: 'Other',                 desc: 'Issue not covered above' },
];


/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */

/** Get human-readable label for any Pro booking status */
export function getProBookingStatusLabel(status) {
  return PRO_BOOKING_STATUSES[status]?.label ?? status;
}

/** Get color classes for any Pro booking status */
export function getProBookingStatusColor(status) {
  return PRO_BOOKING_STATUSES[status]?.color ?? 'bg-gray-100 text-gray-600';
}

/** Get tier config by number */
export function getTierConfig(tier) {
  return TIER_CONFIG[tier] ?? TIER_CONFIG[1];
}

/** Calculate platform fee for a given amount */
export function calculatePlatformFee(amount) {
  const fee = Math.round(amount * PRO_FEE_STRUCTURE.platformFeePercent / 100);
  return Math.max(PRO_FEE_STRUCTURE.minPlatformFee, Math.min(fee, PRO_FEE_STRUCTURE.maxPlatformFee));
}

/** Calculate commitment fee from total */
export function calculateCommitmentFee(total, commitmentPercent) {
  return Math.round(total * commitmentPercent / 100);
}

/** Calculate cancellation fee from total based on booking status */
export function calculateCancellationFee(total, bookingStatus) {
  const percent = PRO_FEE_STRUCTURE.cancellationFees[bookingStatus] ?? 0;
  return Math.round(total * percent / 100);
}

/** Check if a booking status is terminal (no further transitions) */
export function isTerminalStatus(status) {
  return ['completed', 'cancelled', 'refunded'].includes(status);
}

/** Check if a booking is in an active phase (provider working) */
export function isActiveBooking(status) {
  return ['checked_in', 'in_progress'].includes(status);
}

/** Check if a booking is in the observation phase */
export function isInObservation(status) {
  return status === 'observation';
}

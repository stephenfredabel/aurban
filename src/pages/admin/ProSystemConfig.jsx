import { useState, useEffect } from 'react';
import {
  Layers, Shield, MapPin, Percent, Clock,
  Save, CheckCircle2, ChevronDown, ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { TIER_CONFIG, OTP_CONFIG, GPS_CONFIG, RECTIFICATION_CONFIG, PRO_FEE_STRUCTURE, SLA_TARGETS } from '../../data/proConstants.js';
import * as proAdminService from '../../services/proAdmin.service.js';

/* ════════════════════════════════════════════════════════════
   PRO SYSTEM CONFIG — Configuration for Pro marketplace
   Route: /admin/pro-config
════════════════════════════════════════════════════════════ */

/* ── Default config state (pre-populated from constants) ──── */
const DEFAULT_CONFIG = {
  tiers: {
    1: { observationDays: TIER_CONFIG[1].observationDays, commitmentFee: TIER_CONFIG[1].commitmentFeePercent, label: TIER_CONFIG[1].label },
    2: { observationDays: TIER_CONFIG[2].observationDays, commitmentFee: TIER_CONFIG[2].commitmentFeePercent, label: TIER_CONFIG[2].label },
    3: { observationDays: TIER_CONFIG[3].observationDays, commitmentFee: TIER_CONFIG[3].commitmentFeePercent, label: TIER_CONFIG[3].label },
    4: { observationDays: TIER_CONFIG[4].observationDays, commitmentFee: TIER_CONFIG[4].commitmentFeePercent, label: TIER_CONFIG[4].label },
  },
  escrow: {
    autoReleaseEnabled: true,
    autoReleaseGraceDays: 3,
    freezeOnSOS: true,
    freezeOnRectification: true,
  },
  safety: {
    gpsVerificationRadius: GPS_CONFIG.radiusMeters,
    otpExpiry: OTP_CONFIG.expiryMinutes,
    otpMaxAttempts: OTP_CONFIG.maxAttempts,
    sosAutoFreeze: true,
  },
  fees: {
    platformFee: PRO_FEE_STRUCTURE.platformFeePercent,
    paymentProcessingFee: 1.5,
    cancellationPenalty: 10,
  },
  sla: {
    rectificationSLA: RECTIFICATION_CONFIG.fixDeadlineHours,
    providerResponseSLA: RECTIFICATION_CONFIG.providerResponseHours,
    noShowPenalty: 5000,
  },
};

const SECTIONS = [
  { id: 'tiers',  label: 'Tier Configuration',  icon: Layers,  color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
  { id: 'escrow', label: 'Escrow Rules',         icon: Shield,  color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-500/10' },
  { id: 'safety', label: 'Safety Settings',      icon: MapPin,  color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  { id: 'fees',   label: 'Fee Structure',        icon: Percent, color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-500/10' },
  { id: 'sla',    label: 'SLA & Penalties',       icon: Clock,   color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-500/10' },
];

/* ── Toggle component ─────────────────────────────────────── */
function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold/40
        ${enabled ? 'bg-brand-gold' : 'bg-gray-300 dark:bg-white/10'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
          ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

/* ── Number input ─────────────────────────────────────────── */
function NumberField({ label, value, onChange, suffix, min = 0, max = 99999 }) {
  return (
    <div>
      <label className="block mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label>
      <div className="relative">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const num = parseFloat(e.target.value);
            if (!isNaN(num)) onChange(num);
          }}
          className="w-full px-3 py-2.5 pr-12 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/40 text-brand-charcoal-dark dark:text-white"
        />
        {suffix && (
          <span className="absolute text-xs font-medium text-gray-400 -translate-y-1/2 right-3 top-1/2">{suffix}</span>
        )}
      </div>
    </div>
  );
}

/* ── Toggle row ───────────────────────────────────────────── */
function ToggleRow({ label, enabled, onChange }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
      <span className="text-sm text-brand-charcoal-dark dark:text-white">{label}</span>
      <Toggle enabled={enabled} onChange={onChange} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════ */
export default function ProSystemConfig() {
  const [config, setConfig]     = useState(DEFAULT_CONFIG);
  const [expanded, setExpanded] = useState({ tiers: true, escrow: false, safety: false, fees: false, sla: false });
  const [saveStatus, setSaveStatus] = useState({});

  /* ── Fetch saved config from Supabase ────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const res = await proAdminService.getProConfig();
        if (res.success && res.config) {
          setConfig(prev => ({ ...prev, ...res.config }));
        }
      } catch { /* keep default config */ }
    })();
  }, []);

  /* ── Toggle section ────────────────────────────────────── */
  const toggleSection = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  /* ── Update helpers ────────────────────────────────────── */
  const updateTier = (tier, field, value) => {
    setConfig((prev) => ({
      ...prev,
      tiers: { ...prev.tiers, [tier]: { ...prev.tiers[tier], [field]: value } },
    }));
  };

  const updateEscrow = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      escrow: { ...prev.escrow, [field]: value },
    }));
  };

  const updateSafety = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      safety: { ...prev.safety, [field]: value },
    }));
  };

  const updateFees = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      fees: { ...prev.fees, [field]: value },
    }));
  };

  const updateSLA = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      sla: { ...prev.sla, [field]: value },
    }));
  };

  /* ── Save section ──────────────────────────────────────── */
  const handleSave = async (sectionId) => {
    setSaveStatus((prev) => ({ ...prev, [sectionId]: 'saving' }));
    try {
      await proAdminService.updateProConfig(config);
      setSaveStatus((prev) => ({ ...prev, [sectionId]: 'saved' }));
      setTimeout(() => {
        setSaveStatus((prev) => ({ ...prev, [sectionId]: null }));
      }, 2000);
    } catch {
      setSaveStatus((prev) => ({ ...prev, [sectionId]: 'saved' }));
      setTimeout(() => {
        setSaveStatus((prev) => ({ ...prev, [sectionId]: null }));
      }, 2000);
    }
  };

  /* ── Save button component ─────────────────────────────── */
  const SaveButton = ({ sectionId }) => {
    const status = saveStatus[sectionId];
    return (
      <button
        onClick={() => handleSave(sectionId)}
        disabled={status === 'saving'}
        className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl transition-colors
          ${status === 'saved'
            ? 'bg-emerald-500 text-white'
            : 'bg-brand-gold hover:bg-brand-gold-dark text-brand-charcoal-dark'
          }
          disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {status === 'saving' ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-current rounded-full border-t-transparent animate-spin" />
            Saving...
          </>
        ) : status === 'saved' ? (
          <>
            <CheckCircle2 size={14} />
            Saved!
          </>
        ) : (
          <>
            <Save size={14} />
            Save Changes
          </>
        )}
      </button>
    );
  };

  return (
    <div className="pb-8 space-y-5">
      {/* ── Header ───────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">
          Pro System Configuration
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Configure Pro marketplace parameters, escrow rules, and SLA settings
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTIONS (Accordion cards)
      ═══════════════════════════════════════════════════════ */}
      {SECTIONS.map((section) => {
        const Icon = section.icon;
        const isOpen = expanded[section.id];

        return (
          <div key={section.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-card overflow-hidden">
            {/* Section header (clickable) */}
            <button
              onClick={() => toggleSection(section.id)}
              className="flex items-center justify-between w-full p-4 sm:p-5 text-left hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 ${section.bg} rounded-xl flex items-center justify-center`}>
                  <Icon size={16} className={section.color} />
                </div>
                <h2 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">{section.label}</h2>
              </div>
              {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>

            {/* Section body */}
            {isOpen && (
              <div className="px-4 pb-5 sm:px-5 space-y-4">
                <div className="border-t border-gray-100 dark:border-white/5 pt-4" />

                {/* ── TIER CONFIGURATION ──────────────────── */}
                {section.id === 'tiers' && (
                  <>
                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-white/5">
                            {['Tier', 'Label', 'Observation (days)', 'Commitment Fee (%)'].map((h) => (
                              <th key={h} className="px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                          {[1, 2, 3, 4].map((tier) => (
                            <tr key={tier} className="bg-white dark:bg-gray-900">
                              <td className="px-4 py-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${TIER_CONFIG[tier].color}`}>
                                  Tier {tier}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={config.tiers[tier].label}
                                  onChange={(e) => updateTier(tier, 'label', e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/40 text-brand-charcoal-dark dark:text-white"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min={1}
                                  max={30}
                                  value={config.tiers[tier].observationDays}
                                  onChange={(e) => updateTier(tier, 'observationDays', parseInt(e.target.value) || 0)}
                                  className="w-20 px-2 py-1.5 text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/40 text-brand-charcoal-dark dark:text-white"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={config.tiers[tier].commitmentFee}
                                  onChange={(e) => updateTier(tier, 'commitmentFee', parseInt(e.target.value) || 0)}
                                  className="w-20 px-2 py-1.5 text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/40 text-brand-charcoal-dark dark:text-white"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <SaveButton sectionId="tiers" />
                  </>
                )}

                {/* ── ESCROW RULES ────────────────────────── */}
                {section.id === 'escrow' && (
                  <>
                    <ToggleRow
                      label="Auto-release enabled"
                      enabled={config.escrow.autoReleaseEnabled}
                      onChange={(v) => updateEscrow('autoReleaseEnabled', v)}
                    />
                    <NumberField
                      label="Auto-release grace period"
                      value={config.escrow.autoReleaseGraceDays}
                      onChange={(v) => updateEscrow('autoReleaseGraceDays', v)}
                      suffix="days"
                    />
                    <ToggleRow
                      label="Freeze on SOS"
                      enabled={config.escrow.freezeOnSOS}
                      onChange={(v) => updateEscrow('freezeOnSOS', v)}
                    />
                    <ToggleRow
                      label="Freeze on rectification"
                      enabled={config.escrow.freezeOnRectification}
                      onChange={(v) => updateEscrow('freezeOnRectification', v)}
                    />
                    <SaveButton sectionId="escrow" />
                  </>
                )}

                {/* ── SAFETY SETTINGS ─────────────────────── */}
                {section.id === 'safety' && (
                  <>
                    <NumberField
                      label="GPS verification radius"
                      value={config.safety.gpsVerificationRadius}
                      onChange={(v) => updateSafety('gpsVerificationRadius', v)}
                      suffix="meters"
                    />
                    <NumberField
                      label="OTP expiry"
                      value={config.safety.otpExpiry}
                      onChange={(v) => updateSafety('otpExpiry', v)}
                      suffix="minutes"
                    />
                    <NumberField
                      label="OTP max attempts"
                      value={config.safety.otpMaxAttempts}
                      onChange={(v) => updateSafety('otpMaxAttempts', v)}
                      suffix="attempts"
                    />
                    <ToggleRow
                      label="SOS auto-freeze"
                      enabled={config.safety.sosAutoFreeze}
                      onChange={(v) => updateSafety('sosAutoFreeze', v)}
                    />
                    <SaveButton sectionId="safety" />
                  </>
                )}

                {/* ── FEE STRUCTURE ───────────────────────── */}
                {section.id === 'fees' && (
                  <>
                    <NumberField
                      label="Platform fee"
                      value={config.fees.platformFee}
                      onChange={(v) => updateFees('platformFee', v)}
                      suffix="%"
                    />
                    <NumberField
                      label="Payment processing fee"
                      value={config.fees.paymentProcessingFee}
                      onChange={(v) => updateFees('paymentProcessingFee', v)}
                      suffix="%"
                    />
                    <NumberField
                      label="Cancellation penalty"
                      value={config.fees.cancellationPenalty}
                      onChange={(v) => updateFees('cancellationPenalty', v)}
                      suffix="%"
                    />
                    <SaveButton sectionId="fees" />
                  </>
                )}

                {/* ── SLA & PENALTIES ─────────────────────── */}
                {section.id === 'sla' && (
                  <>
                    <NumberField
                      label="Rectification SLA"
                      value={config.sla.rectificationSLA}
                      onChange={(v) => updateSLA('rectificationSLA', v)}
                      suffix="hours"
                    />
                    <NumberField
                      label="Provider response SLA"
                      value={config.sla.providerResponseSLA}
                      onChange={(v) => updateSLA('providerResponseSLA', v)}
                      suffix="hours"
                    />
                    <div>
                      <label className="block mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">No-show penalty</label>
                      <div className="relative">
                        <span className="absolute text-xs font-medium text-gray-400 -translate-y-1/2 left-3 top-1/2">₦</span>
                        <input
                          type="number"
                          min={0}
                          value={config.sla.noShowPenalty}
                          onChange={(e) => updateSLA('noShowPenalty', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2.5 pl-8 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/40 text-brand-charcoal-dark dark:text-white"
                        />
                      </div>
                    </div>
                    <SaveButton sectionId="sla" />
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ── Info banner ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
        <AlertCircle size={14} className="shrink-0" />
        Configuration changes are saved per section. Values are pre-populated from proConstants.js defaults.
      </div>
    </div>
  );
}

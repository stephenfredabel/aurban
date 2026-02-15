import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings, Percent, ToggleLeft, ToggleRight,
  Megaphone, Save, AlertCircle, CheckCircle2,
} from 'lucide-react';
import * as adminService from '../../services/admin.service.js';
import RequirePermission from '../../components/admin/RequirePermission.jsx';
import ConfirmAction from '../../components/admin/ConfirmAction.jsx';
import useAdminAction from '../../hooks/useAdminAction.js';
import { AUDIT_ACTIONS } from '../../services/audit.service.js';

/* ════════════════════════════════════════════════════════════
   PLATFORM SETTINGS — Commission, feature toggles, announcements
   Route: /admin/settings
════════════════════════════════════════════════════════════ */

/* ── Mock settings (dev fallback) ────────────────────────── */
const MOCK_SETTINGS = {
  commission: {
    providerCommission: 10,
    escrowFee: 2.5,
    paymentProcessingFee: 1.5,
  },
  features: {
    socialLogin:      true,
    whatsappOtp:      true,
    mapIntegration:   true,
    cacLookup:        false,
    marketplace:      true,
  },
  announcement: {
    text: '',
    enabled: false,
  },
};

const FEATURE_LABELS = {
  socialLogin:    'Social Login',
  whatsappOtp:    'WhatsApp OTP',
  mapIntegration: 'Map Integration',
  cacLookup:      'CAC Lookup',
  marketplace:    'Marketplace',
};

const COMMISSION_FIELDS = [
  { key: 'providerCommission',  label: 'Provider Commission',     suffix: '%' },
  { key: 'escrowFee',           label: 'Escrow Fee',              suffix: '%' },
  { key: 'paymentProcessingFee', label: 'Payment Processing Fee', suffix: '%' },
];

export default function PlatformSettings() {
  const { t } = useTranslation('admin');

  const [settings, setSettings] = useState(MOCK_SETTINGS);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    document.title = t('settings.title', 'Platform Settings') + ' — Aurban';
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await adminService.getSettings();
        if (!cancelled && res.success && res.settings) {
          setSettings(res.settings);
          setUsingFallback(false);
        } else if (!cancelled) {
          setUsingFallback(true);
        }
      } catch {
        if (!cancelled) setUsingFallback(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  /* ── Handlers ───────────────────────────────────────────── */
  const updateCommission = (key, value) => {
    const num = parseFloat(value);
    if (isNaN(num) && value !== '') return;
    setSettings((prev) => ({
      ...prev,
      commission: { ...prev.commission, [key]: value === '' ? '' : num },
    }));
  };

  const toggleFeature = (key) => {
    setSettings((prev) => ({
      ...prev,
      features: { ...prev.features, [key]: !prev.features[key] },
    }));
  };

  const updateAnnouncement = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      announcement: { ...prev.announcement, [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await adminService.updateSettings(settings);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch {
      // fail silently — user sees no success message
    } finally {
      setSaving(false);
    }
  };

  /* ── Admin action for save settings (CRITICAL — requires password re-entry) */
  const saveAction = useAdminAction({
    permission: 'settings:edit',
    action: AUDIT_ACTIONS.SETTINGS_UPDATE,
    onExecute: () => handleSave(),
  });

  if (loading) {
    return (
      <div className="pb-8 space-y-5">
        <div className="h-8 bg-gray-200 dark:bg-white/5 rounded-lg w-48 animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 bg-white dark:bg-gray-900 rounded-2xl shadow-card animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <RequirePermission permission="settings:view">
    <div className="pb-8 space-y-5">
      {/* ── Fallback banner ──────────────────────────────────── */}
      {usingFallback && (
        <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
          <AlertCircle size={14} className="shrink-0" />
          {t('fallback', 'Could not reach server. Showing cached data.')}
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">
          {t('settings.title', 'Platform Settings')}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {t('settings.subtitle', 'Configure commission, features, and announcements')}
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════
          1. Commission Settings
      ═══════════════════════════════════════════════════════ */}
      <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center w-8 h-8 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
            <Percent size={16} className="text-amber-500" />
          </div>
          <h2 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">
            {t('settings.commission.title', 'Commission Settings')}
          </h2>
        </div>

        <div className="space-y-4">
          {COMMISSION_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="block mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                {t(`settings.commission.${field.key}`, field.label)}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={settings.commission[field.key]}
                  onChange={(e) => updateCommission(field.key, e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/40 text-brand-charcoal-dark dark:text-white"
                />
                <span className="absolute text-xs font-medium text-gray-400 -translate-y-1/2 right-3 top-1/2">
                  {field.suffix}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. Feature Toggles
      ═══════════════════════════════════════════════════════ */}
      <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
            <Settings size={16} className="text-blue-500" />
          </div>
          <h2 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">
            {t('settings.features.title', 'Feature Toggles')}
          </h2>
        </div>

        <div className="space-y-3">
          {Object.entries(settings.features).map(([key, enabled]) => (
            <div key={key} className="flex items-center justify-between p-3 transition-colors rounded-xl hover:bg-gray-50 dark:hover:bg-white/5">
              <span className="text-sm text-brand-charcoal-dark dark:text-white">
                {t(`settings.features.${key}`, FEATURE_LABELS[key] || key)}
              </span>
              <button
                onClick={() => toggleFeature(key)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold/40
                  ${enabled ? 'bg-brand-gold' : 'bg-gray-300 dark:bg-white/10'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                    ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. Announcements
      ═══════════════════════════════════════════════════════ */}
      <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center w-8 h-8 bg-purple-50 dark:bg-purple-500/10 rounded-lg">
            <Megaphone size={16} className="text-purple-500" />
          </div>
          <h2 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">
            {t('settings.announcement.title', 'Platform Announcement')}
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('settings.announcement.textLabel', 'Announcement Banner Text')}
            </label>
            <textarea
              rows={3}
              value={settings.announcement.text}
              onChange={(e) => updateAnnouncement('text', e.target.value)}
              placeholder={t('settings.announcement.placeholder', 'Enter platform-wide announcement...')}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/40 text-brand-charcoal-dark dark:text-white placeholder-gray-400 resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5">
            <span className="text-sm text-brand-charcoal-dark dark:text-white">
              {t('settings.announcement.enableLabel', 'Show announcement banner')}
            </span>
            <button
              onClick={() => updateAnnouncement('enabled', !settings.announcement.enabled)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold/40
                ${settings.announcement.enabled ? 'bg-brand-gold' : 'bg-gray-300 dark:bg-white/10'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                  ${settings.announcement.enabled ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>

          {/* Preview */}
          {settings.announcement.enabled && settings.announcement.text && (
            <div className="p-3 bg-brand-gold/10 border border-brand-gold/20 rounded-xl">
              <p className="mb-1 text-[10px] text-gray-400 uppercase font-semibold tracking-wider">
                {t('settings.announcement.preview', 'Preview')}
              </p>
              <p className="text-sm text-brand-charcoal-dark dark:text-white">{settings.announcement.text}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Save button ──────────────────────────────────────── */}
      <button
        onClick={() => saveAction.execute()}
        disabled={saving}
        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 text-sm font-bold transition-colors rounded-xl
          ${saveSuccess
            ? 'bg-emerald-500 text-white'
            : 'bg-brand-gold hover:bg-brand-gold-dark text-brand-charcoal-dark'
          }
          disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {saving ? (
          <>
            <span className="w-4 h-4 border-2 border-current rounded-full border-t-transparent animate-spin" />
            {t('settings.saving', 'Saving...')}
          </>
        ) : saveSuccess ? (
          <>
            <CheckCircle2 size={16} />
            {t('settings.saved', 'Settings Saved!')}
          </>
        ) : (
          <>
            <Save size={16} />
            {t('settings.save', 'Save Settings')}
          </>
        )}
      </button>

      {/* ── Confirm modal for save settings ──────────────────── */}
      <ConfirmAction {...saveAction.confirmProps} />
    </div>
    </RequirePermission>
  );
}

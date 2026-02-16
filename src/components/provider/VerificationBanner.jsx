import { Link } from 'react-router-dom';
import {
  AlertCircle, CheckCircle2, Clock, ShieldAlert,
  FileText, ArrowRight, Mail, Phone, X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

/* ════════════════════════════════════════════════════════════
   VERIFICATION BANNER — Shown in provider dashboard when
   the provider's account is not fully verified.

   Statuses:
   • unverified   — Just registered, no documents submitted
   • pending      — Documents submitted, awaiting admin review
   • approved     — Fully verified (banner hidden)
   • rejected     — Verification declined
   • docs_requested — Admin requested additional documents

   Different messaging for individuals vs companies.
════════════════════════════════════════════════════════════ */

const STATUS_CONFIG = {
  unverified: {
    icon: AlertCircle,
    bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
    iconColor: 'text-amber-500',
    title: 'Complete your profile to unlock all features',
    individualDesc: 'Upload your government ID, proof of address, and any professional certifications to get verified.',
    companyDesc: 'Upload your CAC registration, proof of address, and TIN documents to get your business verified.',
    cta: 'Complete Profile',
    ctaLink: '/provider/settings',
  },
  pending: {
    icon: Clock,
    bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
    iconColor: 'text-blue-500',
    title: 'Verification under review',
    individualDesc: 'Your documents have been submitted and are being reviewed. This usually takes 1-2 business days.',
    companyDesc: 'Your business documents have been submitted and are being reviewed. This usually takes 1-3 business days.',
    cta: null,
  },
  rejected: {
    icon: ShieldAlert,
    bg: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
    iconColor: 'text-red-500',
    title: 'Verification declined',
    individualDesc: 'Your verification was not approved. Please review the feedback and resubmit your documents.',
    companyDesc: 'Your business verification was not approved. Please review the feedback and resubmit your documents.',
    cta: 'Update Documents',
    ctaLink: '/provider/settings',
  },
  docs_requested: {
    icon: FileText,
    bg: 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20',
    iconColor: 'text-purple-500',
    title: 'Additional documents needed',
    individualDesc: 'The verification team has requested additional documents. Please upload them to continue.',
    companyDesc: 'The verification team has requested additional business documents. Please upload them to continue.',
    cta: 'Upload Documents',
    ctaLink: '/provider/settings',
  },
};

export default function VerificationBanner() {
  const { user, isProvider } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // Only show for providers
  if (!isProvider || !user) return null;

  // Don't show for admins
  if (['super_admin', 'operations_admin', 'moderator', 'verification_admin',
       'support_admin', 'finance_admin', 'compliance_admin'].includes(user.role)) return null;

  const status = user.verificationStatus || 'unverified';

  // Hide banner if approved or dismissed
  if (status === 'approved' || user.verified) return null;
  if (dismissed) return null;

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unverified;
  const Icon = config.icon;
  const isCompany = user.accountType === 'company';
  const description = isCompany ? config.companyDesc : config.individualDesc;

  // Check what's missing
  const missingItems = [];
  if (!user.emailVerified) missingItems.push({ icon: Mail, label: 'Email not verified' });
  if (!user.whatsappVerified) missingItems.push({ icon: Phone, label: 'WhatsApp not verified' });

  return (
    <div className={`relative p-4 mb-4 border rounded-2xl ${config.bg}`}>
      {/* Dismiss button (only for non-critical statuses) */}
      {status === 'pending' && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute p-1 text-gray-400 top-3 right-3 hover:text-gray-600"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      )}

      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl ${config.bg} shrink-0`}>
          <Icon size={20} className={config.iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">
            {config.title}
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {description}
          </p>

          {/* Missing verifications */}
          {status === 'unverified' && missingItems.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {missingItems.map(({ icon: ItemIcon, label }) => (
                <span key={label} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/60 dark:bg-white/10 text-gray-600 dark:text-gray-300 font-medium">
                  <ItemIcon size={10} /> {label}
                </span>
              ))}
            </div>
          )}

          {/* CTA */}
          {config.cta && (
            <Link
              to={config.ctaLink}
              className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 text-xs font-semibold text-white bg-brand-charcoal-dark rounded-full hover:bg-brand-charcoal transition-colors active:scale-[0.98]"
            >
              {config.cta} <ArrowRight size={12} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState }       from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, ShieldCheck, AlertCircle, Check } from 'lucide-react';
import { useOnboarding }  from '../../../hooks/useOnboarding.js';
import { useCountry }     from '../../../hooks/useCountry.js';
import StepWrapper        from '../StepWrapper.jsx';
import Button             from '../../ui/Button.jsx';
import Input              from '../../ui/Input.jsx';
import Select             from '../../ui/Select.jsx';

// Nigeria-specific bank list (top 20 commercial banks)
const NG_BANKS = [
  { value: 'access',     label: 'Access Bank'          },
  { value: 'gtb',        label: 'GTBank (Guaranty Trust)'},
  { value: 'zenith',     label: 'Zenith Bank'          },
  { value: 'first',      label: 'First Bank of Nigeria' },
  { value: 'uba',        label: 'UBA'                  },
  { value: 'fidelity',   label: 'Fidelity Bank'        },
  { value: 'sterling',   label: 'Sterling Bank'        },
  { value: 'union',      label: 'Union Bank'           },
  { value: 'stanbic',    label: 'Stanbic IBTC'         },
  { value: 'wema',       label: 'WEMA Bank'            },
  { value: 'polaris',    label: 'Polaris Bank'         },
  { value: 'jaiz',       label: 'Jaiz Bank'            },
  { value: 'keystone',   label: 'Keystone Bank'        },
  { value: 'heritage',   label: 'Heritage Bank'        },
  { value: 'fcmb',       label: 'FCMB'                 },
  { value: 'ecobank',    label: 'Ecobank Nigeria'      },
  { value: 'citibank',   label: 'Citibank Nigeria'     },
  { value: 'standard',   label: 'Standard Chartered'   },
  { value: 'opay_bank',  label: 'OPay (OPayment)'      },
  { value: 'kuda',       label: 'Kuda Bank'            },
  { value: 'palmpay',    label: 'PalmPay'              },
  { value: 'moniepoint', label: 'Moniepoint'           },
  { value: 'other',      label: 'Other'                },
];

// Payment method options per country
const PAYOUT_METHODS = {
  NG: [
    {
      id: 'bank_transfer',
      label: 'Bank Transfer',
      description: 'Direct to any Nigerian bank',
      icon: '🏦',
      fields: ['bankName', 'accountName', 'accountNumber'],
    },
    {
      id: 'paystack',
      label: 'Paystack',
      description: 'Cards, bank transfer & USSD',
      icon: '💳',
      fields: ['bankName', 'accountName', 'accountNumber'],
    },
    {
      id: 'opay',
      label: 'OPay',
      description: 'OPay wallet & bank transfer',
      icon: '🟢',
      fields: ['opayPhone', 'accountName'],
    },
    {
      id: 'flutterwave',
      label: 'Flutterwave',
      description: 'Cards, bank transfer & mobile money',
      icon: '🌊',
      fields: ['bankName', 'accountName', 'accountNumber'],
    },
  ],
  KE: [
    {
      id: 'mpesa',
      label: 'M-Pesa',
      description: 'Safaricom M-Pesa',
      icon: '📱',
      fields: ['mpesaPhone', 'accountName'],
    },
    {
      id: 'bank_transfer',
      label: 'Bank Transfer',
      description: 'Direct to any Kenyan bank',
      icon: '🏦',
      fields: ['bankName', 'accountName', 'accountNumber'],
    },
    {
      id: 'flutterwave',
      label: 'Flutterwave',
      description: 'Multi-currency payouts',
      icon: '🌊',
      fields: ['bankName', 'accountName', 'accountNumber'],
    },
  ],
  ZA: [
    {
      id: 'bank_transfer',
      label: 'EFT / Bank Transfer',
      description: 'South African bank account',
      icon: '🏦',
      fields: ['bankName', 'accountName', 'accountNumber', 'branchCode'],
    },
    {
      id: 'flutterwave',
      label: 'Flutterwave',
      description: 'Multi-currency payouts',
      icon: '🌊',
      fields: ['bankName', 'accountName', 'accountNumber'],
    },
  ],
  DEFAULT: [
    {
      id: 'stripe',
      label: 'Stripe',
      description: 'Cards & bank transfer worldwide',
      icon: '💳',
      fields: ['bankName', 'accountName', 'accountNumber'],
    },
    {
      id: 'flutterwave',
      label: 'Flutterwave',
      description: 'Multi-currency payouts (35+ countries)',
      icon: '🌊',
      fields: ['bankName', 'accountName', 'accountNumber'],
    },
  ],
};

export default function Step09_Payment() {
  const { t: _t }                       = useTranslation();
  const { updateStep, nextStep, data } = useOnboarding();
  const { code: countryCode }          = useCountry();

  const saved    = data.payment || {};
  const methods  = PAYOUT_METHODS[countryCode] || PAYOUT_METHODS.DEFAULT;
  const isNigeria = countryCode === 'NG';

  const [selectedMethod, setSelectedMethod] = useState(saved.method    || methods[0]?.id || '');
  const [form, setForm] = useState({
    bankName:      saved.bankName      || '',
    accountName:   saved.accountName   || '',
    accountNumber: saved.accountNumber || '',
    branchCode:    saved.branchCode    || '',
    opayPhone:     saved.opayPhone     || '',
    mpesaPhone:    saved.mpesaPhone    || '',
  });
  const [errors, setErrors] = useState({});

  const method = methods.find((m) => m.id === selectedMethod);

  const setField = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!selectedMethod) { e.method = 'Please select a payout method'; return e; }

    const fields = method?.fields || [];
    if (fields.includes('bankName') && !form.bankName)
      e.bankName = 'Bank name is required';
    if (fields.includes('accountName') && !form.accountName.trim())
      e.accountName = 'Account name is required';
    if (fields.includes('accountNumber') && !form.accountNumber.trim())
      e.accountNumber = 'Account number is required';
    if (fields.includes('opayPhone') && !form.opayPhone.trim())
      e.opayPhone = 'OPay phone number is required';
    if (fields.includes('mpesaPhone') && !form.mpesaPhone.trim())
      e.mpesaPhone = 'M-Pesa phone number is required';
    return e;
  };

  const handleSkip = () => {
    updateStep('payment', { skipped: true });
    nextStep();
  };

  const handleContinue = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    updateStep('payment', { method: selectedMethod, ...form });
    nextStep();
  };

  const fields = method?.fields || [];

  return (
    <StepWrapper
      title="Payment & payout"
      subtitle="How you'd like to receive payments from clients through Aurban."
      tooltip="Your banking details are encrypted with bank-level security. We use them only to process your payouts."
      onSkip={handleSkip}
    >
      {/* Tier notice */}
      <div className="flex items-center gap-3 p-3.5 bg-amber-50 rounded-2xl border border-amber-100">
        <Wallet size={18} className="text-amber-600 shrink-0" />
        <div>
          <p className="text-xs font-bold text-amber-800">Tier 2 required for payouts</p>
          <p className="text-[11px] text-amber-600 font-body">
            Add your bank details now — payouts activate automatically when you reach Tier 2.
          </p>
        </div>
      </div>

      {/* Method selector */}
      <div>
        <p className="mb-2 label-sm">Payout Method</p>
        <div className="grid grid-cols-2 gap-2.5">
          {methods.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => { setSelectedMethod(m.id); setErrors({}); }}
              className={[
                'flex flex-col gap-1.5 p-3.5 rounded-2xl border-2 text-left transition-all duration-150',
                'outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/40',
                selectedMethod === m.id
                  ? 'border-brand-gold bg-brand-gold/5 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300',
              ].join(' ')}
              aria-pressed={selectedMethod === m.id}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{m.icon}</span>
                {selectedMethod === m.id && (
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-gold">
                    <Check size={11} className="text-white" />
                  </div>
                )}
              </div>
              <p className="text-sm font-bold text-brand-charcoal-dark font-display">{m.label}</p>
              <p className="text-[11px] text-gray-400 font-body leading-tight">{m.description}</p>
            </button>
          ))}
        </div>
        {errors.method && (
          <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle size={12} /> {errors.method}
          </p>
        )}
      </div>

      {/* Dynamic fields based on selected method */}
      {method && (
        <div className="space-y-3 animate-fade-in">

          {/* Bank name */}
          {fields.includes('bankName') && (
            isNigeria ? (
              <Select
                label="Bank Name"
                value={form.bankName}
                onChange={(v) => setForm((p) => ({ ...p, bankName: v }))}
                options={NG_BANKS}
                searchable
                placeholder="Select your bank..."
                error={errors.bankName}
                required
              />
            ) : (
              <Input
                label="Bank Name"
                placeholder="Enter your bank name"
                value={form.bankName}
                onChange={setField('bankName')}
                error={errors.bankName}
                required
              />
            )
          )}

          {/* Account name */}
          {fields.includes('accountName') && (
            <Input
              label="Account Name"
              placeholder="Name on your bank account"
              value={form.accountName}
              onChange={setField('accountName')}
              error={errors.accountName}
              hint="Must match your ID — used for fraud prevention"
              required
            />
          )}

          {/* Account number */}
          {fields.includes('accountNumber') && (
            <Input
              label="Account Number"
              placeholder={isNigeria ? '10-digit NUBAN number' : 'Account number'}
              value={form.accountNumber}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  accountNumber: e.target.value.replace(/\D/g, '').slice(0, isNigeria ? 10 : 20),
                }))
              }
              error={errors.accountNumber}
              required
            />
          )}

          {/* Branch code (SA) */}
          {fields.includes('branchCode') && (
            <Input
              label="Branch Code"
              placeholder="6-digit branch code"
              value={form.branchCode}
              onChange={(e) =>
                setForm((p) => ({ ...p, branchCode: e.target.value.replace(/\D/g, '').slice(0, 6) }))
              }
              optional
            />
          )}

          {/* OPay phone */}
          {fields.includes('opayPhone') && (
            <Input
              label="OPay Phone Number"
              type="tel"
              placeholder="e.g. 0801 234 5678"
              value={form.opayPhone}
              onChange={(e) =>
                setForm((p) => ({ ...p, opayPhone: e.target.value.replace(/\D/g,'').slice(0,11) }))
              }
              error={errors.opayPhone}
              hint="Must be registered with OPay"
              required
            />
          )}

          {/* M-Pesa phone */}
          {fields.includes('mpesaPhone') && (
            <Input
              label="M-Pesa Phone Number"
              type="tel"
              placeholder="e.g. 0712 345 678"
              value={form.mpesaPhone}
              onChange={(e) =>
                setForm((p) => ({ ...p, mpesaPhone: e.target.value.replace(/\D/g,'').slice(0,12) }))
              }
              error={errors.mpesaPhone}
              hint="Must be registered with Safaricom M-Pesa"
              required
            />
          )}
        </div>
      )}

      {/* Security notice */}
      <div className="flex items-start gap-3 p-3.5 bg-brand-gray-soft rounded-2xl">
        <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-gray-500 font-body leading-relaxed">
          Your payment details are encrypted end-to-end. Aurban never stores full account numbers
          and never shares your details with third parties.
        </p>
      </div>

      <Button fullWidth size="lg" onClick={handleContinue}>
        Continue
      </Button>
    </StepWrapper>
  );
}
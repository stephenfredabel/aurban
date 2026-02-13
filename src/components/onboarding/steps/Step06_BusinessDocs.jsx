import { useState }       from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, ExternalLink } from 'lucide-react';
import { useOnboarding }  from '../../../hooks/useOnboarding.js';
import { useCountry }     from '../../../hooks/useCountry.js';
import StepWrapper        from '../StepWrapper.jsx';
import Button             from '../../ui/Button.jsx';
import Input              from '../../ui/Input.jsx';
import Select             from '../../ui/Select.jsx';
import FileUpload         from '../../ui/FileUpload.jsx';

const REG_TYPES = [
  { value: 'ltd',         label: 'Private Limited Company (Ltd)'       },
  { value: 'plc',         label: 'Public Limited Company (PLC)'        },
  { value: 'sole',        label: 'Sole Proprietorship'                 },
  { value: 'partnership', label: 'General / Limited Partnership'       },
  { value: 'ngo',         label: 'NGO / Non-Profit Organisation'       },
  { value: 'trust',       label: 'Business Name / Enterprise'          },
];

const EMPLOYEE_RANGES = [
  { value: '1',     label: 'Just me (1)'      },
  { value: '2_5',   label: '2–5 employees'    },
  { value: '6_20',  label: '6–20 employees'   },
  { value: '21_50', label: '21–50 employees'  },
  { value: '51_plus',label: '51+ employees'   },
];

export default function Step06_BusinessDocs() {
  const { t }                          = useTranslation();
  const { updateStep, nextStep, data } = useOnboarding();
  const { businessRegistry, code }     = useCountry();

  const saved = data.businessDocs || {};

  const [form, setForm] = useState({
    companyName:    saved.companyName    || '',
    tradingName:    saved.tradingName    || '',
    regNumber:      saved.regNumber      || '',
    regType:        saved.regType        || '',
    dateIncorp:     saved.dateIncorp     || '',
    website:        saved.website        || '',
    businessEmail:  saved.businessEmail  || '',
    businessPhone:  saved.businessPhone  || '',
    tin:            saved.tin            || '',
    primaryContact: saved.primaryContact || '',
    primaryRole:    saved.primaryRole    || '',
    employees:      saved.employees      || '',
  });
  const [regCert, setRegCert] = useState(saved.regCert || null);
  const [taxDoc,  setTaxDoc]  = useState(saved.taxDoc  || null);
  const [errors,  setErrors]  = useState({});

  const setField = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.companyName.trim()) e.companyName = 'Company name is required';
    if (!form.regNumber.trim())   e.regNumber   = `${businessRegistry.name} registration number is required`;
    if (!regCert)                 e.regCert     = 'Registration certificate is required';
    return e;
  };

  const handleSkip = () => {
    updateStep('businessDocs', { skipped: true });
    nextStep();
  };

  const handleContinue = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    updateStep('businessDocs', { ...form, regCert, taxDoc });
    nextStep();
  };

  return (
    <StepWrapper
      title="Business information"
      subtitle="Required to unlock Tier 2 and receive platform payments."
      tooltip="Your business registration confirms you're a legitimate operation, unlocking higher visibility and the ability to receive payments through Aurban."
      onSkip={handleSkip}
    >

      {/* Registry notice */}
      <div className="flex items-start gap-3 p-3.5 bg-blue-50 rounded-2xl border border-blue-100">
        <Building2 size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-bold text-blue-800">{businessRegistry.fullName}</p>
          <p className="text-[11px] text-blue-600 font-body mt-0.5">
            Your {businessRegistry.name} number format: <span className="font-mono font-bold">{businessRegistry.placeholder}</span>
          </p>
        </div>
      </div>

      {/* Company name */}
      <Input
        label="Company Name (as registered)"
        placeholder={`e.g. Bright Properties ${code === 'NG' ? 'Nigeria' : ''} Ltd`}
        value={form.companyName}
        onChange={setField('companyName')}
        error={errors.companyName}
        hint="Exactly as it appears on your registration certificate"
        required
      />

      <Input
        label="Trading / Brand Name"
        placeholder="Public-facing name if different"
        value={form.tradingName}
        onChange={setField('tradingName')}
        optional
      />

      {/* Registration number */}
      <Input
        label={`${businessRegistry.name} Registration Number`}
        placeholder={businessRegistry.placeholder}
        value={form.regNumber}
        onChange={setField('regNumber')}
        error={errors.regNumber}
        hint={`Your ${businessRegistry.fullName} registration number`}
        required
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          label="Registration Type"
          value={form.regType}
          onChange={(v) => setForm((p) => ({ ...p, regType: v }))}
          options={REG_TYPES}
          placeholder="Select type..."
          optional
        />
        <Input
          label="Date of Incorporation"
          type="date"
          value={form.dateIncorp}
          onChange={setField('dateIncorp')}
          optional
        />
      </div>

      {/* Registration certificate upload */}
      <FileUpload
        label={`${businessRegistry.name} Certificate`}
        hint="Upload your official business registration document"
        value={regCert}
        onChange={setRegCert}
        accept={['image/jpeg','image/png','application/pdf']}
        maxMB={15}
        error={errors.regCert}
        required
      />

      {/* Contact details */}
      <div className="pt-2">
        <p className="mb-3 label-sm">Contact Details</p>
        <div className="space-y-3">
          <Input
            label="Business Email"
            type="email"
            placeholder="info@yourcompany.com"
            value={form.businessEmail}
            onChange={setField('businessEmail')}
            recommended
          />
          <Input
            label="Business Website"
            type="url"
            placeholder="https://yourcompany.com"
            value={form.website}
            onChange={setField('website')}
            optional
          />
        </div>
      </div>

      {/* Primary contact */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="Primary Contact Name"
          placeholder="John Okafor"
          value={form.primaryContact}
          onChange={setField('primaryContact')}
          recommended
        />
        <Input
          label="Role / Title"
          placeholder="Director, CEO, Manager..."
          value={form.primaryRole}
          onChange={setField('primaryRole')}
          optional
        />
      </div>

      <Select
        label="Number of Employees"
        value={form.employees}
        onChange={(v) => setForm((p) => ({ ...p, employees: v }))}
        options={EMPLOYEE_RANGES}
        placeholder="Select range..."
        optional
      />

      {/* TIN section */}
      <div className="p-4 bg-brand-gray-soft rounded-2xl">
        <p className="mb-1 label-sm">Tax Identification Number (TIN)</p>
        <p className="mb-3 text-xs text-gray-400 font-body">
          Required to enable direct platform payouts to your bank account.
        </p>
        <Input
          placeholder="Enter your TIN"
          value={form.tin}
          onChange={setField('tin')}
          optional
        />
        <div className="mt-3">
          <FileUpload
            label="Tax Document"
            hint="TIN certificate, VAT registration or tax clearance"
            value={taxDoc}
            onChange={setTaxDoc}
            accept={['image/jpeg','image/png','application/pdf']}
            maxMB={15}
            optional
          />
        </div>
      </div>

      <Button fullWidth size="lg" onClick={handleContinue}>
        Continue
      </Button>
    </StepWrapper>
  );
}
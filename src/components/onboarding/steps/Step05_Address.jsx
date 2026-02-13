import { useState, useCallback }   from 'react';
import { useTranslation }          from 'react-i18next';
import { MapPin, Locate, Loader2 } from 'lucide-react';
import { useOnboarding }           from '../../../hooks/useOnboarding.js';
import { useCountry }              from '../../../hooks/useCountry.js';
import StepWrapper                 from '../StepWrapper.jsx';
import Button                      from '../../ui/Button.jsx';
import Input                       from '../../ui/Input.jsx';
import Select                      from '../../ui/Select.jsx';
import FileUpload                  from '../../ui/FileUpload.jsx';

// Address field structure per country
const ADDRESS_SCHEMAS = {
  NG: [
    { key: 'street',  label: 'Street Address',    placeholder: '14 Admiralty Way',     required: true  },
    { key: 'lga',     label: 'LGA',                placeholder: 'Eti-Osa',             required: true  },
    { key: 'state',   label: 'State',              placeholder: 'Lagos',               required: true  },
  ],
  KE: [
    { key: 'street',  label: 'Street Address',    placeholder: 'Kenyatta Avenue',      required: true  },
    { key: 'ward',    label: 'Ward',               placeholder: 'Westlands Ward',      required: false },
    { key: 'county',  label: 'County',             placeholder: 'Nairobi County',      required: true  },
  ],
  ZA: [
    { key: 'street',  label: 'Street Address',    placeholder: '10 Long Street',       required: true  },
    { key: 'suburb',  label: 'Suburb',             placeholder: 'Gardens',             required: false },
    { key: 'city',    label: 'City',               placeholder: 'Cape Town',           required: true  },
    { key: 'province',label: 'Province',           placeholder: 'Western Cape',        required: true  },
    { key: 'postcode',label: 'Postal Code',        placeholder: '8001',                required: true  },
  ],
  EG: [
    { key: 'street',  label: 'Street Address',    placeholder: 'Tahrir Square St',     required: true  },
    { key: 'district',label: 'District',           placeholder: 'Garden City',        required: false },
    { key: 'governorate', label: 'Governorate',   placeholder: 'Cairo',               required: true  },
  ],
  GB: [
    { key: 'street',  label: 'Street Address',    placeholder: '221B Baker Street',    required: true  },
    { key: 'city',    label: 'City / Town',        placeholder: 'London',              required: true  },
    { key: 'county',  label: 'County',             placeholder: 'Greater London',      required: false },
    { key: 'postcode',label: 'Postcode',           placeholder: 'NW1 6XE',             required: true  },
  ],
  US: [
    { key: 'street',  label: 'Street Address',    placeholder: '1600 Pennsylvania Ave', required: true },
    { key: 'city',    label: 'City',               placeholder: 'Washington',          required: true  },
    { key: 'state',   label: 'State',              placeholder: 'DC',                  required: true  },
    { key: 'zip',     label: 'ZIP Code',           placeholder: '20500',               required: true  },
  ],
  DEFAULT: [
    { key: 'street',  label: 'Street Address',    placeholder: 'Street address',       required: true  },
    { key: 'city',    label: 'City / Town',        placeholder: 'City',                required: true  },
    { key: 'region',  label: 'Region / State',    placeholder: 'Region',              required: false },
    { key: 'postcode',label: 'Postal Code',        placeholder: 'Postal code',         required: false },
  ],
};

const DURATION_OPTIONS = [
  { value: 'less_1',  label: 'Less than 1 year'  },
  { value: '1_2',     label: '1–2 years'           },
  { value: '3_5',     label: '3–5 years'           },
  { value: '5_plus',  label: 'More than 5 years'  },
];

const PROOF_HINTS = {
  NG: 'Recent utility bill (IKEDC, EKEDC, LAWMA), bank statement, or PHCN receipt',
  KE: 'Recent utility bill (KPLC, Nairobi Water), bank statement, or KRA pin certificate',
  ZA: 'Recent municipal bill, Eskom statement, or bank statement (not older than 3 months)',
  DEFAULT: 'Recent utility bill, bank statement, or tenancy agreement (not older than 3 months)',
};

export default function Step05_Address() {
  const { t }                          = useTranslation();
  const { updateStep, nextStep, data } = useOnboarding();
  const { code: countryCode }          = useCountry();

  const saved   = data.address || {};
  const schema  = ADDRESS_SCHEMAS[countryCode] || ADDRESS_SCHEMAS.DEFAULT;
  const proofHint = PROOF_HINTS[countryCode] || PROOF_HINTS.DEFAULT;

  const [fields,   setFields]   = useState(saved.fields   || {});
  const [duration, setDuration] = useState(saved.duration || '');
  const [proof,    setProof]    = useState(saved.proof    || null);
  const [errors,   setErrors]   = useState({});
  const [gpsLoading, setGpsLoading] = useState(false);

  const setField = (key) => (e) => {
    setFields((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: null }));
  };

  // GPS auto-fill
  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Use Nominatim (free, no key needed for dev)
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const geo  = await resp.json();
          const addr = geo.address || {};
          setFields((prev) => ({
            ...prev,
            street:  [addr.road, addr.house_number].filter(Boolean).join(' ') || prev.street,
            city:    addr.city || addr.town || addr.village || prev.city || '',
            state:   addr.state || prev.state || '',
            lga:     addr.county || prev.lga  || '',
            region:  addr.state  || prev.region || '',
            postcode:addr.postcode || prev.postcode || '',
          }));
        } catch { /* Fail silently, user can fill manually */ }
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
        setErrors((prev) => ({
          ...prev,
          gps: 'Location access denied — please enter address manually',
        }));
      },
      { timeout: 8000 }
    );
  }, []);

  const validate = () => {
    const e = {};
    schema.forEach(({ key, label, required }) => {
      if (required && !fields[key]?.trim()) {
        e[key] = `${label} is required`;
      }
    });
    return e;
  };

  const handleSkip = () => {
    updateStep('address', { skipped: true });
    nextStep();
  };

  const handleContinue = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    updateStep('address', { fields, duration, proof, countryCode });
    nextStep();
  };

  return (
    <StepWrapper
      title="Your address"
      subtitle="Used for verification only — your full address is never shown on your public profile."
      tooltip="We need your address to verify you're operating from where you say you are. Only your city/area is shown publicly."
      onSkip={handleSkip}
    >

      {/* GPS button */}
      <button
        type="button"
        onClick={handleGPS}
        disabled={gpsLoading}
        className="w-full flex items-center justify-center gap-2.5 py-3 border-2 border-dashed border-brand-gold/40 rounded-2xl text-sm font-semibold text-brand-gold hover:bg-brand-gold/5 transition-colors disabled:opacity-60"
      >
        {gpsLoading
          ? <Loader2 size={16} className="animate-spin" />
          : <Locate size={16} />
        }
        {gpsLoading ? 'Detecting location...' : 'Use my location (GPS auto-fill)'}
      </button>

      {errors.gps && (
        <p className="text-xs text-center text-gray-400 font-body">{errors.gps}</p>
      )}

      {/* Dynamic address fields */}
      <div className="space-y-3">
        {schema.map(({ key, label, placeholder, required }) => (
          <Input
            key={key}
            label={label}
            placeholder={placeholder}
            value={fields[key] || ''}
            onChange={setField(key)}
            error={errors[key]}
            required={required}
            optional={!required}
          />
        ))}
      </div>

      {/* Duration */}
      <Select
        label="How long at this address?"
        value={duration}
        onChange={setDuration}
        options={DURATION_OPTIONS}
        placeholder="Select duration..."
        optional
      />

      {/* Proof of address */}
      <FileUpload
        label="Proof of Address"
        hint={proofHint}
        value={proof}
        onChange={setProof}
        accept={['image/jpeg','image/png','application/pdf']}
        maxMB={10}
        recommended
      />

      <Button fullWidth size="lg" onClick={handleContinue}>
        Continue
      </Button>
    </StepWrapper>
  );
}
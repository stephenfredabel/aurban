import { useState, useRef }  from 'react';
import { useTranslation }    from 'react-i18next';
import { Plus, X, GripVertical, Star } from 'lucide-react';
import { useOnboarding }     from '../../../hooks/useOnboarding.js';
import StepWrapper           from '../StepWrapper.jsx';
import Button                from '../../ui/Button.jsx';
import Input                 from '../../ui/Input.jsx';
import Select                from '../../ui/Select.jsx';
import FileUpload            from '../../ui/FileUpload.jsx';
import Toggle                from '../../ui/Toggle.jsx';

const SERVICE_CATEGORIES = [
  { value: 'plumbing',       label: 'Plumbing'              },
  { value: 'electrical',     label: 'Electrical'            },
  { value: 'architecture',   label: 'Architecture'          },
  { value: 'interior',       label: 'Interior Design'       },
  { value: 'construction',   label: 'Construction'          },
  { value: 'cleaning',       label: 'Cleaning'              },
  { value: 'security',       label: 'Security'              },
  { value: 'painting',       label: 'Painting & Decorating' },
  { value: 'landscaping',    label: 'Landscaping'           },
  { value: 'hvac',           label: 'HVAC / Air Conditioning'},
  { value: 'property_mgmt',  label: 'Property Management'   },
  { value: 'estate_agency',  label: 'Estate Agency'         },
  { value: 'valuation',      label: 'Property Valuation'    },
  { value: 'legal',          label: 'Legal / Conveyancing'  },
  { value: 'solar',          label: 'Solar / Renewable Energy'},
  { value: 'tiling',         label: 'Tiling'                },
  { value: 'carpentry',      label: 'Carpentry & Joinery'   },
  { value: 'roofing',        label: 'Roofing'               },
  { value: 'photography',    label: 'Property Photography'  },
  { value: 'other',          label: 'Other'                 },
];

const EXPERIENCE_OPTIONS = [
  { value: 'less_1', label: 'Less than 1 year'  },
  { value: '1_3',    label: '1–3 years'          },
  { value: '3_5',    label: '3–5 years'          },
  { value: '5_10',   label: '5–10 years'         },
  { value: '10_plus',label: '10+ years'          },
];

const SKILL_LEVELS = [
  { value: 'unskilled',    label: 'General Labour / Unskilled'    },
  { value: 'skilled',      label: 'Skilled Tradesperson'          },
  { value: 'professional', label: 'Professional (Certified)'      },
];

export default function Step07_IndividualDocs() {
  const { t }                          = useTranslation();
  const { updateStep, nextStep, data } = useOnboarding();

  const saved = data.individualDocs || {};

  const [primaryService, setPrimaryService] = useState(saved.primaryService || '');
  const [skillLevel,     setSkillLevel]     = useState(saved.skillLevel     || '');
  const [experience,     setExperience]     = useState(saved.experience     || '');
  const [hasLicense,     setHasLicense]     = useState(saved.hasLicense     || false);
  const [licenseNumber,  setLicenseNumber]  = useState(saved.licenseNumber  || '');
  const [licenseAuthority,setLicenseAuthority] = useState(saved.licenseAuthority || '');
  const [licenseExpiry,  setLicenseExpiry]  = useState(saved.licenseExpiry  || '');
  const [licenseDoc,     setLicenseDoc]     = useState(saved.licenseDoc     || null);
  const [certificate,    setCertificate]    = useState(saved.certificate    || null);
  const [portfolio,      setPortfolio]      = useState(saved.portfolio      || []);
  const [errors,         setErrors]         = useState({});
  const portfolioInputRef = useRef(null);

  // Portfolio: up to 8 images, draggable order (first = hero)
  const addPortfolioImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newItems = files.slice(0, 8 - portfolio.length).map((file) => ({
      id:      Math.random().toString(36).slice(2),
      file,
      preview: URL.createObjectURL(file),
      name:    file.name,
    }));
    setPortfolio((prev) => [...prev, ...newItems]);
    e.target.value = '';
  };

  const removePortfolioItem = (id) =>
    setPortfolio((prev) => prev.filter((p) => p.id !== id));

  const validate = () => {
    const e = {};
    if (!primaryService) e.primaryService = 'Please select your primary service';
    return e;
  };

  const handleSkip = () => {
    updateStep('individualDocs', { skipped: true });
    nextStep();
  };

  const handleContinue = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    updateStep('individualDocs', {
      primaryService, skillLevel, experience,
      hasLicense, licenseNumber, licenseAuthority,
      licenseExpiry, licenseDoc, certificate,
      portfolio: portfolio.map((p) => ({ name: p.name, preview: p.preview })),
    });
    nextStep();
  };

  return (
    <StepWrapper
      title="Your skills & credentials"
      subtitle="Providers with verified credentials get 3× more leads. Everything here is optional but recommended."
      onSkip={handleSkip}
    >

      {/* Primary service */}
      <Select
        label="Primary Service Category"
        value={primaryService}
        onChange={(v) => { setPrimaryService(v); setErrors((p) => ({ ...p, primaryService: null })); }}
        options={SERVICE_CATEGORIES}
        searchable
        placeholder="Select your main service..."
        error={errors.primaryService}
        required
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          label="Skill Level"
          value={skillLevel}
          onChange={setSkillLevel}
          options={SKILL_LEVELS}
          placeholder="Select level..."
          recommended
        />
        <Select
          label="Years of Experience"
          value={experience}
          onChange={setExperience}
          options={EXPERIENCE_OPTIONS}
          placeholder="Select range..."
          recommended
        />
      </div>

      {/* Trade certificate */}
      <FileUpload
        label="Trade / Training Certificate"
        hint="Diploma, trade certificate, or formal training document"
        value={certificate}
        onChange={setCertificate}
        accept={['image/jpeg','image/png','application/pdf']}
        maxMB={10}
        recommended
      />

      {/* Professional license toggle */}
      <div className="p-4 space-y-3 bg-brand-gray-soft rounded-2xl">
        <Toggle
          checked={hasLicense}
          onChange={setHasLicense}
          label="I have a professional license"
          description="e.g. COREN, ARCON, QSRBN, NIA, CORBON, NIOB"
        />

        {hasLicense && (
          <div className="pt-1 space-y-3">
            <Input
              label="License Number"
              placeholder="Enter license / registration number"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              required
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Issuing Authority"
                placeholder="e.g. COREN, ARCON"
                value={licenseAuthority}
                onChange={(e) => setLicenseAuthority(e.target.value)}
                recommended
              />
              <Input
                label="Expiry Date"
                type="date"
                value={licenseExpiry}
                onChange={(e) => setLicenseExpiry(e.target.value)}
                optional
              />
            </div>
            <FileUpload
              label="Upload License"
              hint="Front of license card or official certificate PDF"
              value={licenseDoc}
              onChange={setLicenseDoc}
              accept={['image/jpeg','image/png','application/pdf']}
              maxMB={10}
              required
            />
          </div>
        )}
      </div>

      {/* Portfolio section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="label-sm">Portfolio Images</p>
            <p className="text-xs text-gray-400 mt-0.5 font-body">
              Before/after photos, completed projects · First photo = hero image on your profile
            </p>
          </div>
          <span className="text-xs text-gray-400 font-body">{portfolio.length}/8</span>
        </div>

        {/* Portfolio grid */}
        {portfolio.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3 sm:grid-cols-4">
            {portfolio.map((item, idx) => (
              <div key={item.id} className="relative overflow-hidden bg-gray-100 group aspect-square rounded-xl">
                <img
                  src={item.preview}
                  alt={item.name}
                  className="object-cover w-full h-full"
                />
                {/* Hero badge */}
                {idx === 0 && (
                  <div className="absolute top-1.5 left-1.5">
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-brand-gold text-white text-[9px] font-bold rounded-full">
                      <Star size={8} fill="currentColor" />
                      Hero
                    </span>
                  </div>
                )}
                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removePortfolioItem(item.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove ${item.name}`}
                >
                  <X size={11} className="text-white" />
                </button>
                {/* Order hint */}
                <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical size={14} className="text-white drop-shadow" />
                </div>
              </div>
            ))}

            {/* Add more slot */}
            {portfolio.length < 8 && (
              <label
                htmlFor="portfolio-upload"
                className="flex flex-col items-center justify-center transition-all border-2 border-gray-200 border-dashed cursor-pointer aspect-square rounded-xl hover:border-brand-gold hover:bg-brand-gold/3 group"
              >
                <Plus size={20} className="text-gray-300 transition-colors group-hover:text-brand-gold" />
                <span className="text-[10px] text-gray-400 mt-1">Add</span>
              </label>
            )}
          </div>
        )}

        {/* Upload button when empty */}
        {portfolio.length === 0 && (
          <label
            htmlFor="portfolio-upload"
            className="flex flex-col items-center gap-2 p-6 transition-all border-2 border-gray-200 border-dashed cursor-pointer rounded-2xl hover:border-brand-gold hover:bg-brand-gold/3 group"
          >
            <div className="flex items-center justify-center w-10 h-10 transition-colors bg-gray-100 rounded-xl group-hover:bg-brand-gold/10">
              <Plus size={18} className="text-gray-400 group-hover:text-brand-gold" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-brand-charcoal-dark">Add Portfolio Images</p>
              <p className="text-xs text-gray-400">Up to 8 photos · JPG or PNG</p>
            </div>
          </label>
        )}

        <input
          id="portfolio-upload"
          ref={portfolioInputRef}
          type="file"
          accept="image/jpeg,image/png"
          multiple
          onChange={addPortfolioImages}
          className="sr-only"
        />
      </div>

      <Button fullWidth size="lg" onClick={handleContinue}>
        Continue
      </Button>
    </StepWrapper>
  );
}
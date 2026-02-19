import { useState }          from 'react';
import { useTranslation }    from 'react-i18next';
import { Globe, ChevronDown, Search, Check } from 'lucide-react';
import { useOnboarding }     from '../../../hooks/useOnboarding.js';
import { useLocale }         from '../../../context/LocaleContext.jsx';
import StepWrapper           from '../StepWrapper.jsx';
import Button                from '../../ui/Button.jsx';
import {
  COUNTRIES,
  getCountriesByRegion,
  REGION_LABELS,
} from '../../../config/countries.js';
import {
  SUPPORTED_LANGUAGES,
  getLanguagesByRegion,
  REGION_LABELS as LANG_REGION_LABELS,
} from '../../../config/languages.js';

export default function Step00_CountryLanguage() {
  const { t: _t }                           = useTranslation();
  const { updateStep, nextStep, data }     = useOnboarding();
  const { countryCode, languageCode, changeCountry, changeLanguage } = useLocale();

  const [selectedCountry, setSelectedCountry]   = useState(data.country?.code || countryCode || 'NG');
  const [selectedLanguage, setSelectedLanguage] = useState(data.country?.language || languageCode || 'en');
  const [countrySearch, setCountrySearch]       = useState('');
  const [countryOpen, setCountryOpen]           = useState(false);

  const countriesByRegion  = getCountriesByRegion();
  const languagesByRegion  = getLanguagesByRegion();

  const allCountries = COUNTRIES;
  const filteredCountries = countrySearch
    ? allCountries.filter((c) =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.code.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : null;

  const selectedCountryObj  = COUNTRIES.find((c) => c.code === selectedCountry) || COUNTRIES[0];
  const selectedLanguageObj = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  const handleContinue = () => {
    // Apply to locale context
    changeCountry(selectedCountry);
    changeLanguage(selectedLanguage);
    // Save to onboarding data
    updateStep('country', {
      code:     selectedCountry,
      language: selectedLanguage,
      currency: selectedCountryObj.currency,
      name:     selectedCountryObj.name,
      flag:     selectedCountryObj.flag,
    });
    nextStep();
  };

  return (
    <StepWrapper
      title="Where are you based?"
      subtitle="This personalises your currency, ID types and payment options throughout setup."
    >

      {/* ── Country selector ─────────────────────────────── */}
      <div>
        <label className="block mb-2 label-sm">Country</label>

        {/* Trigger */}
        <button
          type="button"
          onClick={() => setCountryOpen((v) => !v)}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 border-gray-200 bg-white hover:border-brand-gold transition-colors text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/40"
        >
          <span className="text-2xl leading-none shrink-0">{selectedCountryObj.flag}</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-brand-charcoal-dark">{selectedCountryObj.name}</p>
            <p className="text-xs text-gray-400">{selectedCountryObj.currency} · {selectedCountryObj.phone}</p>
          </div>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${countryOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Country dropdown */}
        {countryOpen && (
          <div className="mt-2 overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-dropdown animate-scale-in">
            {/* Search */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search size={13} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="text"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="Search country..."
                  autoFocus
                  className="w-full py-2 pl-8 pr-3 text-sm border border-transparent outline-none bg-brand-gray-soft rounded-xl focus:border-brand-gold placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* List */}
            <div className="p-2 overflow-y-auto max-h-64">
              {filteredCountries ? (
                filteredCountries.map((c) => (
                  <CountryOption
                    key={c.code}
                    country={c}
                    selected={c.code === selectedCountry}
                    onSelect={() => {
                      setSelectedCountry(c.code);
                      setSelectedLanguage(c.language);
                      setCountryOpen(false);
                      setCountrySearch('');
                    }}
                  />
                ))
              ) : (
                Object.entries(countriesByRegion).map(([region, countries]) => (
                  <div key={region} className="mb-2">
                    <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {REGION_LABELS[region] || region}
                    </p>
                    {countries.map((c) => (
                      <CountryOption
                        key={c.code}
                        country={c}
                        selected={c.code === selectedCountry}
                        onSelect={() => {
                          setSelectedCountry(c.code);
                          setSelectedLanguage(c.language);
                          setCountryOpen(false);
                          setCountrySearch('');
                        }}
                      />
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Language selector ────────────────────────────── */}
      <div>
        <label className="block mb-2 label-sm">Preferred Language</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.entries(languagesByRegion).map(([region, langs]) => (
            <div key={region} className="contents">
              {langs.slice(0, region === 'nigeria' ? 5 : region === 'africa' ? 3 : 2).map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={[
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all duration-150',
                    lang.code === selectedLanguage
                      ? 'border-brand-gold bg-brand-gold/8 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300',
                  ].join(' ')}
                >
                  <span className="text-base shrink-0">{lang.flag}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate text-brand-charcoal-dark">{lang.nativeName}</p>
                    {lang.rtl && <p className="text-[10px] text-gray-400">RTL</p>}
                  </div>
                  {lang.code === selectedLanguage && (
                    <Check size={12} className="ml-auto text-brand-gold shrink-0" />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Summary chip ─────────────────────────────────── */}
      <div className="flex items-center gap-3 p-3.5 bg-brand-gray-soft rounded-2xl">
        <Globe size={18} className="text-brand-gold shrink-0" />
        <p className="text-sm text-brand-charcoal font-body">
          <span className="font-semibold">{selectedCountryObj.flag} {selectedCountryObj.name}</span>
          {' '}·{' '}
          <span className="font-semibold">{selectedCountryObj.currency}</span>
          {' '}·{' '}
          <span>{selectedLanguageObj.nativeName}</span>
        </p>
      </div>

      {/* ── CTA ──────────────────────────────────────────── */}
      <Button
        fullWidth
        size="lg"
        onClick={handleContinue}
      >
        Continue
      </Button>
    </StepWrapper>
  );
}

// ── Small helper component ──────────────────────────────────
function CountryOption({ country, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left',
        selected ? 'bg-brand-gold/10' : 'hover:bg-brand-gray-soft',
      ].join(' ')}
    >
      <span className="text-lg shrink-0">{country.flag}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-brand-charcoal-dark">{country.name}</p>
      </div>
      <span className="text-xs text-gray-400 shrink-0">{country.phone}</span>
      {selected && <Check size={13} className="text-brand-gold shrink-0" />}
    </button>
  );
}
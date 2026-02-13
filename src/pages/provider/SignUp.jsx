import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone,
  ChevronDown, Search, X, Check,
  Shield, AlertCircle, Loader2,
} from 'lucide-react';
import { useAuth }    from '../context/AuthContext.jsx';
import { sanitize, RateLimiter } from '../utils/security.js';

/* ════════════════════════════════════════════════════════════
   RATE LIMITER — 3 signup attempts per hour
════════════════════════════════════════════════════════════ */
const signupLimiter = new RateLimiter(3, 3600000);

/* ════════════════════════════════════════════════════════════
   COMPLETE COUNTRY LIST — 195 UN member states + territories
   Format: { code, name, dial, flag }
════════════════════════════════════════════════════════════ */
const ALL_COUNTRIES = [
  { code: 'AF', name: 'Afghanistan', dial: '+93', flag: '🇦🇫' },
  { code: 'AL', name: 'Albania', dial: '+355', flag: '🇦🇱' },
  { code: 'DZ', name: 'Algeria', dial: '+213', flag: '🇩🇿' },
  { code: 'AD', name: 'Andorra', dial: '+376', flag: '🇦🇩' },
  { code: 'AO', name: 'Angola', dial: '+244', flag: '🇦🇴' },
  { code: 'AG', name: 'Antigua and Barbuda', dial: '+1-268', flag: '🇦🇬' },
  { code: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷' },
  { code: 'AM', name: 'Armenia', dial: '+374', flag: '🇦🇲' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { code: 'AT', name: 'Austria', dial: '+43', flag: '🇦🇹' },
  { code: 'AZ', name: 'Azerbaijan', dial: '+994', flag: '🇦🇿' },
  { code: 'BS', name: 'Bahamas', dial: '+1-242', flag: '🇧🇸' },
  { code: 'BH', name: 'Bahrain', dial: '+973', flag: '🇧🇭' },
  { code: 'BD', name: 'Bangladesh', dial: '+880', flag: '🇧🇩' },
  { code: 'BB', name: 'Barbados', dial: '+1-246', flag: '🇧🇧' },
  { code: 'BY', name: 'Belarus', dial: '+375', flag: '🇧🇾' },
  { code: 'BE', name: 'Belgium', dial: '+32', flag: '🇧🇪' },
  { code: 'BZ', name: 'Belize', dial: '+501', flag: '🇧🇿' },
  { code: 'BJ', name: 'Benin', dial: '+229', flag: '🇧🇯' },
  { code: 'BT', name: 'Bhutan', dial: '+975', flag: '🇧🇹' },
  { code: 'BO', name: 'Bolivia', dial: '+591', flag: '🇧🇴' },
  { code: 'BA', name: 'Bosnia and Herzegovina', dial: '+387', flag: '🇧🇦' },
  { code: 'BW', name: 'Botswana', dial: '+267', flag: '🇧🇼' },
  { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
  { code: 'BN', name: 'Brunei', dial: '+673', flag: '🇧🇳' },
  { code: 'BG', name: 'Bulgaria', dial: '+359', flag: '🇧🇬' },
  { code: 'BF', name: 'Burkina Faso', dial: '+226', flag: '🇧🇫' },
  { code: 'BI', name: 'Burundi', dial: '+257', flag: '🇧🇮' },
  { code: 'CV', name: 'Cabo Verde', dial: '+238', flag: '🇨🇻' },
  { code: 'KH', name: 'Cambodia', dial: '+855', flag: '🇰🇭' },
  { code: 'CM', name: 'Cameroon', dial: '+237', flag: '🇨🇲' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { code: 'CF', name: 'Central African Republic', dial: '+236', flag: '🇨🇫' },
  { code: 'TD', name: 'Chad', dial: '+235', flag: '🇹🇩' },
  { code: 'CL', name: 'Chile', dial: '+56', flag: '🇨🇱' },
  { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳' },
  { code: 'CO', name: 'Colombia', dial: '+57', flag: '🇨🇴' },
  { code: 'KM', name: 'Comoros', dial: '+269', flag: '🇰🇲' },
  { code: 'CG', name: 'Congo', dial: '+242', flag: '🇨🇬' },
  { code: 'CD', name: 'Congo (DRC)', dial: '+243', flag: '🇨🇩' },
  { code: 'CR', name: 'Costa Rica', dial: '+506', flag: '🇨🇷' },
  { code: 'CI', name: "Côte d'Ivoire", dial: '+225', flag: '🇨🇮' },
  { code: 'HR', name: 'Croatia', dial: '+385', flag: '🇭🇷' },
  { code: 'CU', name: 'Cuba', dial: '+53', flag: '🇨🇺' },
  { code: 'CY', name: 'Cyprus', dial: '+357', flag: '🇨🇾' },
  { code: 'CZ', name: 'Czech Republic', dial: '+420', flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark', dial: '+45', flag: '🇩🇰' },
  { code: 'DJ', name: 'Djibouti', dial: '+253', flag: '🇩🇯' },
  { code: 'DM', name: 'Dominica', dial: '+1-767', flag: '🇩🇲' },
  { code: 'DO', name: 'Dominican Republic', dial: '+1-809', flag: '🇩🇴' },
  { code: 'EC', name: 'Ecuador', dial: '+593', flag: '🇪🇨' },
  { code: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬' },
  { code: 'SV', name: 'El Salvador', dial: '+503', flag: '🇸🇻' },
  { code: 'GQ', name: 'Equatorial Guinea', dial: '+240', flag: '🇬🇶' },
  { code: 'ER', name: 'Eritrea', dial: '+291', flag: '🇪🇷' },
  { code: 'EE', name: 'Estonia', dial: '+372', flag: '🇪🇪' },
  { code: 'SZ', name: 'Eswatini', dial: '+268', flag: '🇸🇿' },
  { code: 'ET', name: 'Ethiopia', dial: '+251', flag: '🇪🇹' },
  { code: 'FJ', name: 'Fiji', dial: '+679', flag: '🇫🇯' },
  { code: 'FI', name: 'Finland', dial: '+358', flag: '🇫🇮' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'GA', name: 'Gabon', dial: '+241', flag: '🇬🇦' },
  { code: 'GM', name: 'Gambia', dial: '+220', flag: '🇬🇲' },
  { code: 'GE', name: 'Georgia', dial: '+995', flag: '🇬🇪' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { code: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭' },
  { code: 'GR', name: 'Greece', dial: '+30', flag: '🇬🇷' },
  { code: 'GD', name: 'Grenada', dial: '+1-473', flag: '🇬🇩' },
  { code: 'GT', name: 'Guatemala', dial: '+502', flag: '🇬🇹' },
  { code: 'GN', name: 'Guinea', dial: '+224', flag: '🇬🇳' },
  { code: 'GW', name: 'Guinea-Bissau', dial: '+245', flag: '🇬🇼' },
  { code: 'GY', name: 'Guyana', dial: '+592', flag: '🇬🇾' },
  { code: 'HT', name: 'Haiti', dial: '+509', flag: '🇭🇹' },
  { code: 'HN', name: 'Honduras', dial: '+504', flag: '🇭🇳' },
  { code: 'HU', name: 'Hungary', dial: '+36', flag: '🇭🇺' },
  { code: 'IS', name: 'Iceland', dial: '+354', flag: '🇮🇸' },
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesia', dial: '+62', flag: '🇮🇩' },
  { code: 'IR', name: 'Iran', dial: '+98', flag: '🇮🇷' },
  { code: 'IQ', name: 'Iraq', dial: '+964', flag: '🇮🇶' },
  { code: 'IE', name: 'Ireland', dial: '+353', flag: '🇮🇪' },
  { code: 'IL', name: 'Israel', dial: '+972', flag: '🇮🇱' },
  { code: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹' },
  { code: 'JM', name: 'Jamaica', dial: '+1-876', flag: '🇯🇲' },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { code: 'JO', name: 'Jordan', dial: '+962', flag: '🇯🇴' },
  { code: 'KZ', name: 'Kazakhstan', dial: '+7', flag: '🇰🇿' },
  { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
  { code: 'KI', name: 'Kiribati', dial: '+686', flag: '🇰🇮' },
  { code: 'KW', name: 'Kuwait', dial: '+965', flag: '🇰🇼' },
  { code: 'KG', name: 'Kyrgyzstan', dial: '+996', flag: '🇰🇬' },
  { code: 'LA', name: 'Laos', dial: '+856', flag: '🇱🇦' },
  { code: 'LV', name: 'Latvia', dial: '+371', flag: '🇱🇻' },
  { code: 'LB', name: 'Lebanon', dial: '+961', flag: '🇱🇧' },
  { code: 'LS', name: 'Lesotho', dial: '+266', flag: '🇱🇸' },
  { code: 'LR', name: 'Liberia', dial: '+231', flag: '🇱🇷' },
  { code: 'LY', name: 'Libya', dial: '+218', flag: '🇱🇾' },
  { code: 'LI', name: 'Liechtenstein', dial: '+423', flag: '🇱🇮' },
  { code: 'LT', name: 'Lithuania', dial: '+370', flag: '🇱🇹' },
  { code: 'LU', name: 'Luxembourg', dial: '+352', flag: '🇱🇺' },
  { code: 'MG', name: 'Madagascar', dial: '+261', flag: '🇲🇬' },
  { code: 'MW', name: 'Malawi', dial: '+265', flag: '🇲🇼' },
  { code: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾' },
  { code: 'MV', name: 'Maldives', dial: '+960', flag: '🇲🇻' },
  { code: 'ML', name: 'Mali', dial: '+223', flag: '🇲🇱' },
  { code: 'MT', name: 'Malta', dial: '+356', flag: '🇲🇹' },
  { code: 'MH', name: 'Marshall Islands', dial: '+692', flag: '🇲🇭' },
  { code: 'MR', name: 'Mauritania', dial: '+222', flag: '🇲🇷' },
  { code: 'MU', name: 'Mauritius', dial: '+230', flag: '🇲🇺' },
  { code: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽' },
  { code: 'FM', name: 'Micronesia', dial: '+691', flag: '🇫🇲' },
  { code: 'MD', name: 'Moldova', dial: '+373', flag: '🇲🇩' },
  { code: 'MC', name: 'Monaco', dial: '+377', flag: '🇲🇨' },
  { code: 'MN', name: 'Mongolia', dial: '+976', flag: '🇲🇳' },
  { code: 'ME', name: 'Montenegro', dial: '+382', flag: '🇲🇪' },
  { code: 'MA', name: 'Morocco', dial: '+212', flag: '🇲🇦' },
  { code: 'MZ', name: 'Mozambique', dial: '+258', flag: '🇲🇿' },
  { code: 'MM', name: 'Myanmar', dial: '+95', flag: '🇲🇲' },
  { code: 'NA', name: 'Namibia', dial: '+264', flag: '🇳🇦' },
  { code: 'NR', name: 'Nauru', dial: '+674', flag: '🇳🇷' },
  { code: 'NP', name: 'Nepal', dial: '+977', flag: '🇳🇵' },
  { code: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
  { code: 'NZ', name: 'New Zealand', dial: '+64', flag: '🇳🇿' },
  { code: 'NI', name: 'Nicaragua', dial: '+505', flag: '🇳🇮' },
  { code: 'NE', name: 'Niger', dial: '+227', flag: '🇳🇪' },
  { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { code: 'KP', name: 'North Korea', dial: '+850', flag: '🇰🇵' },
  { code: 'MK', name: 'North Macedonia', dial: '+389', flag: '🇲🇰' },
  { code: 'NO', name: 'Norway', dial: '+47', flag: '🇳🇴' },
  { code: 'OM', name: 'Oman', dial: '+968', flag: '🇴🇲' },
  { code: 'PK', name: 'Pakistan', dial: '+92', flag: '🇵🇰' },
  { code: 'PW', name: 'Palau', dial: '+680', flag: '🇵🇼' },
  { code: 'PS', name: 'Palestine', dial: '+970', flag: '🇵🇸' },
  { code: 'PA', name: 'Panama', dial: '+507', flag: '🇵🇦' },
  { code: 'PG', name: 'Papua New Guinea', dial: '+675', flag: '🇵🇬' },
  { code: 'PY', name: 'Paraguay', dial: '+595', flag: '🇵🇾' },
  { code: 'PE', name: 'Peru', dial: '+51', flag: '🇵🇪' },
  { code: 'PH', name: 'Philippines', dial: '+63', flag: '🇵🇭' },
  { code: 'PL', name: 'Poland', dial: '+48', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹' },
  { code: 'QA', name: 'Qatar', dial: '+974', flag: '🇶🇦' },
  { code: 'RO', name: 'Romania', dial: '+40', flag: '🇷🇴' },
  { code: 'RU', name: 'Russia', dial: '+7', flag: '🇷🇺' },
  { code: 'RW', name: 'Rwanda', dial: '+250', flag: '🇷🇼' },
  { code: 'KN', name: 'Saint Kitts and Nevis', dial: '+1-869', flag: '🇰🇳' },
  { code: 'LC', name: 'Saint Lucia', dial: '+1-758', flag: '🇱🇨' },
  { code: 'VC', name: 'Saint Vincent', dial: '+1-784', flag: '🇻🇨' },
  { code: 'WS', name: 'Samoa', dial: '+685', flag: '🇼🇸' },
  { code: 'SM', name: 'San Marino', dial: '+378', flag: '🇸🇲' },
  { code: 'ST', name: 'São Tomé and Príncipe', dial: '+239', flag: '🇸🇹' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
  { code: 'SN', name: 'Senegal', dial: '+221', flag: '🇸🇳' },
  { code: 'RS', name: 'Serbia', dial: '+381', flag: '🇷🇸' },
  { code: 'SC', name: 'Seychelles', dial: '+248', flag: '🇸🇨' },
  { code: 'SL', name: 'Sierra Leone', dial: '+232', flag: '🇸🇱' },
  { code: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { code: 'SK', name: 'Slovakia', dial: '+421', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia', dial: '+386', flag: '🇸🇮' },
  { code: 'SB', name: 'Solomon Islands', dial: '+677', flag: '🇸🇧' },
  { code: 'SO', name: 'Somalia', dial: '+252', flag: '🇸🇴' },
  { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { code: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷' },
  { code: 'SS', name: 'South Sudan', dial: '+211', flag: '🇸🇸' },
  { code: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸' },
  { code: 'LK', name: 'Sri Lanka', dial: '+94', flag: '🇱🇰' },
  { code: 'SD', name: 'Sudan', dial: '+249', flag: '🇸🇩' },
  { code: 'SR', name: 'Suriname', dial: '+597', flag: '🇸🇷' },
  { code: 'SE', name: 'Sweden', dial: '+46', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', dial: '+41', flag: '🇨🇭' },
  { code: 'SY', name: 'Syria', dial: '+963', flag: '🇸🇾' },
  { code: 'TW', name: 'Taiwan', dial: '+886', flag: '🇹🇼' },
  { code: 'TJ', name: 'Tajikistan', dial: '+992', flag: '🇹🇯' },
  { code: 'TZ', name: 'Tanzania', dial: '+255', flag: '🇹🇿' },
  { code: 'TH', name: 'Thailand', dial: '+66', flag: '🇹🇭' },
  { code: 'TL', name: 'Timor-Leste', dial: '+670', flag: '🇹🇱' },
  { code: 'TG', name: 'Togo', dial: '+228', flag: '🇹🇬' },
  { code: 'TO', name: 'Tonga', dial: '+676', flag: '🇹🇴' },
  { code: 'TT', name: 'Trinidad and Tobago', dial: '+1-868', flag: '🇹🇹' },
  { code: 'TN', name: 'Tunisia', dial: '+216', flag: '🇹🇳' },
  { code: 'TR', name: 'Turkey', dial: '+90', flag: '🇹🇷' },
  { code: 'TM', name: 'Turkmenistan', dial: '+993', flag: '🇹🇲' },
  { code: 'TV', name: 'Tuvalu', dial: '+688', flag: '🇹🇻' },
  { code: 'UG', name: 'Uganda', dial: '+256', flag: '🇺🇬' },
  { code: 'UA', name: 'Ukraine', dial: '+380', flag: '🇺🇦' },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { code: 'UY', name: 'Uruguay', dial: '+598', flag: '🇺🇾' },
  { code: 'UZ', name: 'Uzbekistan', dial: '+998', flag: '🇺🇿' },
  { code: 'VU', name: 'Vanuatu', dial: '+678', flag: '🇻🇺' },
  { code: 'VA', name: 'Vatican City', dial: '+379', flag: '🇻🇦' },
  { code: 'VE', name: 'Venezuela', dial: '+58', flag: '🇻🇪' },
  { code: 'VN', name: 'Vietnam', dial: '+84', flag: '🇻🇳' },
  { code: 'YE', name: 'Yemen', dial: '+967', flag: '🇾🇪' },
  { code: 'ZM', name: 'Zambia', dial: '+260', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe', dial: '+263', flag: '🇿🇼' },
];

/* ════════════════════════════════════════════════════════════
   SUPPORTED LANGUAGES — neatly structured for grid display
════════════════════════════════════════════════════════════ */
const LANGUAGES = [
  { code: 'en',  name: 'English',    native: 'English'    },
  { code: 'fr',  name: 'French',     native: 'Français'   },
  { code: 'es',  name: 'Spanish',    native: 'Español'    },
  { code: 'pt',  name: 'Portuguese', native: 'Português'  },
  { code: 'ar',  name: 'Arabic',     native: 'العربية'    },
  { code: 'sw',  name: 'Swahili',    native: 'Kiswahili'  },
  { code: 'ha',  name: 'Hausa',      native: 'Hausa'      },
  { code: 'yo',  name: 'Yoruba',     native: 'Yorùbá'     },
  { code: 'ig',  name: 'Igbo',       native: 'Igbo'       },
  { code: 'pcm', name: 'Pidgin',     native: 'Naija'      },
  { code: 'am',  name: 'Amharic',    native: 'አማርኛ'       },
  { code: 'zu',  name: 'Zulu',       native: 'isiZulu'    },
  { code: 'hi',  name: 'Hindi',      native: 'हिन्दी'       },
  { code: 'zh',  name: 'Chinese',    native: '中文'        },
  { code: 'de',  name: 'German',     native: 'Deutsch'    },
  { code: 'ru',  name: 'Russian',    native: 'Русский'    },
];

/* ════════════════════════════════════════════════════════════
   VALIDATION HELPERS
════════════════════════════════════════════════════════════ */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[0-9\s\-+()]{7,20}$/;

/* ════════════════════════════════════════════════════════════
   SEARCHABLE SELECT COMPONENT
   Used for Country and Language pickers
════════════════════════════════════════════════════════════ */
function SearchableSelect({ label, id, options, value, onChange, renderOption, renderSelected, placeholder, error }) {
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState('');
  const containerRef          = useRef(null);
  const searchRef             = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) =>
      (o.name || '').toLowerCase().includes(q) ||
      (o.native || '').toLowerCase().includes(q) ||
      (o.code || '').toLowerCase().includes(q) ||
      (o.dial || '').includes(q)
    );
  }, [options, search]);

  const selected = options.find((o) => o.code === value);

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={id} className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">
        {label}
      </label>
      <button
        type="button"
        id={id}
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-gray-50 dark:bg-white/5
          border ${error ? 'border-red-300' : 'border-gray-200 dark:border-white/10'}
          rounded-xl text-sm text-left transition-colors
          focus:outline-none focus:ring-2 focus:ring-brand-gold/30`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {selected ? renderSelected(selected) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 overflow-hidden bg-white border border-gray-200 dark:bg-gray-900 dark:border-white/10 rounded-2xl shadow-card animate-fade-up">
          {/* Search */}
          <div className="p-2 border-b border-gray-100 dark:border-white/10">
            <div className="relative">
              <Search size={14} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(sanitize(e.target.value))}
                placeholder="Search..."
                className="w-full py-2 pr-8 text-sm placeholder-gray-400 border border-gray-200 pl-9 bg-gray-50 dark:bg-white/5 dark:border-white/10 rounded-xl text-brand-charcoal-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
                autoComplete="off"
                maxLength={60}
              />
              {search && (
                <button type="button" onClick={() => setSearch('')}
                  className="absolute text-gray-400 -translate-y-1/2 right-3 top-1/2">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <ul className="overflow-y-auto max-h-56 scroll-y" role="listbox">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-center text-gray-400">No results found</li>
            ) : (
              filtered.map((option) => (
                <li
                  key={option.code}
                  role="option"
                  aria-selected={option.code === value}
                  onClick={() => { onChange(option.code); setOpen(false); setSearch(''); }}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-colors
                    ${option.code === value
                      ? 'bg-brand-gold/5 text-brand-charcoal-dark dark:text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                >
                  {renderOption(option)}
                  {option.code === value && <Check size={14} className="ml-auto text-brand-gold" />}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN SIGNUP COMPONENT — End-user / Visitor registration
════════════════════════════════════════════════════════════ */
export default function SignUp() {
  const navigate = useNavigate();
  const { login } = useAuth();

  /* ── Form state ─────────────────────────────────────────── */
  const [form, setForm] = useState({
    fullName:    '',
    contactType: 'email',
    email:       '',
    phone:       '',
  });
  const [errors,     setErrors]     = useState({});
  const [loading,    setLoading]    = useState(false);
  const [serverErr,  setServerErr]  = useState('');

  /* ── Honeypot (anti-bot) ────────────────────────────────── */
  const [honeypot, setHoneypot] = useState('');

  /* ── Set single field ───────────────────────────────────── */
  const set = useCallback((field, value) => {
    const clean = sanitize(value);
    setForm((prev) => ({ ...prev, [field]: clean }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    setServerErr('');
  }, [errors]);

  /* ── Validate ───────────────────────────────────────────── */
  const validate = useCallback(() => {
    const e = {};
    if (!form.fullName.trim())                    e.fullName  = 'Full name is required';
    if (form.fullName.length > 100)               e.fullName  = 'Max 100 characters';
    if (form.contactType === 'email') {
      if (!form.email.trim())                     e.email     = 'Email is required';
      else if (!EMAIL_RE.test(form.email))        e.email     = 'Enter a valid email address';
    } else {
      if (!form.phone.trim())                     e.phone     = 'Phone number is required';
      else if (!PHONE_RE.test(form.phone))        e.phone     = 'Enter a valid phone number';
    }
    return e;
  }, [form]);

  /* ── Submit ─────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Honeypot check (bots fill hidden fields)
    if (honeypot) return;

    // Rate limiting
    if (!signupLimiter.attempt()) {
      setServerErr('Too many sign-up attempts. Please try again later.');
      return;
    }

    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    setServerErr('');

    try {
      await new Promise((r) => setTimeout(r, 600));
      login({
        id:    'user_' + Date.now(),
        name:  form.fullName.trim(),
        email: form.contactType === 'email' ? form.email.trim().toLowerCase() : '',
        phone: form.contactType === 'phone' ? form.phone.trim() : '',
        role:  'user',
        verified: false,
      });
      navigate('/dashboard');
    } catch (err) {
      setServerErr(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGmailSignup = async () => {
    if (loading) return;
    setServerErr('');
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      login({
        id:       'user_' + Date.now(),
        name:     'Gmail User',
        email:    'user@gmail.com',
        phone:    '',
        role:     'user',
        verified: true,
      });
      navigate('/dashboard');
    } catch (err) {
      setServerErr(err?.message || 'Gmail sign-up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">

      {/* ── Header strip ──────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10">
        <Link to="/" className="flex items-center gap-2" aria-label="Back to Aurban">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-brand-gold">
            <span className="text-sm font-black leading-none text-white font-display">A</span>
          </div>
          <span className="text-lg font-extrabold font-display text-brand-charcoal-dark dark:text-white">Aurban</span>
        </Link>
      </div>

      {/* ── Main content ──────────────────────────────────── */}
      <div className="flex items-start justify-center flex-1 px-4 py-8 sm:py-12">
        <div className="w-full max-w-lg">

          {/* Title */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold font-display sm:text-3xl text-brand-charcoal-dark dark:text-white">
              Create Your Account
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Just your name and one contact is enough to get started
            </p>
          </div>

          {/* Gmail quick signup */}
          <button
            type="button"
            onClick={handleGmailSignup}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 mb-4
              border-2 border-gray-200 dark:border-white/10 rounded-2xl text-sm font-semibold
              text-brand-charcoal-dark dark:text-white hover:border-brand-gold transition-colors disabled:opacity-50"
          >
            <span className="text-lg">G</span>
            Continue with Gmail
          </button>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-100 dark:bg-white/10" />
            <span className="text-xs font-semibold text-gray-400">OR</span>
            <div className="flex-1 h-px bg-gray-100 dark:bg-white/10" />
          </div>

          {/* Server error */}
          {serverErr && (
            <div className="flex items-center gap-2 px-4 py-3 mb-6 border border-red-200 bg-red-50 dark:bg-red-500/10 dark:border-red-500/20 rounded-xl" role="alert">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{serverErr}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate autoComplete="off" className="space-y-5">

            {/* ── Honeypot (hidden from humans) ────────────── */}
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <label htmlFor="website_url">Website</label>
              <input id="website_url" type="text" tabIndex={-1}
                value={honeypot} onChange={(e) => setHoneypot(e.target.value)}
                autoComplete="off" />
            </div>

            {/* ── Name row ─────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-first" className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">First Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input id="reg-first" type="text" value={form.firstName}
                    onChange={(e) => set('firstName', e.target.value)}
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-gray-50 dark:bg-white/5 border ${errors.firstName ? 'border-red-300' : 'border-gray-200 dark:border-white/10'} rounded-xl text-sm text-brand-charcoal-dark dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/30 transition-colors`}
                    placeholder="First name"
                    autoComplete="given-name"
                    maxLength={50}
                    aria-invalid={!!errors.firstName} />
                </div>
                {errors.firstName && <p role="alert" className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
              </div>
              <div>
                <label htmlFor="reg-last" className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">Last Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input id="reg-last" type="text" value={form.lastName}
                    onChange={(e) => set('lastName', e.target.value)}
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-gray-50 dark:bg-white/5 border ${errors.lastName ? 'border-red-300' : 'border-gray-200 dark:border-white/10'} rounded-xl text-sm text-brand-charcoal-dark dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/30 transition-colors`}
                    placeholder="Last name"
                    autoComplete="family-name"
                    maxLength={50}
                    aria-invalid={!!errors.lastName} />
                </div>
                {errors.lastName && <p role="alert" className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
              </div>
            </div>

            {/* ── Email ────────────────────────────────────── */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="reg-email" type="email" value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-gray-50 dark:bg-white/5 border ${errors.email ? 'border-red-300' : 'border-gray-200 dark:border-white/10'} rounded-xl text-sm text-brand-charcoal-dark dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/30 transition-colors`}
                  placeholder="you@example.com"
                  autoComplete="email"
                  maxLength={120}
                  aria-invalid={!!errors.email} />
              </div>
              {errors.email && <p role="alert" className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* ── Country (searchable, all 195 countries) ──── */}
            <SearchableSelect
              label="Country"
              id="reg-country"
              options={ALL_COUNTRIES}
              value={form.country}
              onChange={(code) => set('country', code)}
              placeholder="Select your country"
              error={errors.country}
              renderSelected={(c) => (
                <span className="flex items-center gap-2">
                  <span className="text-lg">{c.flag}</span>
                  <span className="text-brand-charcoal-dark dark:text-white">{c.name}</span>
                  <span className="ml-1 text-xs text-gray-400">{c.dial}</span>
                </span>
              )}
              renderOption={(c) => (
                <>
                  <span className="text-lg shrink-0">{c.flag}</span>
                  <span className="truncate">{c.name}</span>
                  <span className="ml-auto text-xs text-gray-400 shrink-0">{c.dial}</span>
                </>
              )}
            />
            {errors.country && <p role="alert" className="mt-1 text-xs text-red-500">{errors.country}</p>}

            {/* ── Phone (with detected dial code) ──────────── */}
            <div>
              <label htmlFor="reg-phone" className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">Phone Number</label>
              <div className="relative flex">
                {/* Dial code badge */}
                <div className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-100 dark:bg-white/10 border border-r-0 border-gray-200 dark:border-white/10 rounded-l-xl text-sm text-gray-600 dark:text-gray-300 shrink-0">
                  {selectedCountry ? (
                    <>
                      <span className="text-base">{selectedCountry.flag}</span>
                      <span>{selectedCountry.dial}</span>
                    </>
                  ) : (
                    <>
                      <Phone size={14} />
                      <span>+---</span>
                    </>
                  )}
                </div>
                <input id="reg-phone" type="tel" value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  className={`flex-1 pr-3.5 py-2.5 bg-gray-50 dark:bg-white/5 border ${errors.phone ? 'border-red-300' : 'border-gray-200 dark:border-white/10'} rounded-r-xl text-sm text-brand-charcoal-dark dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/30 transition-colors pl-3`}
                  placeholder="Phone number"
                  autoComplete="tel-national"
                  maxLength={20}
                  aria-invalid={!!errors.phone} />
              </div>
              {errors.phone && <p role="alert" className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>

            {/* ── Preferred Language (neatly arranged grid) ── */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200">
                <Globe size={14} className="inline mr-1.5 -mt-0.5" />
                Preferred Language
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {LANGUAGES.map((lang) => {
                  const isSelected = form.language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => set('language', lang.code)}
                      className={`flex flex-col items-center justify-center px-2 py-2.5 rounded-xl border text-sm transition-all
                        ${isSelected
                          ? 'border-brand-gold bg-brand-gold/5 dark:bg-brand-gold/10 text-brand-charcoal-dark dark:text-white ring-1 ring-brand-gold/30'
                          : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                      aria-pressed={isSelected}
                    >
                      <span className="text-xs font-medium leading-tight">{lang.name}</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">{lang.native}</span>
                      {isSelected && <Check size={12} className="mt-1 text-brand-gold" />}
                    </button>
                  );
                })}
              </div>
              {errors.language && <p role="alert" className="mt-1 text-xs text-red-500">{errors.language}</p>}
            </div>

            {/* ── Password ─────────────────────────────────── */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="reg-password" type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  className={`w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-white/5 border ${errors.password ? 'border-red-300' : 'border-gray-200 dark:border-white/10'} rounded-xl text-sm text-brand-charcoal-dark dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/30 transition-colors`}
                  placeholder="Min 8 chars, include a number"
                  autoComplete="new-password"
                  maxLength={128}
                  aria-invalid={!!errors.password} />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {/* Password strength bar */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= pwStrength ? STRENGTH_COLORS[pwStrength] : 'bg-gray-200 dark:bg-white/10'}`} />
                    ))}
                  </div>
                  <p className={`text-xs mt-1 ${pwStrength <= 1 ? 'text-red-500' : pwStrength <= 2 ? 'text-orange-500' : pwStrength <= 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {STRENGTH_LABELS[pwStrength]}
                  </p>
                </div>
              )}
              {errors.password && <p role="alert" className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* ── Confirm password ─────────────────────────── */}
            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="reg-confirm" type={showCPw ? 'text' : 'password'} value={form.confirm}
                  onChange={(e) => set('confirm', e.target.value)}
                  className={`w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-white/5 border ${errors.confirm ? 'border-red-300' : 'border-gray-200 dark:border-white/10'} rounded-xl text-sm text-brand-charcoal-dark dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/30 transition-colors`}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  maxLength={128}
                  aria-invalid={!!errors.confirm} />
                <button type="button" onClick={() => setShowCPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showCPw ? 'Hide' : 'Show'}>
                  {showCPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {/* Match indicator */}
              {form.confirm && form.password && (
                <p className={`text-xs mt-1 flex items-center gap-1 ${form.password === form.confirm ? 'text-green-600' : 'text-red-500'}`}>
                  {form.password === form.confirm ? <><Check size={12} /> Passwords match</> : <><X size={12} /> Passwords do not match</>}
                </p>
              )}
              {errors.confirm && <p role="alert" className="mt-1 text-xs text-red-500">{errors.confirm}</p>}
            </div>

            {/* ── Submit ───────────────────────────────────── */}
            <button type="submit" disabled={loading}
              className="w-full bg-brand-gold hover:bg-brand-gold-dark text-brand-charcoal-dark font-semibold py-3.5 rounded-2xl text-base transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create My Account'
              )}
            </button>

            {/* ── Terms ────────────────────────────────────── */}
            <p className="text-xs text-center text-gray-400 dark:text-gray-500">
              By creating an account, you agree to Aurban's{' '}
              <Link to="/terms" className="underline text-brand-charcoal dark:text-gray-300">Terms of Service</Link>
              {' & '}
              <Link to="/privacy" className="underline text-brand-charcoal dark:text-gray-300">Privacy Policy</Link>
            </p>
          </form>

          {/* ── Security badge ─────────────────────────────── */}
          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-gray-400">
            <Shield size={14} />
            <span>256-bit SSL encryption · Your data is secure</span>
          </div>

          {/* ── Already have account ───────────────────────── */}
          <p className="mt-6 text-sm text-center text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-gold hover:underline">Log In</Link>
          </p>

          {/* ── Note: This is for visitors/end-users ──────── */}
          <div className="p-4 mt-8 text-center border border-gray-100 bg-gray-50 dark:bg-white/5 rounded-2xl dark:border-white/10">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Are you a property host, agent, service provider, or seller?
            </p>
            <Link to="/onboarding" className="inline-block mt-1 text-sm font-semibold text-brand-gold hover:underline">
              Register as a Provider instead →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

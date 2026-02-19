import { useState, useCallback } from 'react';
import { Keyboard, Eye, EyeOff } from 'lucide-react';
import VirtualKeyboard from './VirtualKeyboard.jsx';

/* ════════════════════════════════════════════════════════════
   SECURE PASSWORD FIELD — Password input with paste blocking
   and optional virtual keyboard for secure entry.

   Props:
     value               — controlled value
     onChange             — (newValue: string) => void
     showVirtualKeyboard  — whether to show keyboard toggle
     keyboardVariant      — 'full' | 'numeric'
     theme                — 'dark' | 'light'
     placeholder, label, disabled, className, autoComplete, id
     onSubmit             — called when Enter pressed on virtual keyboard
════════════════════════════════════════════════════════════ */

export default function SecurePasswordField({
  value = '',
  onChange,
  showVirtualKeyboard = true,
  keyboardVariant = 'full',
  theme = 'dark',
  placeholder = 'Enter password',
  label,
  disabled = false,
  className = '',
  autoComplete = 'current-password',
  id,
  onSubmit,
}) {
  const [kbOpen, setKbOpen] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const isLight = theme === 'light';

  // Block paste
  const handlePaste = useCallback((e) => {
    e.preventDefault();
  }, []);

  // Virtual keyboard handlers
  const handleKeyPress = useCallback((char) => {
    onChange(value + char);
  }, [value, onChange]);

  const handleBackspace = useCallback(() => {
    onChange(value.slice(0, -1));
  }, [value, onChange]);

  const handleEnter = useCallback(() => {
    if (onSubmit) onSubmit();
  }, [onSubmit]);

  // Input styling
  const inputClass = isLight
    ? 'w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl text-brand-charcoal-dark placeholder:text-gray-400 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 dark:bg-gray-800 dark:border-white/10 dark:text-white dark:placeholder:text-gray-500'
    : 'w-full px-4 py-3 text-sm bg-gray-800 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30';

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className={`block mb-1.5 text-xs font-semibold ${isLight ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400'}`}>
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          type={showPwd ? 'text' : 'password'}
          value={value}
          onChange={kbOpen ? undefined : (e) => onChange(e.target.value)}
          onPaste={handlePaste}
          readOnly={kbOpen}
          inputMode={kbOpen ? 'none' : undefined}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`${inputClass} pr-20`}
        />

        <div className="absolute flex items-center gap-1 -translate-y-1/2 right-2 top-1/2">
          {/* Show/hide password */}
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPwd(s => !s)}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight
                ? 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            aria-label={showPwd ? 'Hide password' : 'Show password'}
          >
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>

          {/* Virtual keyboard toggle */}
          {showVirtualKeyboard && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setKbOpen(o => !o)}
              className={`p-1.5 rounded-lg transition-colors ${
                kbOpen
                  ? 'text-brand-gold bg-brand-gold/10'
                  : isLight
                    ? 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                    : 'text-gray-500 hover:text-gray-300'
              }`}
              aria-label={kbOpen ? 'Hide secure keyboard' : 'Show secure keyboard'}
            >
              <Keyboard size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Virtual keyboard panel */}
      {kbOpen && (
        <div className="mt-3 p-3 rounded-xl border bg-gray-900 border-white/10">
          <VirtualKeyboard
            onKeyPress={handleKeyPress}
            onBackspace={handleBackspace}
            onEnter={handleEnter}
            variant={keyboardVariant}
            disabled={disabled}
            theme={theme}
          />
        </div>
      )}
    </div>
  );
}

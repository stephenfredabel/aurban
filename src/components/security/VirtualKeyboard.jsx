import { useState, useCallback, useMemo } from 'react';
import { Delete, CornerDownLeft, Shuffle, ChevronUp } from 'lucide-react';

/* ════════════════════════════════════════════════════════════
   VIRTUAL KEYBOARD — Randomized on-screen keyboard for
   secure password entry. Defeats keyloggers by randomizing
   key positions on each mount and on reshuffle.

   Props:
     onKeyPress  — (char: string) => void
     onBackspace — () => void
     onEnter     — () => void
     variant     — 'full' | 'numeric'
     disabled    — boolean
     theme       — 'dark' | 'light'
════════════════════════════════════════════════════════════ */

const DIGITS = '0123456789'.split('');
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
const SYMBOLS = '!@#$%^&*_+-='.split('');

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function VirtualKeyboard({
  onKeyPress,
  onBackspace,
  onEnter,
  variant = 'full',
  disabled = false,
  theme = 'dark',
}) {
  const [capsLock, setCapsLock] = useState(false);
  const [showSymbols, setShowSymbols] = useState(false);
  const [seed, setSeed] = useState(0); // increment to reshuffle

  const isLight = theme === 'light';

  // Memoized shuffled layouts — re-shuffle when seed changes
  const numericKeys = useMemo(() => shuffle(DIGITS), [seed]);
  const fullKeys = useMemo(() => {
    if (showSymbols) return shuffle([...DIGITS, ...SYMBOLS]);
    return shuffle([...LETTERS, ...DIGITS]);
  }, [seed, showSymbols]);

  const reshuffle = useCallback(() => setSeed(s => s + 1), []);

  const handleKey = useCallback((char, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (disabled) return;
    const output = capsLock ? char.toUpperCase() : char;
    onKeyPress(output);
  }, [capsLock, disabled, onKeyPress]);

  const handleBackspace = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!disabled) onBackspace();
  }, [disabled, onBackspace]);

  const handleEnter = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!disabled) onEnter();
  }, [disabled, onEnter]);

  // Styling
  const keyBase = `flex items-center justify-center rounded-xl font-mono font-semibold
    select-none transition-all active:scale-95 ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`;

  const keyTheme = isLight
    ? 'bg-gray-50 border border-gray-200 text-brand-charcoal-dark hover:bg-gray-100 dark:bg-gray-800 dark:border-white/10 dark:text-white dark:hover:bg-gray-700'
    : 'bg-gray-800 border border-white/10 text-white hover:bg-gray-700';

  const actionTheme = isLight
    ? 'bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:border-white/10 dark:text-gray-300 dark:hover:bg-gray-600'
    : 'bg-gray-700 border border-white/10 text-gray-300 hover:bg-gray-600';

  /* ── Numeric variant ──────────────────────────────── */
  if (variant === 'numeric') {
    return (
      <div className="space-y-2" role="group" aria-label="Secure virtual keyboard">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[10px] font-medium ${isLight ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500'}`}>
            Secure Keyboard
          </span>
          <button
            type="button"
            onClick={reshuffle}
            tabIndex={-1}
            className={`flex items-center gap-1 text-[10px] ${isLight ? 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300' : 'text-gray-500 hover:text-gray-300'} transition-colors`}
          >
            <Shuffle size={10} /> Reshuffle
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {numericKeys.slice(0, 9).map((d) => (
            <button
              key={d}
              type="button"
              tabIndex={-1}
              onClick={(e) => handleKey(d, e)}
              onMouseDown={(e) => e.preventDefault()}
              className={`${keyBase} ${keyTheme} h-12 text-base`}
              aria-label={d}
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            tabIndex={-1}
            onClick={handleBackspace}
            onMouseDown={(e) => e.preventDefault()}
            className={`${keyBase} ${actionTheme} h-12`}
            aria-label="Backspace"
          >
            <Delete size={18} />
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => handleKey(numericKeys[9], e)}
            onMouseDown={(e) => e.preventDefault()}
            className={`${keyBase} ${keyTheme} h-12 text-base`}
            aria-label={numericKeys[9]}
          >
            {numericKeys[9]}
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={handleEnter}
            onMouseDown={(e) => e.preventDefault()}
            className={`${keyBase} h-12 bg-brand-gold text-brand-charcoal-dark border border-brand-gold/50 hover:bg-brand-gold/90 font-bold`}
            aria-label="Enter"
          >
            <CornerDownLeft size={18} />
          </button>
        </div>
      </div>
    );
  }

  /* ── Full variant ─────────────────────────────────── */
  const keys = fullKeys;
  const rows = [];
  for (let i = 0; i < keys.length; i += 6) {
    rows.push(keys.slice(i, i + 6));
  }

  return (
    <div className="space-y-2" role="group" aria-label="Secure virtual keyboard">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[10px] font-medium ${isLight ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500'}`}>
          Secure Keyboard
        </span>
        <button
          type="button"
          onClick={reshuffle}
          tabIndex={-1}
          className={`flex items-center gap-1 text-[10px] ${isLight ? 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300' : 'text-gray-500 hover:text-gray-300'} transition-colors`}
        >
          <Shuffle size={10} /> Reshuffle
        </button>
      </div>

      {/* Key rows */}
      <div className="grid grid-cols-6 gap-1.5">
        {keys.map((char) => (
          <button
            key={char}
            type="button"
            tabIndex={-1}
            onClick={(e) => handleKey(char, e)}
            onMouseDown={(e) => e.preventDefault()}
            className={`${keyBase} ${keyTheme} h-10 text-sm`}
            aria-label={char}
          >
            {capsLock ? char.toUpperCase() : char}
          </button>
        ))}
      </div>

      {/* Action row */}
      <div className="grid grid-cols-6 gap-1.5">
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setCapsLock(c => !c)}
          onMouseDown={(e) => e.preventDefault()}
          className={`${keyBase} h-10 text-[10px] font-bold ${
            capsLock
              ? 'bg-brand-gold text-brand-charcoal-dark border border-brand-gold/50'
              : actionTheme
          }`}
          aria-label={capsLock ? 'Caps lock on' : 'Caps lock off'}
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          tabIndex={-1}
          onClick={() => { setShowSymbols(s => !s); reshuffle(); }}
          onMouseDown={(e) => e.preventDefault()}
          className={`${keyBase} ${showSymbols ? 'bg-brand-gold/20 border-brand-gold/30 text-brand-gold' : actionTheme} h-10 text-[10px] font-bold`}
          aria-label={showSymbols ? 'Show letters' : 'Show symbols'}
        >
          {showSymbols ? 'ABC' : '#+='}
        </button>
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => handleKey(' ', e)}
          onMouseDown={(e) => e.preventDefault()}
          className={`${keyBase} ${keyTheme} h-10 text-[10px] col-span-2`}
          aria-label="Space"
        >
          space
        </button>
        <button
          type="button"
          tabIndex={-1}
          onClick={handleBackspace}
          onMouseDown={(e) => e.preventDefault()}
          className={`${keyBase} ${actionTheme} h-10`}
          aria-label="Backspace"
        >
          <Delete size={16} />
        </button>
        <button
          type="button"
          tabIndex={-1}
          onClick={handleEnter}
          onMouseDown={(e) => e.preventDefault()}
          className={`${keyBase} h-10 bg-brand-gold text-brand-charcoal-dark border border-brand-gold/50 hover:bg-brand-gold/90 font-bold`}
          aria-label="Enter"
        >
          <CornerDownLeft size={16} />
        </button>
      </div>
    </div>
  );
}

import { Sun, Moon } from 'lucide-react';
import { useTheme }  from '../context/ThemeContext.jsx';

export default function ThemeToggle({ size = 'md' }) {
  const { isDark, toggle } = useTheme();

  const dim = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      className={`${dim} rounded-xl flex items-center justify-center
        bg-brand-gray-soft dark:bg-white/10
        hover:bg-gray-200 dark:hover:bg-white/20
        text-brand-charcoal dark:text-white
        transition-colors`}
    >
      {isDark
        ? <Sun  size={16} aria-hidden />
        : <Moon size={16} aria-hidden />
      }
    </button>
  );
}
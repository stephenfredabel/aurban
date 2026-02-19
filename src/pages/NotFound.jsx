import { Link }           from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Search }   from 'lucide-react';

export default function NotFoundPage() {
  useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-white">
      <div className="flex items-center justify-center w-20 h-20 mb-6 rounded-3xl bg-brand-gold/10">
        <span className="text-4xl font-black font-display text-brand-gold">404</span>
      </div>
      <h1 className="mb-2 text-2xl font-extrabold font-display text-brand-charcoal-dark">
        Page not found
      </h1>
      <p className="max-w-xs mb-8 text-sm leading-relaxed text-gray-400 font-body">
        This page doesn't exist or has been moved. Let's get you back on track.
      </p>
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 btn-primary">
          <Home size={15} />
          Go Home
        </Link>
        <Link to="/properties" className="flex items-center gap-2 btn-outline">
          <Search size={15} />
          Browse
        </Link>
      </div>
    </div>
  );
}
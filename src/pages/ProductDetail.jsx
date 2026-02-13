import { useParams, Link }   from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Star, BadgeCheck, MessageSquare } from 'lucide-react';
import { useCurrency }       from '../hooks/useCurrency.js';

export default function ProductDetail() {
  const { id }     = useParams();
  const { format } = useCurrency();

  return (
    <div className="max-w-2xl px-4 py-6 pb-24 mx-auto lg:pb-8">
      <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-sm text-brand-charcoal hover:text-brand-charcoal-dark mb-5">
        <ArrowLeft size={16} /> Marketplace
      </Link>
      <div className="p-8 text-center bg-white rounded-3xl shadow-card">
        <ShoppingCart size={36} className="mx-auto mb-3 text-gray-200" />
        <h1 className="mb-2 font-bold font-display text-brand-charcoal-dark">Product #{id}</h1>
        <p className="mb-4 text-sm text-gray-400">Full product detail page coming in the next release.</p>
        <Link to="/marketplace" className="btn-primary text-sm inline-flex items-center gap-1.5">
          <ArrowLeft size={14} /> Back to marketplace
        </Link>
      </div>
    </div>
  );
}
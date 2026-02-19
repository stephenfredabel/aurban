import { Truck, MapPin, Clock, Shield, RotateCcw } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency.js';
import { getRefundBadge } from '../../data/categoryFields.js';

/* ════════════════════════════════════════════════════════════
   DELIVERY INFO CARD — Delivery + return policy for products
════════════════════════════════════════════════════════════ */

export default function DeliveryInfoCard({ product }) {
  const { format } = useCurrency();

  if (!product) return null;
  const {
    deliveryOption, deliveryFee, deliveryTime,
    deliveryAreas, category, warranty,
  } = product;

  const refund = getRefundBadge(category);

  const deliveryLabel =
    deliveryOption === 'both' ? 'Pickup or Delivery'
    : deliveryOption === 'delivery' ? 'Delivery Available'
    : 'Pickup Only';

  return (
    <div className="space-y-4">
      {/* Delivery */}
      <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
        <h3 className="flex items-center gap-2 mb-3 text-sm font-bold text-brand-charcoal-dark dark:text-white">
          <Truck size={15} className="text-brand-gold" /> Delivery
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400">Method:</span>
            <span className="font-semibold text-brand-charcoal-dark dark:text-white">{deliveryLabel}</span>
          </div>
          {deliveryFee != null && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Delivery Fee:</span>
              <span className="font-semibold text-brand-charcoal-dark dark:text-white">
                {deliveryFee === 0 ? 'Free' : format(deliveryFee)}
              </span>
            </div>
          )}
          {deliveryTime && (
            <div className="flex items-center gap-2">
              <Clock size={13} className="text-gray-400 shrink-0" />
              <span className="text-gray-500 dark:text-gray-400">Est. Delivery:</span>
              <span className="font-semibold text-brand-charcoal-dark dark:text-white">{deliveryTime}</span>
            </div>
          )}
          {deliveryAreas?.length > 0 && (
            <div className="flex items-start gap-2">
              <MapPin size={13} className="mt-0.5 text-gray-400 shrink-0" />
              <div>
                <span className="text-gray-500 dark:text-gray-400">Delivers to: </span>
                <span className="font-semibold text-brand-charcoal-dark dark:text-white">
                  {deliveryAreas.join(', ')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Warranty + Return Policy */}
      <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
        <h3 className="flex items-center gap-2 mb-3 text-sm font-bold text-brand-charcoal-dark dark:text-white">
          <Shield size={15} className="text-brand-gold" /> Warranty & Returns
        </h3>
        <div className="space-y-2 text-sm">
          {warranty && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Warranty:</span>
              <span className="font-semibold text-brand-charcoal-dark dark:text-white">{warranty}</span>
            </div>
          )}
          <div className="flex items-start gap-2">
            <RotateCcw size={13} className="mt-0.5 text-gray-400 shrink-0" />
            <div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${refund.bg} ${refund.text}`}>
                {refund.label}
              </span>
              {refund.conditions && (
                <p className="mt-1 text-xs leading-relaxed text-gray-400">{refund.conditions}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

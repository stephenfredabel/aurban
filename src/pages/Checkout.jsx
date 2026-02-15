import { useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ShoppingCart, MapPin, Truck, CreditCard,
  CheckCircle2, ArrowRight, Shield, AlertCircle, Package,
  Phone, Home as HomeIcon, Landmark, Clock, Lock,
} from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCurrency } from '../hooks/useCurrency.js';
import { PRODUCT_CATEGORY_MAP } from '../data/categoryFields.js';
import { initiatePayment } from '../services/payment.service.js';

/* ════════════════════════════════════════════════════════════
   CHECKOUT PAGE — Multi-step wizard
   Steps: Review → Address → Delivery → Summary → Payment → Confirmation
════════════════════════════════════════════════════════════ */

const STEPS = ['Review', 'Address', 'Delivery', 'Summary', 'Payment', 'Confirmation'];

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT - Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara',
  'Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau',
  'Rivers','Sokoto','Taraba','Yobe','Zamfara',
];

const UNIT_LABEL = {
  per_unit:'/ unit', per_bag:'/ bag', per_carton:'/ carton',
  per_sqm:'/ m²', per_set:'/ set', per_metre:'/ m',
  per_tonne:'/ tonne', per_roll:'/ roll', bulk_price:'LOT',
};

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, groupedBySeller, subtotal, totalDeliveryFee, serviceFee, grandTotal, clearCart } = useCart();
  const { symbol } = useCurrency();

  const [step, setStep] = useState(0);
  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: '',
    state: '',
    city: '',
    address: '',
    landmark: '',
  });
  const [deliveryChoices, setDeliveryChoices] = useState({}); // { sellerId: 'delivery'|'pickup' }
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [orderRef, setOrderRef] = useState('');

  // Redirect if cart is empty (except on confirmation)
  if (items.length === 0 && step < 5) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <ShoppingCart size={48} className="mb-4 text-gray-200 dark:text-gray-700" />
        <p className="mb-2 text-lg font-bold text-brand-charcoal-dark dark:text-white">Your cart is empty</p>
        <p className="mb-5 text-sm text-gray-400">Add products before checking out</p>
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white rounded-xl bg-brand-gold hover:bg-brand-gold-dark"
        >
          Browse Marketplace <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  // Recalculate delivery based on choices
  const adjustedDelivery = useMemo(() => {
    let fee = 0;
    for (const g of groupedBySeller) {
      const choice = deliveryChoices[g.sellerId] || 'delivery';
      if (choice === 'delivery') fee += g.deliveryFee;
    }
    return fee;
  }, [groupedBySeller, deliveryChoices]);

  const adjustedTotal = subtotal + adjustedDelivery + serviceFee;

  /* ── Validation ── */
  const validateStep = useCallback(() => {
    if (step === 0) return true; // review always valid
    if (step === 1) {
      return address.fullName.trim() && address.phone.trim() &&
        address.state && address.city.trim() && address.address.trim();
    }
    if (step === 2) return true; // delivery choices always have defaults
    if (step === 3) return agreedToTerms;
    return true;
  }, [step, address, agreedToTerms]);

  const goNext = () => { if (validateStep()) setStep(s => Math.min(s + 1, STEPS.length - 1)); };
  const goBack = () => setStep(s => Math.max(s - 1, 0));

  /* ── Payment handler ── */
  const handlePayment = async () => {
    setPaymentLoading(true);
    setPaymentError('');
    try {
      const ref = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const result = await initiatePayment({
        amount: adjustedTotal * 100,
        currency: 'NGN',
        type: 'marketplace_order',
        entityId: ref,
        description: `Aurban Marketplace Order — ${items.length} item(s)`,
        metadata: {
          orderRef: ref,
          items: items.map(i => ({ id: i.productId, qty: i.quantity })),
          address,
          deliveryChoices,
        },
      });

      // Mock success for dev
      if (!result.success && !result.paymentUrl) {
        setOrderRef(ref);
        clearCart();
        setStep(5);
        return;
      }

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        setOrderRef(ref);
        clearCart();
        setStep(5);
      }
    } catch {
      setPaymentError('Payment failed. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-32 bg-white dark:bg-brand-charcoal-dark">
      {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 dark:bg-brand-charcoal-dark dark:border-white/10">
        <div className="flex items-center gap-3 px-4 py-3 mx-auto max-w-3xl">
          <button
            type="button"
            onClick={() => step > 0 && step < 5 ? goBack() : navigate(-1)}
            className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-brand-gray-soft dark:hover:bg-white/10"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-extrabold font-display text-brand-charcoal-dark dark:text-white">
              {step === 5 ? 'Order Confirmed' : 'Checkout'}
            </h1>
            {step < 5 && (
              <p className="text-xs text-gray-400 mt-0.5">
                Step {step + 1} of {STEPS.length - 1} — {STEPS[step]}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {step < 5 && (
          <div className="px-4 pb-3 mx-auto max-w-3xl">
            <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500 rounded-full bg-brand-gold"
                style={{ width: `${((step + 1) / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              {STEPS.slice(0, -1).map((s, i) => (
                <span key={s} className={`text-[9px] font-medium ${i <= step ? 'text-brand-gold' : 'text-gray-300 dark:text-gray-600'}`}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 mx-auto mt-6 max-w-3xl">

        {/* ════════════════════════════════════════════
            STEP 0 — Order Review
        ════════════════════════════════════════════ */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-sm font-bold text-brand-charcoal-dark dark:text-white">
              Review Your Order ({items.length} item{items.length !== 1 ? 's' : ''})
            </h2>

            {groupedBySeller.map(group => (
              <div key={group.sellerId} className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
                <p className="mb-3 text-xs font-bold tracking-wider text-gray-400 uppercase">
                  {group.sellerName}
                </p>
                <div className="space-y-3">
                  {group.items.map(item => {
                    const emoji = PRODUCT_CATEGORY_MAP[item.category]?.emoji || '📦';
                    return (
                      <div key={item.productId} className="flex gap-3">
                        <div className="flex items-center justify-center w-14 h-14 text-xl rounded-xl bg-brand-gray-soft dark:bg-white/5 shrink-0">
                          {emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white line-clamp-1">{item.title}</p>
                          <p className="text-xs text-gray-400">
                            {symbol}{item.price.toLocaleString()} {UNIT_LABEL[item.pricingUnit] || ''} × {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-extrabold text-brand-charcoal-dark dark:text-white shrink-0">
                          {symbol}{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
                {group.deliveryFee > 0 && (
                  <p className="mt-2 text-[11px] text-gray-400 text-right">
                    Delivery: {symbol}{group.deliveryFee.toLocaleString()}
                  </p>
                )}
              </div>
            ))}

            {/* Quick totals */}
            <div className="p-4 space-y-1 text-sm border border-gray-100 dark:border-white/10 rounded-2xl">
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Subtotal</span>
                <span className="font-semibold text-brand-charcoal-dark dark:text-white">{symbol}{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Delivery</span>
                <span className="font-semibold text-brand-charcoal-dark dark:text-white">
                  {totalDeliveryFee === 0 ? 'Free' : `${symbol}${totalDeliveryFee.toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Service fee (1.5%)</span>
                <span className="font-semibold text-brand-charcoal-dark dark:text-white">{symbol}{serviceFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-white/10">
                <span className="font-bold text-brand-charcoal-dark dark:text-white">Total</span>
                <span className="text-lg font-extrabold text-brand-gold">{symbol}{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            STEP 1 — Delivery Address
        ════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-brand-charcoal-dark dark:text-white">
              <MapPin size={15} className="text-brand-gold" /> Delivery Address
            </h2>

            <div className="space-y-4">
              {/* Full name */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Full Name *</label>
                <div className="relative">
                  <HomeIcon size={14} className="absolute text-gray-400 left-3 top-3.5" />
                  <input
                    type="text"
                    value={address.fullName}
                    onChange={e => setAddress(a => ({ ...a, fullName: e.target.value }))}
                    placeholder="Recipient full name"
                    className="w-full py-3 pl-9 pr-4 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Phone Number *</label>
                <div className="relative">
                  <Phone size={14} className="absolute text-gray-400 left-3 top-3.5" />
                  <input
                    type="tel"
                    value={address.phone}
                    onChange={e => setAddress(a => ({ ...a, phone: e.target.value }))}
                    placeholder="080XXXXXXXX"
                    className="w-full py-3 pl-9 pr-4 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none"
                  />
                </div>
              </div>

              {/* State + City row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">State *</label>
                  <select
                    value={address.state}
                    onChange={e => setAddress(a => ({ ...a, state: e.target.value }))}
                    className="w-full py-3 px-3 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none"
                  >
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">City *</label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={e => setAddress(a => ({ ...a, city: e.target.value }))}
                    placeholder="e.g. Ikeja"
                    className="w-full py-3 px-3 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none"
                  />
                </div>
              </div>

              {/* Street address */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Street Address *</label>
                <textarea
                  value={address.address}
                  onChange={e => setAddress(a => ({ ...a, address: e.target.value }))}
                  placeholder="House number, street name, area"
                  rows={2}
                  className="w-full py-3 px-3 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none resize-none"
                />
              </div>

              {/* Landmark */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Nearest Landmark</label>
                <div className="relative">
                  <Landmark size={14} className="absolute text-gray-400 left-3 top-3.5" />
                  <input
                    type="text"
                    value={address.landmark}
                    onChange={e => setAddress(a => ({ ...a, landmark: e.target.value }))}
                    placeholder="e.g. Opposite GTBank"
                    className="w-full py-3 pl-9 pr-4 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            STEP 2 — Delivery Options (per seller)
        ════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-brand-charcoal-dark dark:text-white">
              <Truck size={15} className="text-brand-gold" /> Delivery Options
            </h2>
            <p className="text-xs text-gray-400">Choose delivery or pickup for each seller</p>

            {groupedBySeller.map(group => {
              const choice = deliveryChoices[group.sellerId] || 'delivery';
              const hasDeliveryItems = group.items.some(i => i.deliveryOption !== 'pickup');
              const hasPickupItems = group.items.some(i => i.deliveryOption !== 'delivery');

              return (
                <div key={group.sellerId} className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
                  <p className="mb-3 text-xs font-bold tracking-wider text-gray-400 uppercase">
                    {group.sellerName}
                  </p>
                  <p className="mb-3 text-xs text-gray-400">
                    {group.items.length} item{group.items.length !== 1 ? 's' : ''} — Subtotal: {symbol}{group.subtotal.toLocaleString()}
                  </p>

                  <div className="flex gap-2">
                    {hasDeliveryItems && (
                      <button
                        type="button"
                        onClick={() => setDeliveryChoices(dc => ({ ...dc, [group.sellerId]: 'delivery' }))}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold border rounded-xl transition-colors ${
                          choice === 'delivery'
                            ? 'border-brand-gold bg-brand-gold/5 text-brand-gold'
                            : 'border-gray-200 dark:border-white/10 text-gray-500 hover:border-brand-gold/50'
                        }`}
                      >
                        <Truck size={14} />
                        Delivery
                        {group.deliveryFee > 0 && (
                          <span className="text-[10px] font-normal">({symbol}{group.deliveryFee.toLocaleString()})</span>
                        )}
                        {group.deliveryFee === 0 && <span className="text-[10px] text-emerald-500">Free</span>}
                      </button>
                    )}
                    {hasPickupItems && (
                      <button
                        type="button"
                        onClick={() => setDeliveryChoices(dc => ({ ...dc, [group.sellerId]: 'pickup' }))}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold border rounded-xl transition-colors ${
                          choice === 'pickup'
                            ? 'border-brand-gold bg-brand-gold/5 text-brand-gold'
                            : 'border-gray-200 dark:border-white/10 text-gray-500 hover:border-brand-gold/50'
                        }`}
                      >
                        <Package size={14} />
                        Self Pickup
                        <span className="text-[10px] text-emerald-500">Free</span>
                      </button>
                    )}
                  </div>

                  {choice === 'delivery' && group.items[0]?.deliveryTime && (
                    <p className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-400">
                      <Clock size={11} /> Est. delivery: {group.items[0].deliveryTime}
                    </p>
                  )}
                </div>
              );
            })}

            {/* Adjusted total preview */}
            <div className="p-3 text-sm border border-brand-gold/20 bg-brand-gold/5 rounded-xl">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Delivery total</span>
                <span className="font-bold text-brand-charcoal-dark dark:text-white">
                  {adjustedDelivery === 0 ? 'Free' : `${symbol}${adjustedDelivery.toLocaleString()}`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            STEP 3 — Order Summary + T&C
        ════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-brand-charcoal-dark dark:text-white">
              <CreditCard size={15} className="text-brand-gold" /> Order Summary
            </h2>

            {/* Items summary */}
            <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
              <p className="mb-3 text-xs font-bold tracking-wider text-gray-400 uppercase">Items</p>
              {items.map(item => (
                <div key={item.productId} className="flex justify-between py-1.5 text-sm">
                  <span className="text-gray-500 dark:text-gray-400 line-clamp-1 flex-1 mr-3">{item.title} × {item.quantity}</span>
                  <span className="font-semibold text-brand-charcoal-dark dark:text-white shrink-0">{symbol}{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Delivery address summary */}
            <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
              <p className="mb-2 text-xs font-bold tracking-wider text-gray-400 uppercase">Delivery Address</p>
              <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">{address.fullName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{address.address}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{address.city}, {address.state}</p>
              {address.landmark && <p className="text-xs text-gray-400">Near: {address.landmark}</p>}
              <p className="text-sm text-gray-500 dark:text-gray-400">{address.phone}</p>
            </div>

            {/* Price breakdown */}
            <div className="p-4 space-y-2 text-sm border border-gray-100 dark:border-white/10 rounded-2xl">
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Subtotal</span>
                <span className="font-semibold text-brand-charcoal-dark dark:text-white">{symbol}{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Delivery</span>
                <span className="font-semibold text-brand-charcoal-dark dark:text-white">
                  {adjustedDelivery === 0 ? 'Free' : `${symbol}${adjustedDelivery.toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Service fee (1.5%)</span>
                <span className="font-semibold text-brand-charcoal-dark dark:text-white">{symbol}{serviceFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-white/10">
                <span className="font-bold text-brand-charcoal-dark dark:text-white">Grand Total</span>
                <span className="text-lg font-extrabold text-brand-gold">{symbol}{adjustedTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Escrow notice */}
            <div className="flex gap-3 p-4 border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 rounded-2xl">
              <Shield size={18} className="mt-0.5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Buyer Protection — Escrow</p>
                <p className="mt-1 text-xs leading-relaxed text-emerald-600 dark:text-emerald-400/80">
                  Your payment is held securely in escrow until you confirm delivery.
                  Funds are released to the seller 48 hours after confirmation. You can
                  raise a dispute within the refund window if there&apos;s an issue.
                </p>
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={e => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 accent-brand-gold rounded"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                I agree to the <span className="font-semibold text-brand-gold">Terms & Conditions</span> and
                understand that my payment will be held in escrow until I confirm receipt of all items.
              </span>
            </label>
          </div>
        )}

        {/* ════════════════════════════════════════════
            STEP 4 — Payment
        ════════════════════════════════════════════ */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-brand-charcoal-dark dark:text-white">
              <CreditCard size={15} className="text-brand-gold" /> Payment
            </h2>

            <div className="p-6 text-center border border-gray-100 dark:border-white/10 rounded-2xl">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-brand-gold/10">
                <Lock size={24} className="text-brand-gold" />
              </div>
              <p className="mb-1 text-2xl font-extrabold text-brand-charcoal-dark dark:text-white">
                {symbol}{adjustedTotal.toLocaleString()}
              </p>
              <p className="mb-6 text-xs text-gray-400">Secure payment via Paystack</p>

              {paymentError && (
                <div className="flex items-center gap-2 p-3 mb-4 text-sm text-red-600 border border-red-200 rounded-xl bg-red-50 dark:bg-red-500/10 dark:border-red-500/20">
                  <AlertCircle size={14} /> {paymentError}
                </div>
              )}

              <button
                type="button"
                onClick={handlePayment}
                disabled={paymentLoading}
                className="flex items-center justify-center w-full gap-2 py-4 text-sm font-bold text-white transition-colors rounded-2xl bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-50"
              >
                {paymentLoading ? (
                  <>Processing...</>
                ) : (
                  <>Pay {symbol}{adjustedTotal.toLocaleString()} <ArrowRight size={14} /></>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-gray-400">
                <Shield size={10} /> Secured by 256-bit SSL encryption
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            STEP 5 — Confirmation
        ════════════════════════════════════════════ */}
        {step === 5 && (
          <div className="py-8 text-center">
            <div className="flex items-center justify-center w-20 h-20 mx-auto mb-5 rounded-full bg-emerald-50 dark:bg-emerald-500/10">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h2 className="mb-2 text-xl font-extrabold text-brand-charcoal-dark dark:text-white">
              Order Placed Successfully!
            </h2>
            <p className="mb-1 text-sm text-gray-400">Your order reference:</p>
            <p className="mb-6 text-lg font-bold font-mono text-brand-gold">{orderRef}</p>

            <div className="p-4 mx-auto mb-6 text-left border border-gray-100 dark:border-white/10 rounded-2xl max-w-sm">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                    Pending Confirmation
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Escrow Held</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total</span>
                  <span className="font-extrabold text-brand-charcoal-dark dark:text-white">{symbol}{adjustedTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <p className="mb-6 text-xs leading-relaxed text-gray-400 max-w-sm mx-auto">
              Each seller will be notified of your order. You can track the status
              of each shipment from your dashboard.
            </p>

            <div className="flex flex-col gap-3 max-w-sm mx-auto">
              <Link
                to="/dashboard/orders"
                className="flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-white transition-colors rounded-2xl bg-brand-gold hover:bg-brand-gold-dark"
              >
                <Package size={14} /> Track My Orders
              </Link>
              <Link
                to="/marketplace"
                className="flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-colors border border-gray-200 dark:border-white/10 rounded-2xl text-brand-charcoal-dark dark:text-white hover:border-brand-gold"
              >
                Continue Shopping <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky bottom CTA ── */}
      {step < 4 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 dark:bg-brand-charcoal-dark dark:border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 mx-auto max-w-3xl">
            {step > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="flex items-center justify-center px-5 py-3.5 text-sm font-bold border border-gray-200 dark:border-white/10 rounded-2xl text-brand-charcoal-dark dark:text-white hover:border-brand-gold"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={step === 3 ? () => setStep(4) : goNext}
              disabled={!validateStep()}
              className="flex items-center justify-center flex-1 gap-2 py-3.5 text-sm font-bold text-white transition-colors rounded-2xl bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-40"
            >
              {step === 3 ? (
                <>Proceed to Payment <CreditCard size={14} /></>
              ) : (
                <>Continue <ArrowRight size={14} /></>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

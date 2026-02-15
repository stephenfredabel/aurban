import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Package, Truck, CheckCircle2, Clock,
  MapPin, Phone, Shield, AlertTriangle, MessageSquare,
  XCircle, CreditCard, Store, Flag,
} from 'lucide-react';
import { useOrder, ORDER_STATUSES } from '../../context/OrderContext.jsx';
import { useCurrency } from '../../hooks/useCurrency.js';
import { PRODUCT_CATEGORY_MAP } from '../../data/categoryFields.js';

/* ════════════════════════════════════════════════════════════
   ORDER DETAIL — Single order view with tracking timeline
   Route: /dashboard/orders/:id
════════════════════════════════════════════════════════════ */

const TIMELINE_STEPS = [
  { key: 'pending_payment', label: 'Order Placed',     icon: Package },
  { key: 'paid',            label: 'Payment Received', icon: CreditCard },
  { key: 'accepted',        label: 'Seller Accepted',  icon: CheckCircle2 },
  { key: 'processing',      label: 'Processing',       icon: Clock },
  { key: 'shipped',         label: 'Shipped',          icon: Truck },
  { key: 'delivered',       label: 'Delivered',         icon: MapPin },
  { key: 'completed',       label: 'Completed',        icon: CheckCircle2 },
];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getOrderById, confirmDelivery, cancelOrder, requestRefund } = useOrder();
  const { symbol } = useCurrency();

  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [issueModal, setIssueModal] = useState(false);
  const [issueReason, setIssueReason] = useState('');

  const order = getOrderById(id);

  useEffect(() => {
    document.title = order ? `Order ${order.ref} — Aurban` : 'Order — Aurban';
  }, [order]);

  if (!order) {
    return (
      <div className="py-16 text-center">
        <Package size={48} className="mx-auto mb-4 text-gray-200 dark:text-gray-700" />
        <p className="mb-2 text-lg font-bold text-brand-charcoal-dark dark:text-white">Order not found</p>
        <Link to="/dashboard/orders" className="text-sm font-semibold text-brand-gold hover:underline">
          Back to orders
        </Link>
      </div>
    );
  }

  const status = ORDER_STATUSES[order.status] || ORDER_STATUSES.pending_payment;
  const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;

  // Find how far the timeline has progressed
  const timelineMap = {};
  for (const entry of (order.timeline || [])) {
    timelineMap[entry.status] = entry.date;
  }
  const isCancelled = ['cancelled', 'disputed', 'refund_requested', 'refunded'].includes(order.status);

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleConfirmDelivery = () => {
    confirmDelivery(order.id);
  };

  const handleCancel = () => {
    if (cancelReason.trim()) {
      cancelOrder(order.id, cancelReason);
      setCancelModal(false);
      setCancelReason('');
    }
  };

  const handleReportIssue = () => {
    if (issueReason.trim()) {
      requestRefund(order.id, issueReason);
      setIssueModal(false);
      setIssueReason('');
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => navigate('/dashboard/orders')}
          className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-brand-gray-soft dark:hover:bg-white/10">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-extrabold font-display text-brand-charcoal-dark dark:text-white">
            Order {order.ref}
          </h1>
          <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* ── Tracking Timeline ── */}
      {!isCancelled && (
        <div className="p-5 mb-5 bg-white border border-gray-100 rounded-2xl dark:bg-gray-900 dark:border-white/10">
          <h3 className="mb-4 text-xs font-bold tracking-wider text-gray-400 uppercase">Order Tracking</h3>
          <div className="relative pl-6">
            {TIMELINE_STEPS.map((step, idx) => {
              const isCompleted = !!timelineMap[step.key];
              const isCurrent = order.status === step.key;
              const StepIcon = step.icon;
              const date = timelineMap[step.key];

              return (
                <div key={step.key} className="relative pb-5 last:pb-0">
                  {/* Vertical line */}
                  {idx < TIMELINE_STEPS.length - 1 && (
                    <div className={`absolute left-[-16px] top-6 w-0.5 h-full ${
                      isCompleted ? 'bg-brand-gold' : 'bg-gray-200 dark:bg-white/10'
                    }`} />
                  )}

                  {/* Step dot */}
                  <div className={`absolute left-[-22px] top-0.5 flex items-center justify-center w-5 h-5 rounded-full border-2 ${
                    isCompleted
                      ? 'bg-brand-gold border-brand-gold text-white'
                      : isCurrent
                        ? 'bg-white dark:bg-gray-900 border-brand-gold'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-white/20'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 size={10} />
                    ) : (
                      <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-brand-gold animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${
                      isCompleted || isCurrent ? 'text-brand-charcoal-dark dark:text-white' : 'text-gray-300 dark:text-gray-600'
                    }`}>
                      {step.label}
                    </span>
                    {date && (
                      <span className="text-[10px] text-gray-400">{formatDate(date)}</span>
                    )}
                  </div>

                  {/* Tracking info on shipped */}
                  {step.key === 'shipped' && isCompleted && order.trackingInfo && (
                    <p className="mt-1 text-xs text-brand-gold">{order.trackingInfo}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancelled / Disputed notice */}
      {isCancelled && (
        <div className="flex gap-3 p-4 mb-5 border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 rounded-2xl">
          <XCircle size={18} className="mt-0.5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-700 dark:text-red-400">
              {order.status === 'cancelled' ? 'Order Cancelled' : order.status === 'refund_requested' ? 'Refund Requested' : 'Under Dispute'}
            </p>
            {order.cancelReason && <p className="mt-1 text-xs text-red-600 dark:text-red-400/80">{order.cancelReason}</p>}
            {order.refundReason && <p className="mt-1 text-xs text-red-600 dark:text-red-400/80">{order.refundReason}</p>}
          </div>
        </div>
      )}

      {/* ── Items ── */}
      <div className="p-4 mb-5 bg-white border border-gray-100 rounded-2xl dark:bg-gray-900 dark:border-white/10">
        <h3 className="mb-3 text-xs font-bold tracking-wider text-gray-400 uppercase">
          Items ({itemCount})
        </h3>
        <div className="space-y-3">
          {order.items?.map((item, idx) => {
            const emoji = PRODUCT_CATEGORY_MAP[item.category]?.emoji || '📦';
            return (
              <div key={idx} className="flex gap-3">
                <div className="flex items-center justify-center w-12 h-12 text-lg rounded-xl bg-brand-gray-soft dark:bg-white/5 shrink-0">
                  {emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white line-clamp-1">{item.title}</p>
                  <p className="text-xs text-gray-400">Qty: {item.quantity} × {symbol}{item.price?.toLocaleString()}</p>
                </div>
                <p className="text-sm font-extrabold text-brand-charcoal-dark dark:text-white shrink-0">
                  {symbol}{(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Delivery Address ── */}
      {order.address && (
        <div className="p-4 mb-5 bg-white border border-gray-100 rounded-2xl dark:bg-gray-900 dark:border-white/10">
          <h3 className="mb-3 text-xs font-bold tracking-wider text-gray-400 uppercase">Delivery Address</h3>
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-brand-charcoal-dark dark:text-white">{order.address.fullName}</p>
            <p className="text-gray-500 dark:text-gray-400">{order.address.address}</p>
            <p className="text-gray-500 dark:text-gray-400">{order.address.city}, {order.address.state}</p>
            {order.address.landmark && <p className="text-xs text-gray-400">Near: {order.address.landmark}</p>}
            <p className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <Phone size={12} /> {order.address.phone}
            </p>
          </div>
        </div>
      )}

      {/* ── Payment Breakdown ── */}
      <div className="p-4 mb-5 bg-white border border-gray-100 rounded-2xl dark:bg-gray-900 dark:border-white/10">
        <h3 className="mb-3 text-xs font-bold tracking-wider text-gray-400 uppercase">Payment</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-500 dark:text-gray-400">
            <span>Subtotal</span>
            <span className="font-semibold text-brand-charcoal-dark dark:text-white">{symbol}{order.subtotal?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-500 dark:text-gray-400">
            <span>Delivery</span>
            <span className="font-semibold text-brand-charcoal-dark dark:text-white">
              {order.deliveryFee === 0 ? 'Free' : `${symbol}${order.deliveryFee?.toLocaleString()}`}
            </span>
          </div>
          <div className="flex justify-between text-gray-500 dark:text-gray-400">
            <span>Service fee</span>
            <span className="font-semibold text-brand-charcoal-dark dark:text-white">{symbol}{order.serviceFee?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-white/10">
            <span className="font-bold text-brand-charcoal-dark dark:text-white">Total</span>
            <span className="text-lg font-extrabold text-brand-gold">{symbol}{order.total?.toLocaleString()}</span>
          </div>
        </div>

        {/* Escrow status */}
        <div className="flex items-center gap-2 mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20">
          <Shield size={14} className="text-emerald-500 shrink-0" />
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            Escrow: {order.escrowStatus === 'held' ? 'Funds held securely' : order.escrowStatus === 'released' ? 'Released to seller' : order.escrowStatus === 'refunded' ? 'Refunded to you' : 'Pending'}
          </span>
        </div>
      </div>

      {/* ── Seller Contact ── */}
      <div className="p-4 mb-5 bg-white border border-gray-100 rounded-2xl dark:bg-gray-900 dark:border-white/10">
        <h3 className="mb-3 text-xs font-bold tracking-wider text-gray-400 uppercase">Seller</h3>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{order.sellerName}</p>
          <div className="flex gap-2">
            <Link to={`/dashboard/messages?provider=${order.sellerId}&type=order`}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-gray-200 dark:border-white/10 rounded-xl text-brand-charcoal-dark dark:text-white hover:border-brand-gold transition-colors">
              <MessageSquare size={12} /> Message
            </Link>
            <Link to={`/vendor/${order.sellerId}`}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-brand-gray-soft dark:bg-white/10 rounded-xl text-brand-charcoal-dark dark:text-white hover:bg-brand-gold/10 transition-colors">
              <Store size={12} /> Store
            </Link>
          </div>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex flex-wrap gap-3 mb-8">
        {/* Confirm delivery — shown when status is 'delivered' */}
        {order.status === 'delivered' && (
          <button type="button" onClick={handleConfirmDelivery}
            className="flex items-center gap-2 px-5 py-3 text-sm font-bold text-white transition-colors rounded-2xl bg-brand-gold hover:bg-brand-gold-dark">
            <CheckCircle2 size={14} /> Confirm Delivery
          </button>
        )}

        {/* Report issue — shown when status is 'delivered' */}
        {order.status === 'delivered' && (
          <button type="button" onClick={() => setIssueModal(true)}
            className="flex items-center gap-2 px-5 py-3 text-sm font-bold text-orange-600 transition-colors bg-orange-50 dark:bg-orange-500/10 rounded-2xl hover:bg-orange-100 dark:hover:bg-orange-500/20">
            <Flag size={14} /> Report Issue
          </button>
        )}

        {/* Cancel — shown for pre-ship statuses */}
        {['pending_payment', 'paid', 'accepted', 'processing'].includes(order.status) && (
          <button type="button" onClick={() => setCancelModal(true)}
            className="flex items-center gap-2 px-5 py-3 text-sm font-bold text-red-500 transition-colors bg-red-50 dark:bg-red-500/10 rounded-2xl hover:bg-red-100 dark:hover:bg-red-500/20">
            <XCircle size={14} /> Cancel Order
          </button>
        )}
      </div>

      {/* ── Cancel Modal ── */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 bg-white rounded-2xl dark:bg-gray-900">
            <h3 className="mb-2 text-lg font-bold text-brand-charcoal-dark dark:text-white">Cancel Order?</h3>
            <p className="mb-4 text-sm text-gray-400">This action cannot be undone. Escrowed funds will be refunded.</p>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation..."
              rows={3}
              className="w-full p-3 mb-4 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 outline-none resize-none"
            />
            <div className="flex gap-2">
              <button type="button" onClick={handleCancel}
                className="flex-1 py-3 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors">
                Yes, Cancel
              </button>
              <button type="button" onClick={() => setCancelModal(false)}
                className="flex-1 py-3 text-sm font-bold border border-gray-200 dark:border-white/10 rounded-xl text-brand-charcoal-dark dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                Keep Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Issue Modal ── */}
      {issueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 bg-white rounded-2xl dark:bg-gray-900">
            <h3 className="mb-2 text-lg font-bold text-brand-charcoal-dark dark:text-white">Report an Issue</h3>
            <p className="mb-4 text-sm text-gray-400">Describe what&apos;s wrong with your order. We&apos;ll review your request.</p>
            <textarea
              value={issueReason}
              onChange={e => setIssueReason(e.target.value)}
              placeholder="Describe the issue (e.g., wrong item received, damaged goods)..."
              rows={4}
              className="w-full p-3 mb-4 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 outline-none resize-none"
            />
            <div className="flex gap-2">
              <button type="button" onClick={handleReportIssue}
                className="flex-1 py-3 text-sm font-bold text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors">
                Submit Report
              </button>
              <button type="button" onClick={() => setIssueModal(false)}
                className="flex-1 py-3 text-sm font-bold border border-gray-200 dark:border-white/10 rounded-xl text-brand-charcoal-dark dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

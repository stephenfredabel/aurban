import { useRef, useCallback } from 'react';
import {
  Download, Printer, Copy, Check,
  ShieldCheck, CheckCircle2,
} from 'lucide-react';
import { format }        from 'date-fns';
import { useCurrency }   from '../../hooks/useCurrency.js';
import { useState }      from 'react';
import AurbanLogo        from '../AurbanLogo.jsx';

// ─────────────────────────────────────────────────────────────
// INVOICE COMPONENT
// ─────────────────────────────────────────────────────────────

/**
 * Invoice
 * Props:
 *   invoice: {
 *     ref:          string
 *     date:         timestamp
 *     status:       'paid' | 'pending' | 'refunded'
 *     type:         'rental' | 'service' | 'product' | 'shortlet'
 *     listing:      { title, address? }
 *     client:       { name, email? }
 *     provider:     { name, businessName?, tier? }
 *     lineItems:    [{ label, amount, note? }]
 *     subtotal:     number
 *     serviceFee:   number  (Aurban commission — always 0 to user)
 *     total:        number
 *     paymentMethod:string
 *     txRef:        string
 *   }
 *   onDownload?: () => void
 */

const STATUS_CONFIG = {
  paid:     { label:'PAID',     color:'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' },
  pending:  { label:'PENDING',  color:'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'        },
  refunded: { label:'REFUNDED', color:'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/50'              },
};

const MOCK_INVOICE = {
  ref:           'INV-2024-0089',
  date:          Date.now() - 2 * 86400_000,
  status:        'paid',
  type:          'rental',
  listing:       { title:'3-Bedroom Flat, Lekki Phase 1', address:'Admiralty Way, Lekki Phase 1, Lagos' },
  client:        { name:'Tunde Adeyemi', email:'tunde@example.com' },
  provider:      { name:'Chukwuemeka Eze', businessName:'ChinaEze Properties', tier:'verified' },
  lineItems: [
    { label:'Annual Rent — 3-Bedroom Flat',   amount: 1200000 },
    { label:'Legal / Agreement Processing',    amount: 20000   },
    { label:'Caution Deposit (refundable)',    amount: 100000  },
  ],
  subtotal:      1320000,
  serviceFee:    0,
  total:         1320000,
  paymentMethod: 'Paystack (Bank Transfer)',
  txRef:         'TXN-PSTKABCDEF',
};

export default function Invoice({ invoice: invoiceProp, onDownload }) {
  const { symbol }      = useCurrency();
  const invoice         = invoiceProp || MOCK_INVOICE;
  const invoiceRef      = useRef(null);
  const [copied, setCopied] = useState(false);
  const statusCfg       = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.pending;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(invoice.ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => window.print();

  return (
    <div className="overflow-hidden bg-white border border-gray-100 dark:bg-brand-charcoal-dark rounded-2xl dark:border-white/10">

      {/* ── Toolbar ───────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-white/10 bg-brand-gray-soft dark:bg-white/5">
        <p className="text-xs font-bold text-brand-charcoal-dark dark:text-white">Invoice</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleCopyRef}
            aria-label="Copy invoice reference"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-xs font-bold text-brand-charcoal dark:text-white hover:border-gray-300 transition-colors">
            {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
            {invoice.ref}
          </button>
          <button type="button" onClick={handlePrint}
            aria-label="Print invoice"
            className="flex items-center justify-center w-8 h-8 text-gray-400 transition-colors bg-white border border-gray-200 rounded-xl dark:bg-white/10 dark:border-white/10 hover:text-brand-charcoal dark:hover:text-white hover:border-gray-300">
            <Printer size={13} />
          </button>
          <button type="button" onClick={onDownload}
            aria-label="Download invoice"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-white text-xs font-bold transition-colors">
            <Download size={11} /> PDF
          </button>
        </div>
      </div>

      {/* ── Invoice body ──────────────────────────── */}
      <div ref={invoiceRef} className="p-6 print:p-8">

        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <AurbanLogo size="sm" showName />
            <p className="mt-2 text-xs text-gray-400">
              Aurban Technologies Ltd.<br />
              Lagos, Nigeria<br />
              support@aurban.ng
            </p>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider mb-3 ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
            <p className="text-xs text-gray-400">Invoice Date</p>
            <p className="mb-2 text-sm font-bold text-brand-charcoal-dark dark:text-white">
              {format(new Date(invoice.date), 'd MMMM yyyy')}
            </p>
            <p className="text-xs text-gray-400">Transaction Ref</p>
            <p className="font-mono text-xs font-semibold text-brand-charcoal-dark dark:text-white">{invoice.txRef}</p>
          </div>
        </div>

        {/* Bill from / to */}
        <div className="grid grid-cols-1 gap-5 mb-8 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">From (Provider)</p>
            <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{invoice.provider.businessName || invoice.provider.name}</p>
            <p className="text-xs text-gray-400">{invoice.provider.name}</p>
            {invoice.provider.tier && invoice.provider.tier !== 'starter' && (
              <div className="flex items-center gap-1 mt-1">
                <ShieldCheck size={11} className="text-emerald-500" />
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                  {invoice.provider.tier} Provider
                </span>
              </div>
            )}
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To (Client)</p>
            <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{invoice.client.name}</p>
            {invoice.client.email && <p className="text-xs text-gray-400">{invoice.client.email}</p>}
          </div>
        </div>

        {/* Property / Service */}
        <div className="p-4 mb-6 bg-brand-gray-soft dark:bg-white/5 rounded-2xl">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">For</p>
          <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{invoice.listing.title}</p>
          {invoice.listing.address && (
            <p className="text-xs text-gray-400 mt-0.5">{invoice.listing.address}</p>
          )}
          <p className="text-xs text-gray-400 mt-0.5 capitalize">{invoice.type} transaction</p>
        </div>

        {/* Line items */}
        <div className="mb-6">
          <div className="hidden grid-cols-12 gap-3 px-3 pb-2 border-b border-gray-100 sm:grid dark:border-white/10">
            <p className="col-span-8 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Description</p>
            <p className="col-span-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Amount</p>
          </div>
          <div className="space-y-0">
            {invoice.lineItems.map((item, i) => (
              <div key={i}
                className={`flex items-start justify-between gap-4 py-3.5 px-3 ${i < invoice.lineItems.length - 1 ? 'border-b border-gray-50 dark:border-white/5' : ''}`}>
                <div className="min-w-0">
                  <p className="text-sm text-brand-charcoal-dark dark:text-white">{item.label}</p>
                  {item.note && <p className="text-xs text-gray-400 mt-0.5">{item.note}</p>}
                </div>
                <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white shrink-0">
                  {symbol}{item.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="space-y-2.5 border-t border-gray-100 dark:border-white/10 pt-4">
          <div className="flex justify-between">
            <p className="text-sm text-gray-500 dark:text-white/60">Subtotal</p>
            <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">
              {symbol}{invoice.subtotal.toLocaleString()}
            </p>
          </div>
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-white/60">Aurban Service Fee</p>
              <p className="text-[11px] text-gray-400">8% absorbed by Aurban — not charged to you</p>
            </div>
            <p className="text-sm font-bold text-emerald-500">Free</p>
          </div>
          <div className="flex justify-between pt-3 border-t-2 border-gray-200 dark:border-white/20">
            <p className="text-base font-bold text-brand-charcoal-dark dark:text-white">Total Paid</p>
            <p className="text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
              {symbol}{invoice.total.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Payment method */}
        <div className="flex items-center justify-between pt-5 mt-6 border-t border-gray-100 dark:border-white/10">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Payment Method</p>
            <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">{invoice.paymentMethod}</p>
          </div>
          {invoice.status === 'paid' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl">
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Payment Confirmed</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-5 mt-8 text-center border-t border-gray-100 dark:border-white/10">
          <p className="text-xs leading-relaxed text-gray-400">
            This is an official Aurban transaction receipt. For disputes or questions, contact{' '}
            <a href="mailto:support@aurban.ng" className="font-semibold text-brand-gold">support@aurban.ng</a>
            {' '}within 48 hours of transaction.
          </p>
          <p className="text-[11px] text-gray-300 dark:text-white/20 mt-3">
            © {new Date().getFullYear()} Aurban Technologies Ltd. · Lagos, Nigeria
          </p>
        </div>
      </div>
    </div>
  );
}
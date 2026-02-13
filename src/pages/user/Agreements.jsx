import { useEffect } from 'react';
import { FileText, Download, Eye } from 'lucide-react';
const agreementTypes = [
  { icon: '🏠', label: 'Rental Agreements', desc: 'Signed tenancy agreements and receipts', count: 0, color: 'bg-blue-50' },
  { icon: '🏢', label: 'Purchase Agreements', desc: 'Proof of purchase and transfer docs', count: 0, color: 'bg-emerald-50' },
  { icon: '🛋️', label: 'Shortlet Contracts', desc: 'Shortlet booking confirmations', count: 0, color: 'bg-amber-50' },
  { icon: '🔧', label: 'Service Contracts', desc: 'Agreements with service providers', count: 0, color: 'bg-purple-50' },
];

export default function Agreements() {
  useEffect(() => { document.title = 'Agreements — Aurban'; }, []);

  return (
    <div>
        <h1 className="section-title mb-1">Legal Agreements</h1>
        <p className="text-sm text-gray-400 mb-5">Your stored contracts and documents</p>

        {/* Agreement type cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {agreementTypes.map((type) => (
            <div key={type.label} className={`${type.color} rounded-2xl p-4`}>
              <div className="text-2xl mb-2">{type.icon}</div>
              <p className="text-sm font-semibold text-brand-charcoal-dark">{type.label}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{type.desc}</p>
              <p className="text-xs font-bold text-brand-charcoal-dark mt-2">{type.count} document{type.count !== 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-card p-12 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-emerald-300" />
          </div>
          <h3 className="font-display font-semibold text-brand-charcoal-dark">No documents yet</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
            When you complete a transaction on Aurban, your legal documents will be stored securely here
          </p>
          <div className="flex items-center justify-center gap-4 mt-5">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Eye size={13} /> View anytime
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Download size={13} /> Download PDF
            </div>
          </div>
        </div>
      </div>
  );
}
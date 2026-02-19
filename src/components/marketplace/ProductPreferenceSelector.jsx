import { useMemo } from 'react';
import { Check, Info } from 'lucide-react';
import {
  getPreferenceGroupForSubcategory,
  getProductsForGroup,
} from '../../data/productPreferences.js';

/* ════════════════════════════════════════════════════════════
   PRODUCT PREFERENCE SELECTOR — Structured attribute picker

   Replaces free-form CategoryFieldsStep when a subcategory has
   a matching preference template in productPreferences.js.

   Provider ONLY selects from platform-defined dropdowns.
   No free text, no custom attributes.

   Props:
     subcategory  - string (e.g. "Iron & Steel (Rods, Sheets)")
     values       - { product: string, attributes: {} } or null
     onChange      - (newValues) => void
════════════════════════════════════════════════════════════ */

export default function ProductPreferenceSelector({ subcategory, values, onChange }) {
  const match = useMemo(() => getPreferenceGroupForSubcategory(subcategory), [subcategory]);
  const groupKey = match?.groupKey;
  const group = match?.group;
  const products = useMemo(() => groupKey ? getProductsForGroup(groupKey) : [], [groupKey]);

  if (!match) return null;
  const selectedProductKey = values?.product || '';
  const selectedProduct = products.find(p => p.key === selectedProductKey);
  const attributes = values?.attributes || {};

  const handleProductChange = (productKey) => {
    onChange({ product: productKey, attributes: {} });
  };

  const handleAttributeChange = (attrKey, value) => {
    onChange({
      ...values,
      product: values?.product || '',
      attributes: { ...(values?.attributes || {}), [attrKey]: value },
    });
  };

  const filledCount = selectedProduct
    ? Object.entries(selectedProduct.preferences).filter(([k]) => attributes[k]).length
    : 0;
  const totalAttrs = selectedProduct
    ? Object.keys(selectedProduct.preferences).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-brand-gold/5 border border-brand-gold/20">
        <span className="text-2xl leading-none">{group.emoji}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-brand-charcoal-dark dark:text-white">
            {group.label} — Structured Preferences
          </h3>
          <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <Info size={11} className="shrink-0" />
            Select from platform-defined attributes only. Providers cannot add custom values.
          </p>
        </div>
      </div>

      {/* Product type selector */}
      <div>
        <label className="block mb-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Product Type <span className="text-red-400">*</span>
        </label>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(p => (
            <button
              key={p.key}
              type="button"
              onClick={() => handleProductChange(p.key)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-semibold text-left transition-all
                ${selectedProductKey === p.key
                  ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white shadow-sm'
                  : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-brand-gold/40'
                }`}
            >
              {selectedProductKey === p.key && (
                <Check size={15} className="text-brand-gold shrink-0" />
              )}
              <span className="truncate">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Attribute dropdowns (only shown after product selection) */}
      {selectedProduct && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Specifications
            </label>
            <span className="text-[10px] text-gray-400">
              {filledCount}/{totalAttrs} selected
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(selectedProduct.preferences).map(([attrKey, attrDef]) => (
              <div key={attrKey}>
                <label className="block mb-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {attrDef.label} <span className="text-red-400">*</span>
                </label>
                <select
                  value={attributes[attrKey] ?? ''}
                  onChange={e => handleAttributeChange(attrKey, e.target.value)}
                  className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-white/10 rounded-xl
                    bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white
                    focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none
                    appearance-none cursor-pointer"
                >
                  <option value="">Select {attrDef.label.toLowerCase()}</option>
                  {attrDef.options.map(opt => (
                    <option key={String(opt)} value={String(opt)}>{String(opt)}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected attributes summary */}
      {selectedProduct && filledCount > 0 && (
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5">
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
            Selected Specification
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(attributes)
              .filter(([, v]) => v)
              .map(([key, val]) => {
                const def = selectedProduct.preferences[key];
                return (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-brand-gold/10 text-brand-gold dark:text-brand-gold"
                  >
                    <span className="text-gray-400 dark:text-gray-500">{def?.label}:</span> {val}
                  </span>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

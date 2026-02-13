import { useState, useRef, useCallback } from 'react';
import {
  Send, Paperclip, X, AlertTriangle,
  ChevronDown, MessageSquare,
} from 'lucide-react';
import { useMessaging }   from '../../context/MessagingContext.jsx';
import { containsContact, CONTACT_WARNING } from '../../utils/contactMask.js';

// ── Inquiry templates ─────────────────────────────────────────
const TEMPLATES = [
  { label: 'Is this still available?',               text: 'Hi, is this still available?' },
  { label: 'Can we schedule a viewing?',             text: 'Hi, I would like to schedule a viewing. When are you available?' },
  { label: 'What is the best price?',                text: 'Hi, what is the best price you can offer for this?' },
  { label: 'Can you provide more details?',          text: 'Hi, can you provide more details about this listing?' },
  { label: 'Is negotiation possible?',               text: 'Hi, is the price negotiable?' },
  { label: 'What documents are required?',           text: 'Hi, what documents will be required to proceed?' },
];

export default function MessageInput({ convId, isPaid }) {
  const { sendMessage, setTyping } = useMessaging();
  const [text,        setText]        = useState('');
  const [showWarn,    setShowWarn]    = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [file,        setFile]        = useState(null);
  const fileRef = useRef(null);
  const textRef = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    setTyping(convId, val.length > 0);

    // Warn on contact patterns (before sending)
    if (!isPaid && containsContact(val)) {
      setShowWarn(true);
    } else {
      setShowWarn(false);
    }
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // 5MB limit
    if (f.size > 5 * 1024 * 1024) {
      alert('File must be under 5MB.');
      return;
    }
    setFile({ name: f.name, size: f.size, type: f.type, raw: f });
  };

  const handleSend = useCallback(() => {
    if (!text.trim() && !file) return;
    sendMessage(convId, { text: text.trim(), file });
    setText('');
    setFile(null);
    setShowWarn(false);
    setTyping(convId, false);
    textRef.current?.focus();
  }, [convId, text, file, sendMessage, setTyping]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const applyTemplate = (t) => {
    setText(t.text);
    setShowTemplates(false);
    textRef.current?.focus();
  };

  return (
    <div className="px-3 pt-2 pb-3 bg-white border-t border-gray-100 shrink-0 dark:bg-brand-charcoal-dark dark:border-white/10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>

      {/* ── Contact warning banner ──────────────────── */}
      {showWarn && (
        <div className="flex items-start gap-2 p-2.5 mb-2 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20">
          <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="flex-1 text-xs leading-relaxed text-amber-700 dark:text-amber-300">{CONTACT_WARNING}</p>
          <button type="button" onClick={() => setShowWarn(false)} className="text-amber-400 hover:text-amber-600 shrink-0 mt-0.5">
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── File preview ────────────────────────────── */}
      {file && (
        <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-brand-gray-soft dark:bg-white/10 rounded-xl">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-gold/20 shrink-0">
            <span className="text-xs">📎</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate text-brand-charcoal-dark dark:text-white">{file.name}</p>
            <p className="text-[10px] text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button type="button" onClick={() => setFile(null)} aria-label="Remove file"
            className="flex items-center justify-center w-6 h-6 text-gray-500 transition-colors bg-gray-200 rounded-full dark:bg-white/20 hover:bg-red-100 hover:text-red-500">
            <X size={11} />
          </button>
        </div>
      )}

      {/* ── Template picker ─────────────────────────── */}
      {showTemplates && (
        <div className="mb-2 overflow-hidden bg-white border border-gray-100 shadow-xl dark:bg-brand-charcoal-dark rounded-2xl dark:border-white/10">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-white/10">
            <p className="text-xs font-bold text-brand-charcoal-dark dark:text-white">Quick replies</p>
            <button type="button" onClick={() => setShowTemplates(false)} className="text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          </div>
          {TEMPLATES.map(t => (
            <button key={t.label} type="button" onClick={() => applyTemplate(t)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-brand-gray-soft dark:hover:bg-white/5 transition-colors border-b border-gray-50 dark:border-white/5 last:border-0">
              <MessageSquare size={13} className="text-brand-gold shrink-0" />
              <span className="text-brand-charcoal dark:text-white/80">{t.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Input row ────────────────────────────────── */}
      <div className="flex items-end gap-2">
        {/* Templates toggle */}
        <button
          type="button"
          onClick={() => setShowTemplates(v => !v)}
          aria-label="Quick reply templates"
          aria-expanded={showTemplates}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0
            ${showTemplates
              ? 'bg-brand-gold text-white'
              : 'bg-brand-gray-soft dark:bg-white/10 text-brand-charcoal dark:text-white hover:text-brand-gold'
            }`}
        >
          <ChevronDown size={16} className={`transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
        </button>

        {/* Text area */}
        <div className="relative flex-1 bg-brand-gray-soft dark:bg-white/10 rounded-2xl">
          <textarea
            ref={textRef}
            rows={1}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            maxLength={2000}
            aria-label="Message input"
            className="w-full px-4 py-2.5 pr-10 bg-transparent text-sm font-body text-brand-charcoal-dark dark:text-white placeholder:text-gray-400 outline-none resize-none max-h-32 overflow-y-auto leading-relaxed"
            style={{ field_sizing: 'content' }}
          />
          {/* Attachment */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Attach file"
            className="absolute right-3 bottom-2.5 text-gray-400 hover:text-brand-gold transition-colors"
          >
            <Paperclip size={16} />
          </button>
          <input ref={fileRef} type="file" className="hidden"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFile}
          />
        </div>

        {/* Send */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() && !file}
          aria-label="Send message"
          className="flex items-center justify-center text-white transition-colors w-9 h-9 rounded-xl bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Send size={16} />
        </button>
      </div>

      {/* Character count */}
      {text.length > 1800 && (
        <p className="text-[10px] text-right text-amber-500 mt-1">{text.length}/2000</p>
      )}
    </div>
  );
}
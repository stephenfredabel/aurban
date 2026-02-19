// ─────────────────────────────────────────────────────────────
// Aurban — Contact masking utility
// Prevents phone numbers, emails, WhatsApp links from being
// shared in chat before payment is confirmed.
// ─────────────────────────────────────────────────────────────

// ── Pattern library ──────────────────────────────────────────
const PATTERNS = [
  // Nigerian mobile (080, 081, 070, 090, 091, 07x, 08x, 09x)
  /(\+?234|0)[-.\s]?[7-9][01]\d[-.\s]?\d{3}[-.\s]?\d{4}/g,
  // Generic international phone  +1 (555) 000-0000 / +44 7700 123456
  /(\+\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g,
  // WhatsApp links
  /wa\.me\/\+?\d{7,15}/gi,
  // WhatsApp or phone text cues  "wa: 0801...", "call 0812...", "whatsapp me 0803..."
  /\b(wa|whatsapp|watsapp|call me|phone|mobile|tel|contact me on|reach me on|chat on)\s*:?\s*(\+?[\d\s().-]{7,15})/gi,
  // Email addresses
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // Instagram / Telegram handles often used to evade masking
  /@[a-zA-Z0-9_.]{3,30}/g,
];

const REPLACEMENT = '[ Contact hidden — complete booking to exchange details ]';

/**
 * maskContacts(text: string): string
 * Returns the text with all detected contact info replaced.
 */
export function maskContacts(text) {
  if (!text || typeof text !== 'string') return text;
  let result = text;
  for (const pattern of PATTERNS) {
    result = result.replace(pattern, REPLACEMENT);
  }
  return result;
}

/**
 * containsContact(text: string): boolean
 * Returns true if the text contains a contact pattern.
 * Used to show a warning in the input before sending.
 */
export function containsContact(text) {
  if (!text || typeof text !== 'string') return false;
  return PATTERNS.some(p => {
    p.lastIndex = 0; // reset stateful regex
    return p.test(text);
  });
}

/**
 * WARNING_MESSAGE — shown to sender before message is blocked/masked
 */
export const CONTACT_WARNING =
  'Contact details are protected until a booking is confirmed. ' +
  'Use Aurban messaging and calls to communicate safely.';
// ─────────────────────────────────────────────────────────────
// Aurban — PII Data Masking by Admin Role
//
// Masks sensitive user data based on the viewer's admin role.
// super_admin and compliance_admin see everything; others see
// masked PII. Non-admin viewers see fully masked data.
// ─────────────────────────────────────────────────────────────

import { normalizeRole } from './rbac.js';

// Roles that can see unmasked PII
const PII_FULL_ACCESS_ROLES = ['super_admin', 'compliance_admin'];
// Roles that can see partially unmasked PII (first/last chars)
const PII_PARTIAL_ACCESS_ROLES = ['support_admin', 'operations_admin'];

/**
 * Mask a phone number: 080****5678
 */
export function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return '***';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return '***';
  return digits.slice(0, 3) + '****' + digits.slice(-4);
}

/**
 * Mask an email: u***r@mail.com
 */
export function maskEmail(email) {
  if (!email || typeof email !== 'string') return '***@***.***';
  const [local, domain] = email.split('@');
  if (!domain) return '***@***.***';
  if (local.length <= 2) return local[0] + '***@' + domain;
  return local[0] + '***' + local[local.length - 1] + '@' + domain;
}

/**
 * Mask a name: Ch***a E.
 */
export function maskName(name) {
  if (!name || typeof name !== 'string') return '***';
  const parts = name.trim().split(/\s+/);
  return parts.map(p => {
    if (p.length <= 2) return p[0] + '.';
    return p[0] + p[1] + '***' + p[p.length - 1];
  }).join(' ');
}

/**
 * Mask a bank account / NUBAN: ******3456
 */
export function maskAccount(account) {
  if (!account || typeof account !== 'string') return '******';
  if (account.length <= 4) return '***' + account;
  return '******' + account.slice(-4);
}

/**
 * Determine masking level for a given viewer role.
 * Returns 'full' (no masking), 'partial', or 'masked'.
 */
export function getMaskLevel(viewerRole) {
  const role = normalizeRole(viewerRole);
  if (PII_FULL_ACCESS_ROLES.includes(role)) return 'full';
  if (PII_PARTIAL_ACCESS_ROLES.includes(role)) return 'partial';
  return 'masked';
}

/**
 * Apply role-aware masking to a user data object.
 * Returns a new object with sensitive fields masked based on viewer's role.
 *
 * @param {Object} userData    - The user record to mask
 * @param {string} viewerRole  - The admin role of the person viewing
 * @returns {Object}           - Masked copy of userData
 */
export function maskUserData(userData, viewerRole) {
  if (!userData || typeof userData !== 'object') return userData;

  const level = getMaskLevel(viewerRole);

  // Full access — no masking
  if (level === 'full') return { ...userData };

  const masked = { ...userData };

  // Phone
  if (masked.phone) {
    masked.phone = level === 'partial' ? maskPhone(masked.phone) : '***hidden***';
  }
  if (masked.userPhone) {
    masked.userPhone = level === 'partial' ? maskPhone(masked.userPhone) : '***hidden***';
  }

  // Email
  if (masked.email) {
    masked.email = level === 'partial' ? maskEmail(masked.email) : '***@***.***';
  }

  // Name — only fully masked for non-partial viewers
  if (level === 'masked') {
    if (masked.name) masked.name = maskName(masked.name);
    if (masked.userName) masked.userName = maskName(masked.userName);
    if (masked.providerName) masked.providerName = maskName(masked.providerName);
  }

  // Bank details — always masked for non-full access
  if (masked.bankAccount) masked.bankAccount = maskAccount(masked.bankAccount);
  if (masked.accountNumber) masked.accountNumber = maskAccount(masked.accountNumber);

  // BVN / NIN — always masked for non-full access
  if (masked.bvn) masked.bvn = '***hidden***';
  if (masked.nin) masked.nin = '***hidden***';

  return masked;
}

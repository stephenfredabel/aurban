import { useState, useCallback, useMemo } from 'react';
import { PRO_ESCROW_STATUSES, PRO_TIER4_STATUSES, TIER_CONFIG } from '../data/proConstants.js';

/**
 * useProEscrow — Tracks escrow state for a Pro booking.
 * Provides computed totals, milestone breakdowns, and
 * action helpers (release, freeze, refund).
 *
 * @param {object} booking — booking object with price, tier, status, milestones[]
 * @returns {object} escrow state + actions
 */
export default function useProEscrow(booking) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const tierCfg = TIER_CONFIG[booking?.tier] || TIER_CONFIG[1];
  const price = booking?.price || 0;

  const escrow = useMemo(() => {
    const commitmentFee = Math.round(price * tierCfg.commitmentFeePercent / 100);
    const balance = price - commitmentFee;
    const isTier4 = booking?.tier === 4;

    // Tier 4 milestone breakdown
    const milestones = isTier4
      ? Object.entries(PRO_TIER4_STATUSES)
          .filter(([key]) => key !== 'completed')
          .map(([key, cfg]) => {
            const amount = Math.round(price * cfg.percent / 100);
            const bkgMilestone = (booking?.milestones || []).find(m => m.phase === key);
            return {
              id: key,
              label: cfg.label,
              phase: cfg.phase,
              percent: cfg.percent,
              amount,
              status: bkgMilestone?.status || 'pending',
              releasedAt: bkgMilestone?.releasedAt || null,
            };
          })
      : [];

    const totalReleased = milestones
      .filter(m => m.status === 'released')
      .reduce((sum, m) => sum + m.amount, 0);

    const totalPending = milestones
      .filter(m => m.status === 'pending')
      .reduce((sum, m) => sum + m.amount, 0);

    const currentMilestone = milestones.find(m => m.status === 'pending') || null;
    const nextMilestone = milestones.find(m => m.status === 'pending' && m !== currentMilestone) || null;
    const allReleased = milestones.length > 0 && milestones.every(m => m.status === 'released');

    const escrowStatus = booking?.escrowStatus || 'held';
    const statusCfg = PRO_ESCROW_STATUSES[escrowStatus] || PRO_ESCROW_STATUSES.held;

    return {
      total: price,
      commitmentFee,
      balance,
      isTier4,
      milestones,
      totalReleased,
      totalPending,
      currentMilestone,
      nextMilestone,
      allReleased,
      status: escrowStatus,
      statusLabel: statusCfg.label,
      statusColor: statusCfg.color,
      observationDays: tierCfg.observationDays,
      tierLabel: tierCfg.shortLabel,
    };
  }, [booking, price, tierCfg]);

  // Simulate milestone release (in production → API call)
  const releaseMilestone = useCallback(async (milestoneId) => {
    setProcessing(true);
    setError(null);
    try {
      // In production: await api.post(`/pro/escrow/${booking.id}/milestone/${milestoneId}/release`)
      await new Promise(r => setTimeout(r, 800));
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setProcessing(false);
    }
  }, []);

  // Simulate full release
  const releaseBalance = useCallback(async () => {
    setProcessing(true);
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 800));
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setProcessing(false);
    }
  }, []);

  return {
    ...escrow,
    processing,
    error,
    releaseMilestone,
    releaseBalance,
  };
}

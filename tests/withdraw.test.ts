import { describe, it, expect } from 'vitest';
import { computeWithdrawable } from '../lib/withdraw';

const d = (daysAgo: number, amount: number) => ({ amount, created_at: new Date(Date.now() - daysAgo*24*3600*1000).toISOString() });

describe('computeWithdrawable', () => {
  it('returns 0 with no deposits', () => {
    expect(computeWithdrawable([], [])).toBe(0);
  });
  it('locks deposits newer than 21 days', () => {
    expect(computeWithdrawable([d(20, 100)], [])).toBe(0);
  });
  it('unlocks deposits at 21+ days', () => {
    expect(computeWithdrawable([d(21, 100)], [])).toBe(100);
    expect(computeWithdrawable([d(30, 100)], [])).toBe(100);
  });
  it('subtracts prior withdrawals', () => {
    expect(computeWithdrawable([d(40, 200)], [{ amount: 50 }])).toBe(150);
  });
  it('never goes negative', () => {
    expect(computeWithdrawable([d(40, 100)], [{ amount: 200 }])).toBe(0);
  });
  it('handles multiple deposits mixed ages', () => {
    const deposits = [d(25, 100), d(5, 300), d(60, 200)];
    expect(computeWithdrawable(deposits, [])).toBe(300);
  });
});

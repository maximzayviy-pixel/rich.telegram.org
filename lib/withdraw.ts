export type Deposit = { amount: number; created_at: string | Date };
export type Withdrawal = { amount: number };

export function computeWithdrawable(
  deposits: Deposit[] = [],
  withdrawals: Withdrawal[] = [],
  now: Date = new Date()
): number {
  const cutoff = new Date(now.getTime() - 21 * 24 * 3600 * 1000);
  const unlocked = deposits
    .filter(d => new Date(d.created_at) <= cutoff)
    .reduce((s, d) => s + Number(d.amount || 0), 0);
  const withdrawn = withdrawals.reduce((s, w) => s + Number(w.amount || 0), 0);
  return Math.max(0, unlocked - withdrawn);
}

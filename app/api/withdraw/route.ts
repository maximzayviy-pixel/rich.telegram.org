import { NextResponse } from 'next/server';
import { computeWithdrawable } from '../../../lib/withdraw';
export const runtime = 'edge';

export async function POST(req: Request) {
  const { tg_id, amount } = await req.json() as { tg_id: number; amount: number };
  if (!tg_id || !amount || amount <= 0) return NextResponse.json({ ok: false, reason: 'Bad payload' }, { status: 400 });
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
  if (!serviceKey) return NextResponse.json({ ok: false, reason: 'Missing service role' }, { status: 500 });
  const { createClient } = await import('@supabase/supabase-js');
  const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

  const { data: deposits, error: dErr } = await supa.from('deposits').select('amount, created_at').eq('tg_id', tg_id);
  if (dErr) return NextResponse.json({ ok: false, error: dErr }, { status: 400 });
  const { data: withdrawals, error: wErr } = await supa.from('withdrawals').select('amount').eq('tg_id', tg_id);
  if (wErr) return NextResponse.json({ ok: false, error: wErr }, { status: 400 });

  const withdrawable = computeWithdrawable(deposits as any, withdrawals as any);
  if (amount > withdrawable) return NextResponse.json({ ok: false, reason: 'Amount exceeds withdrawable' }, { status: 400 });

  const { error } = await supa.from('withdrawals').insert({ tg_id, amount });
  if (error) return NextResponse.json({ ok: false, error }, { status: 400 });
  return NextResponse.json({ ok: true, withdrawable: withdrawable - amount });
}

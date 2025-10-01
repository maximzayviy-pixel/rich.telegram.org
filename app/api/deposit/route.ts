import { NextResponse } from 'next/server';
export const runtime = 'edge';

export async function POST(req: Request) {
  const { tg_id, amount } = await req.json() as { tg_id: number; amount: number };
  if (!tg_id || !amount || amount <= 0) return NextResponse.json({ ok: false, reason: 'Bad payload' }, { status: 400 });
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
  if (!serviceKey) return NextResponse.json({ ok: false, reason: 'Missing service role' }, { status: 500 });
  const { createClient } = await import('@supabase/supabase-js');
  const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  const { error } = await supa.from('deposits').insert({ tg_id, amount });
  if (error) return NextResponse.json({ ok: false, error }, { status: 400 });
  return NextResponse.json({ ok: true });
}

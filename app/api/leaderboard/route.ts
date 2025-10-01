import { NextResponse } from 'next/server';
export const runtime = 'edge';

export async function GET() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
  const { createClient } = await import('@supabase/supabase-js');
  const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data, error } = await supa
    .from('v_user_balances')
    .select('tg_id, current_balance, total_deposited, withdrawable')
    .order('current_balance', { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ ok: false, error }, { status: 400 });

  const ids = (data || []).map(d => d.tg_id);
  const { data: profiles } = await supa
    .from('users')
    .select('tg_id, username, first_name, last_name, photo_url')
    .in('tg_id', ids);
  const merged = (data || []).map(row => ({
    ...row,
    user: profiles?.find(p => p.tg_id === row.tg_id) || null
  }));

  return NextResponse.json({ ok: true, data: merged });
}

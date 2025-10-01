import { NextResponse } from 'next/server';
export const runtime = 'edge';

export async function POST(req: Request) {
  const { tg_id, username, first_name, last_name, photo_url } = await req.json();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
  if (!serviceKey) return NextResponse.json({ ok: false, reason: 'Missing service role' }, { status: 500 });
  const { createClient } = await import('@supabase/supabase-js');
  const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  const { error } = await supa.from('users').upsert({ tg_id, username, first_name, last_name, photo_url });
  if (error) return NextResponse.json({ ok: false, error }, { status: 400 });
  return NextResponse.json({ ok: true });
}

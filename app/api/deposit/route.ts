import { NextResponse } from 'next/server';
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { tg_id, amount } = await req.json() as { tg_id: number; amount: number };
    
    if (!tg_id || !amount || amount <= 0) {
      return NextResponse.json({ ok: false, reason: 'Invalid payload' }, { status: 400 });
    }
    
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
    if (!serviceKey) {
      return NextResponse.json({ ok: false, reason: 'Missing service role' }, { status: 500 });
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
    
    // Сначала проверим, существует ли пользователь
    const { data: user, error: userError } = await supa
      .from('users')
      .select('tg_id')
      .eq('tg_id', tg_id)
      .single();
    
    if (userError && userError.code !== 'PGRST116') {
      console.error('User check error:', userError);
      return NextResponse.json({ ok: false, reason: 'User check failed', error: userError.message }, { status: 400 });
    }
    
    if (!user) {
      return NextResponse.json({ ok: false, reason: 'User not found. Please refresh the app.' }, { status: 400 });
    }
    
    // Создаем депозит
    const { error: depositError } = await supa
      .from('deposits')
      .insert({ tg_id, amount });
    
    if (depositError) {
      console.error('Deposit error:', depositError);
      return NextResponse.json({ ok: false, reason: 'Deposit failed', error: depositError.message }, { status: 400 });
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Deposit API error:', error);
    return NextResponse.json({ ok: false, reason: 'Internal server error' }, { status: 500 });
  }
}

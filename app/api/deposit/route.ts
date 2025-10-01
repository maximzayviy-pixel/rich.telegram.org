import { NextResponse } from 'next/server';
import { validateDepositRequest, checkRateLimit } from '../../../lib/validation';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`deposit:${clientIP}`, 10, 60000)) {
      return NextResponse.json({ ok: false, reason: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    
    // Валидация входных данных
    const validation = validateDepositRequest(body);
    if (!validation.isValid) {
      return NextResponse.json({ 
        ok: false, 
        reason: 'Invalid payload', 
        errors: validation.errors 
      }, { status: 400 });
    }
    
    const { tg_id, amount } = body;
    
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
    if (!serviceKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE environment variable');
      return NextResponse.json({ ok: false, reason: 'Service unavailable' }, { status: 500 });
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
      return NextResponse.json({ ok: false, reason: 'User check failed' }, { status: 400 });
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
      return NextResponse.json({ ok: false, reason: 'Deposit failed' }, { status: 400 });
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Deposit API error:', error);
    return NextResponse.json({ ok: false, reason: 'Internal server error' }, { status: 500 });
  }
}

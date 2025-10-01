import { NextResponse } from 'next/server';
import { computeWithdrawable } from '../../../lib/withdraw';
import { validateWithdrawRequest, checkRateLimit } from '../../../lib/validation';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`withdraw:${clientIP}`, 5, 60000)) {
      return NextResponse.json({ ok: false, reason: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    
    // Валидация входных данных
    const validation = validateWithdrawRequest(body);
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

    // Проверяем, существует ли пользователь
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

    const { data: deposits, error: dErr } = await supa
      .from('deposits')
      .select('amount, created_at')
      .eq('tg_id', tg_id);
    
    if (dErr) {
      console.error('Deposits query error:', dErr);
      return NextResponse.json({ ok: false, reason: 'Failed to fetch deposits' }, { status: 400 });
    }
    
    const { data: withdrawals, error: wErr } = await supa
      .from('withdrawals')
      .select('amount')
      .eq('tg_id', tg_id);
    
    if (wErr) {
      console.error('Withdrawals query error:', wErr);
      return NextResponse.json({ ok: false, reason: 'Failed to fetch withdrawals' }, { status: 400 });
    }

    const withdrawable = computeWithdrawable(deposits as any, withdrawals as any);
    if (amount > withdrawable) {
      return NextResponse.json({ 
        ok: false, 
        reason: 'Amount exceeds withdrawable',
        withdrawable 
      }, { status: 400 });
    }

    const { error } = await supa
      .from('withdrawals')
      .insert({ tg_id, amount });
    
    if (error) {
      console.error('Withdrawal insert error:', error);
      return NextResponse.json({ ok: false, reason: 'Withdrawal failed' }, { status: 400 });
    }
    
    return NextResponse.json({ 
      ok: true, 
      withdrawable: withdrawable - amount 
    });
  } catch (error) {
    console.error('Withdraw API error:', error);
    return NextResponse.json({ ok: false, reason: 'Internal server error' }, { status: 500 });
  }
}

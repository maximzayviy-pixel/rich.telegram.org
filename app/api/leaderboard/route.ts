import { NextResponse } from 'next/server';
import { checkRateLimit } from '../../../lib/validation';

export const runtime = 'edge';

export async function GET(req: Request) {
  try {
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`leaderboard:${clientIP}`, 30, 60000)) {
      return NextResponse.json({ ok: false, reason: 'Too many requests' }, { status: 429 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
    if (!serviceKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE environment variable');
      return NextResponse.json({ ok: false, reason: 'Service unavailable' }, { status: 500 });
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
    
    const { data, error } = await supa
      .from('v_user_balances')
      .select('tg_id, current_balance, total_deposited, withdrawable')
      .order('current_balance', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Leaderboard query error:', error);
      return NextResponse.json({ ok: false, reason: 'Failed to fetch leaderboard' }, { status: 400 });
    }

    const ids = (data || []).map(d => d.tg_id);
    const { data: profiles, error: profilesError } = await supa
      .from('users')
      .select('tg_id, username, first_name, last_name, photo_url')
      .in('tg_id', ids);
    
    if (profilesError) {
      console.error('Profiles query error:', profilesError);
      return NextResponse.json({ ok: false, reason: 'Failed to fetch user profiles' }, { status: 400 });
    }
    
    const merged = (data || []).map(row => ({
      ...row,
      user: profiles?.find(p => p.tg_id === row.tg_id) || null
    }));

    return NextResponse.json({ ok: true, data: merged });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({ ok: false, reason: 'Internal server error' }, { status: 500 });
  }
}

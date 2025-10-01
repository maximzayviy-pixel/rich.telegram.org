import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { tg_id, username, first_name, last_name, photo_url } = await req.json();
    
    if (!tg_id || typeof tg_id !== 'number') {
      return NextResponse.json({ ok: false, reason: 'Invalid tg_id' }, { status: 400 });
    }
    
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
    if (!serviceKey) {
      return NextResponse.json({ ok: false, reason: 'Missing service role' }, { status: 500 });
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
    
    const { error } = await supa
      .from('users')
      .upsert({ 
        tg_id, 
        username: username || null, 
        first_name: first_name || null, 
        last_name: last_name || null, 
        photo_url: photo_url || null 
      });
    
    if (error) {
      console.error('User upsert error:', error);
      return NextResponse.json({ ok: false, reason: 'Failed to save user data' }, { status: 400 });
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('User upsert API error:', error);
    return NextResponse.json({ ok: false, reason: 'Internal server error' }, { status: 500 });
  }
}

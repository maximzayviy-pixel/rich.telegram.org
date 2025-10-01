import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { initData } = await req.json();
    
    if (!initData) {
      return NextResponse.json({ ok: false, reason: 'No initData provided' }, { status: 400 });
    }
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ ok: false, reason: 'Missing bot token' }, { status: 500 });
    }

    const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    if (!hash) {
      return NextResponse.json({ ok: false, reason: 'No hash in initData' }, { status: 400 });
    }
    
    urlParams.delete('hash');
    const data = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
    
    const computed = createHmac('sha256', secret).update(data).digest('hex');
    
    if (computed !== hash) {
      return NextResponse.json({ ok: false, reason: 'Invalid hash' }, { status: 401 });
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ ok: false, reason: 'Verification failed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { initData } = await req.json();
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return NextResponse.json({ ok: false, reason: 'Missing bot token' }, { status: 500 });

  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');
  const data = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const computed = createHmac('sha256', secret).update(data).digest('hex');
  if (computed !== hash) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true });
}

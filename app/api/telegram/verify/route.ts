import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { initData } = await req.json();
    
    if (!initData || typeof initData !== 'string') {
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
    
    // Проверяем timestamp - данные не должны быть старше 24 часов
    const authDate = urlParams.get('auth_date');
    if (authDate) {
      const authTimestamp = parseInt(authDate);
      const now = Math.floor(Date.now() / 1000);
      const maxAge = 24 * 60 * 60; // 24 часа
      
      if (isNaN(authTimestamp) || now - authTimestamp > maxAge) {
        return NextResponse.json({ ok: false, reason: 'InitData expired' }, { status: 401 });
      }
    }
    
    // Проверяем наличие обязательных полей
    const user = urlParams.get('user');
    if (!user) {
      return NextResponse.json({ ok: false, reason: 'No user data in initData' }, { status: 400 });
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
    
    // Парсим и возвращаем данные пользователя для дополнительной проверки
    let userData;
    try {
      userData = JSON.parse(user);
    } catch {
      return NextResponse.json({ ok: false, reason: 'Invalid user data format' }, { status: 400 });
    }
    
    // Проверяем обязательные поля пользователя
    if (!userData.id || typeof userData.id !== 'number') {
      return NextResponse.json({ ok: false, reason: 'Invalid user ID' }, { status: 400 });
    }
    
    return NextResponse.json({ 
      ok: true, 
      user: {
        id: userData.id,
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        photo_url: userData.photo_url,
        language_code: userData.language_code
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ ok: false, reason: 'Verification failed' }, { status: 500 });
  }
}

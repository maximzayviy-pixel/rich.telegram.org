export type TelegramUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  language_code?: string;
};

export function getTelegramUserUnsafe(): TelegramUser | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  
  // Простая проверка наличия Telegram WebApp
  const webApp = w?.Telegram?.WebApp;
  if (!webApp) return null;
  
  // Пытаемся получить пользователя из initDataUnsafe
  const user = webApp.initDataUnsafe?.user;
  if (!user) return null;
  
  return {
    id: user.id,
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    photo_url: user.photo_url,
    language_code: user.language_code,
  };
}

export function getTelegramWebApp() {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w?.Telegram?.WebApp;
}

export function isTelegramWebApp(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  
  // Проверяем User-Agent для дополнительной уверенности
  const userAgent = navigator.userAgent.toLowerCase();
  const isTelegramUserAgent = userAgent.includes('telegram') || userAgent.includes('webapp');
  
  // Простая проверка - есть ли объект Telegram WebApp
  if (!w?.Telegram?.WebApp) {
    // Если нет WebApp объекта, но User-Agent указывает на Telegram, все равно считаем что мы в Telegram
    return isTelegramUserAgent;
  }
  
  const webApp = w.Telegram.WebApp;
  
  // Если есть WebApp объект, проверяем его свойства
  if (webApp.initDataUnsafe?.user) {
    return true;
  }
  
  // Если нет данных пользователя, но есть WebApp и правильный User-Agent
  if (isTelegramUserAgent) {
    return true;
  }
  
  return false;
}

export async function verifyInitData(initData: string) {
  if (!initData) return { ok: false };
  const res = await fetch('/api/telegram/verify', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData })
  });
  if (!res.ok) return { ok: false };
  return res.json();
}

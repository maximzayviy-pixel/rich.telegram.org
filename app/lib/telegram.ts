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
  
  // Проверяем наличие Telegram WebApp объекта
  if (!w?.Telegram?.WebApp) return false;
  
  // Проверяем, что мы в Telegram WebApp (не в обычном браузере)
  const webApp = w.Telegram.WebApp;
  
  // Проверяем наличие обязательных свойств
  if (!webApp.initData && !webApp.initDataUnsafe) return false;
  
  // Проверяем platform - должен быть telegram
  if (webApp.platform && webApp.platform !== 'telegram') return false;
  
  // Проверяем версию WebApp
  if (webApp.version && parseFloat(webApp.version) < 6.0) return false;
  
  // Проверяем, что мы не в режиме разработки (если не нужно)
  if (webApp.isExpanded === false && !webApp.initData) return false;
  
  return true;
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

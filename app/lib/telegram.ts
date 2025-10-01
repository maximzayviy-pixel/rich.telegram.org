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
  const user = w?.Telegram?.WebApp?.initDataUnsafe?.user;
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
  return typeof window !== 'undefined' && !!(window as any)?.Telegram?.WebApp;
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

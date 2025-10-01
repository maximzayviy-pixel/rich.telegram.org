export type TelegramUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
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
  };
}

export async function verifyInitData(initData: string) {
  const res = await fetch('/api/telegram/verify', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData })
  });
  if (!res.ok) throw new Error('Telegram verification failed');
  return res.json();
}

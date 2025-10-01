"use client";
import { useEffect, useMemo, useState } from 'react';
import { Trophy, Star, Wallet } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getTelegramUserUnsafe, verifyInitData, TelegramUser } from './lib/telegram';
import { Card, Button } from '../components/ui';
import './globals.css';

export default function Page() {
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);
  const [verified, setVerified] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [stats, setStats] = useState<{balance: number; withdrawable: number} | null>(null);

  useEffect(() => {
    const w = window as any;
    const webApp = w?.Telegram?.WebApp;
    webApp?.expand?.();
    const user = getTelegramUserUnsafe();
    if (user) {
      setTgUser(user);
      verifyInitData(webApp?.initData || '')
        .then(async (res) => {
          if (res?.ok) {
            setVerified(true);
            await fetch('/api/user/upsert', {
              method: 'POST', headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                tg_id: user.id,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                photo_url: user.photo_url
              })
            });
            await refreshBoth(user.id);
          }
        })
        .catch(() => setVerified(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshBoth(tg_id?: number) {
    await Promise.all([loadLeaderboard(), loadStats(tg_id)]);
  }

  async function loadLeaderboard() {
    const res = await fetch('/api/leaderboard');
    const json = await res.json();
    if (json?.ok) setLeaderboard(json.data);
  }

  async function loadStats(tg_id?: number) {
    if (!tg_id && !tgUser) return;
    const id = tg_id || tgUser!.id;
    const { data, error } = await supabase.from('v_user_balances').select('*').eq('tg_id', id).single();
    if (!error && data) setStats({ balance: Number(data.current_balance || 0), withdrawable: Number(data.withdrawable || 0)});
  }

  const top3 = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);

  async function doDeposit() {
    if (!tgUser || !verified) return alert('Откройте в Telegram');
    const val = Number(amount);
    if (!val || val <= 0) return alert('Введите корректное число звёзд');
    setLoading(true);
    try {
      const res = await fetch('/api/deposit', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ tg_id: tgUser.id, amount: val }) });
      const ok = (await res.json())?.ok;
      if (!ok) throw new Error('deposit failed');
      setAmount('');
      await refreshBoth(tgUser.id);
    } catch (e:any) {
      alert('Ошибка депозита');
    } finally { setLoading(false); }
  }

  async function doWithdraw() {
    if (!tgUser || !verified) return alert('Откройте в Telegram');
    const target = stats?.withdrawable || 0;
    const val = Number(prompt(`Доступно к выводу: ${target}. Сколько вывести?`, String(target)) || 0);
    if (!val || val <= 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/withdraw', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ tg_id: tgUser.id, amount: val }) });
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.reason || 'withdraw failed');
      await refreshBoth(tgUser.id);
      alert('Заявка на вывод записана ✅');
    } catch(e:any) {
      alert(e?.message || 'Ошибка вывода');
    } finally { setLoading(false); }
  }

  return (
    <main className="relative min-h-screen">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <section className="container py-10">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 border border-white/10"><Trophy className="w-6 h-6" /></div>
            <h1 className="text-2xl md:text-3xl font-bold">Stars Board</h1>
          </div>
          {tgUser ? (
            <div className="flex items-center gap-3 text-sm opacity-90">
              {tgUser.photo_url && (<img src={tgUser.photo_url} className="w-8 h-8 rounded-full" alt="avatar" />)}
              <div>
                <div className="font-semibold">{tgUser.first_name} {tgUser.last_name}</div>
                <div className="text-white/70">@{tgUser.username || tgUser.id}</div>
              </div>
            </div>
          ) : (
            <div className="text-white/70 text-sm">Откройте приложение внутри Telegram</div>
          )}
        </header>

        <Card className="p-6 md:p-8 mb-10 bg-white/5">
          <div className="grid md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2">
              <h2 className="text-3xl font-extrabold mb-3 tracking-tight">Топ богатых по звёздам ✨</h2>
              <p className="text-white/80">Кидай звёзды на баланс — поднимайся в рейтинге. Вывод доступен через 21 день с момента депозита.</p>
              {stats && (
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg:white/5 border border-white/10 p-4">
                    <div className="text-white/70 text-xs">Баланс</div>
                    <div className="text-2xl font-bold flex items-center gap-2"><Star className="w-5 h-5" /> {stats.balance}</div>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="text-white/70 text-xs">Доступно к выводу</div>
                    <div className="text-2xl font-bold flex items-center gap-2"><Wallet className="w-5 h-5" /> {stats.withdrawable}</div>
                  </div>
                </div>
              )}
            </div>
            <div className="md:justify-self-end w-full">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <label className="text-sm text-white/80">Сколько звёзд закинуть?</label>
                <input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Например, 100" inputMode="numeric" className="mt-2 w-full bg-black/30 border border-white/10 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-white/30" />
                <Button onClick={doDeposit} disabled={loading || !verified} className="mt-3 w-full bg-white text-black">Закинуть ✨</Button>
                <Button onClick={doWithdraw} disabled={loading || !verified || (stats?.withdrawable||0)<=0} className="mt-2 w-full bg-transparent border border-white/20">Вывести</Button>
                <div className="text-xs text-white/60 mt-2">* Вывод возможен только со вкладов старше 21 дня.</div>
              </div>
            </div>
          </div>
        </Card>

        {top3.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {top3.map((row, i) => (
              <Card key={row.tg_id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-black opacity-70">#{i+1}</div>
                  {row?.user?.photo_url ? (
                    <img src={row.user.photo_url} className="w-10 h-10 rounded-full" alt="avatar" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/10" />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold">{row?.user?.first_name || 'User'} {row?.user?.last_name || ''}</div>
                    <div className="text-white/70 text-sm">@{row?.user?.username || row.tg_id}</div>
                  </div>
                  <div className="flex items-center gap-1 font-bold"><Star className="w-4 h-4" /> {Number(row.current_balance)}</div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5" />
            <div className="font-semibold">Лидерборд</div>
          </div>
          <div className="divide-y divide-white/10">
            {leaderboard.map((row, idx) => (
              <div key={row.tg_id} className="py-3 flex items-center gap-3">
                <div className="w-8 text-white/70">{idx+1}</div>
                {row?.user?.photo_url ? (
                  <img src={row.user.photo_url} className="w-8 h-8 rounded-full" alt="avatar" />
                ) : (<div className="w-8 h-8 rounded-full bg-white/10" />)}
                <div className="flex-1">
                  <div className="text-white/60 text-xs">@{row?.user?.username || row.tg_id}</div>
                </div>
                <div className="flex items-center gap-1 font-semibold"><Star className="w-4 h-4" /> {Number(row.current_balance)}</div>
              </div>
            ))}
          </div>
        </Card>

        <footer className="mt-10 text-center text-white/50 text-sm">Made for Telegram • Deployed on Vercel • Supabase powered</footer>
      </section>
    </main>
  );
}

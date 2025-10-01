"use client";
import { useEffect, useMemo, useState } from 'react';
import { Trophy, Star, Wallet, User, Settings, LogOut } from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';
import { getTelegramUserUnsafe, verifyInitData, TelegramUser, getTelegramWebApp, isTelegramWebApp } from '../app/lib/telegram';
import { Card, Button } from '../components/ui';

export default function Page() {
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);
  const [verified, setVerified] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [stats, setStats] = useState<{balance: number; withdrawable: number} | null>(null);
  const [isInTelegram, setIsInTelegram] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const webApp = getTelegramWebApp();
    const user = getTelegramUserUnsafe();
    
    if (webApp && user) {
      setIsInTelegram(true);
      setTgUser(user);
      
      // Настройка WebApp
      webApp.ready();
      webApp.expand();
      webApp.enableClosingConfirmation();
      
      // Верификация пользователя
      verifyInitData(webApp.initData || '')
        .then(async (res) => {
          if (res?.ok) {
            setVerified(true);
            // Сохранение пользователя в БД
            await fetch('/api/user/upsert', {
              method: 'POST', 
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                tg_id: user.id,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                photo_url: user.photo_url
              })
            });
            await refreshBoth(user.id);
          } else {
            setVerified(false);
          }
        })
        .catch(() => setVerified(false));
    } else {
      setIsInTelegram(false);
      // Для тестирования в браузере
      setTgUser({
        id: 123456789,
        username: 'test_user',
        first_name: 'Test',
        last_name: 'User',
        photo_url: undefined
      });
      setVerified(true);
      refreshBoth(123456789);
    }
    
    // Загрузка лидерборда
    loadLeaderboard();
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
    const supabase = getSupabase();
    const { data, error } = await supabase.from('v_user_balances').select('*').eq('tg_id', id).single();
    if (!error && data) setStats({ balance: Number(data.current_balance || 0), withdrawable: Number(data.withdrawable || 0)});
  }

  const top3 = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);

  async function doDeposit() {
    if (!tgUser || !verified) {
      if (isInTelegram) {
        alert('Ошибка верификации. Перезапустите приложение.');
      } else {
        alert('Откройте приложение в Telegram для депозита');
      }
      return;
    }
    
    const val = Number(amount);
    if (!val || val <= 0) {
      alert('Введите корректное число звёзд');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/deposit', { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({ tg_id: tgUser.id, amount: val }) 
      });
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.reason || 'deposit failed');
      
      setAmount('');
      await refreshBoth(tgUser.id);
      
      // Показать уведомление в Telegram
      if (isInTelegram) {
        const webApp = getTelegramWebApp();
        webApp?.showAlert(`Успешно зачислено ${val} звёзд! ✨`);
      } else {
        alert(`Успешно зачислено ${val} звёзд! ✨`);
      }
    } catch (e: any) {
      const message = e?.message || 'Ошибка депозита';
      if (isInTelegram) {
        const webApp = getTelegramWebApp();
        webApp?.showAlert(message);
      } else {
        alert(message);
      }
    } finally { 
      setLoading(false); 
    }
  }

  async function doWithdraw() {
    if (!tgUser || !verified) {
      if (isInTelegram) {
        alert('Ошибка верификации. Перезапустите приложение.');
      } else {
        alert('Откройте приложение в Telegram для вывода');
      }
      return;
    }
    
    const target = stats?.withdrawable || 0;
    if (target <= 0) {
      alert('Нет доступных средств для вывода');
      return;
    }
    
    const val = Number(prompt(`Доступно к выводу: ${target} звёзд\nСколько вывести?`, String(target)) || 0);
    if (!val || val <= 0) return;
    
    if (val > target) {
      alert(`Нельзя вывести больше ${target} звёзд`);
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/withdraw', { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({ tg_id: tgUser.id, amount: val }) 
      });
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.reason || 'withdraw failed');
      
      await refreshBoth(tgUser.id);
      
      if (isInTelegram) {
        const webApp = getTelegramWebApp();
        webApp?.showAlert(`Заявка на вывод ${val} звёзд создана! ✅`);
      } else {
        alert(`Заявка на вывод ${val} звёзд создана! ✅`);
      }
    } catch(e: any) {
      const message = e?.message || 'Ошибка вывода';
      if (isInTelegram) {
        const webApp = getTelegramWebApp();
        webApp?.showAlert(message);
      } else {
        alert(message);
      }
    } finally { 
      setLoading(false); 
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500 text-white">
                <Trophy className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Stars Board</h1>
            </div>
            {tgUser && (
              <button 
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-2 p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {tgUser.photo_url ? (
                  <img src={tgUser.photo_url} className="w-8 h-8 rounded-full" alt="avatar" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {tgUser.first_name} {tgUser.last_name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    @{tgUser.username || tgUser.id}
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      {showProfile && tgUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-4 mb-6">
              {tgUser.photo_url ? (
                <img src={tgUser.photo_url} className="w-16 h-16 rounded-full" alt="avatar" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tgUser.first_name} {tgUser.last_name}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">@{tgUser.username || tgUser.id}</p>
              </div>
            </div>
            
            {stats && (
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="text-gray-700 dark:text-gray-300">Баланс</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{stats.balance} ⭐</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">Доступно к выводу</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{stats.withdrawable} ⭐</span>
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowProfile(false)}
                className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
              >
                Закрыть
              </button>
              {!isInTelegram && (
                <button 
                  onClick={() => {
                    alert('Откройте приложение в Telegram для полного функционала');
                    setShowProfile(false);
                  }}
                  className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-xl font-medium"
                >
                  Открыть в Telegram
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 space-y-6">

        {/* Main Action Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Telegram Stars Leaderboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Пополняйте баланс звёздами и поднимайтесь в рейтинге. Вывод доступен через 21 день.
            </p>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Баланс</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.balance} ⭐
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Доступно</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.withdrawable} ⭐
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Сумма депозита (звёзды)
              </label>
              <input 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                placeholder="Введите количество звёзд" 
                inputMode="numeric" 
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={doDeposit}
                disabled={loading || !verified || !amount}
                className="py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Star className="w-4 h-4" />
                    Закинуть
                  </>
                )}
              </button>
              
              <button
                onClick={doWithdraw}
                disabled={loading || !verified || (stats?.withdrawable || 0) <= 0}
                className="py-3 px-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    Вывести
                  </>
                )}
              </button>
            </div>
            
            {!verified && (
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {isInTelegram ? 'Ошибка верификации. Перезапустите приложение.' : 'Откройте приложение в Telegram для полного функционала'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Top 3 Podium */}
        {top3.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Топ-3 лидеров</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {top3.map((row, i) => (
                <div key={row.tg_id} className={`p-4 rounded-xl ${
                  i === 0 ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-2 border-yellow-200 dark:border-yellow-700' :
                  i === 1 ? 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-2 border-gray-200 dark:border-gray-600' :
                  'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-2 border-orange-200 dark:border-orange-700'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`text-2xl font-black ${
                      i === 0 ? 'text-yellow-600' : i === 1 ? 'text-gray-600' : 'text-orange-600'
                    }`}>
                      #{i+1}
                    </div>
                    {row?.user?.photo_url ? (
                      <img src={row.user.photo_url} className="w-10 h-10 rounded-full" alt="avatar" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-white truncate">
                        {row?.user?.first_name || 'User'} {row?.user?.last_name || ''}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-sm truncate">
                        @{row?.user?.username || row.tg_id}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-gray-900 dark:text-white">
                      <Star className="w-4 h-4 text-yellow-500" />
                      {Number(row.current_balance)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Полный лидерборд</h3>
          </div>
          <div className="space-y-2">
            {leaderboard.map((row, idx) => (
              <div key={row.tg_id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="w-8 text-center text-gray-500 dark:text-gray-400 font-medium">
                  {idx + 1}
                </div>
                {row?.user?.photo_url ? (
                  <img src={row.user.photo_url} className="w-8 h-8 rounded-full" alt="avatar" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {row?.user?.first_name || 'User'} {row?.user?.last_name || ''}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    @{row?.user?.username || row.tg_id}
                  </div>
                </div>
                <div className="flex items-center gap-1 font-semibold text-gray-900 dark:text-white">
                  <Star className="w-4 h-4 text-yellow-500" />
                  {Number(row.current_balance)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Made for Telegram • Deployed on Vercel • Supabase powered
          </p>
        </div>
      </div>
    </main>
  );
}

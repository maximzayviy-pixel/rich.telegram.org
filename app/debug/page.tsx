"use client";
import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    const checkTelegram = () => {
      const w = window as any;
      const webApp = w?.Telegram?.WebApp;
      const user = webApp?.initDataUnsafe?.user;
      
      addLog(`Window.Telegram exists: ${!!w?.Telegram}`);
      addLog(`WebApp exists: ${!!webApp}`);
      addLog(`User exists: ${!!user}`);
      
      if (webApp) {
        addLog(`Platform: ${webApp.platform || 'unknown'}`);
        addLog(`Version: ${webApp.version || 'unknown'}`);
        addLog(`InitData: ${!!webApp.initData}`);
        addLog(`InitDataUnsafe: ${!!webApp.initDataUnsafe}`);
        addLog(`Viewport height: ${webApp.viewportHeight || 'unknown'}`);
        addLog(`Theme params: ${JSON.stringify(webApp.themeParams || {})}`);
      }
      
      if (user) {
        addLog(`User ID: ${user.id}`);
        addLog(`User name: ${user.first_name} ${user.last_name}`);
        addLog(`Username: @${user.username || 'no username'}`);
      }
      
      setDebugInfo({
        hasTelegram: !!w?.Telegram,
        hasWebApp: !!webApp,
        hasUser: !!user,
        userAgent: navigator.userAgent,
        webApp: webApp ? {
          platform: webApp.platform,
          version: webApp.version,
          initData: !!webApp.initData,
          initDataUnsafe: !!webApp.initDataUnsafe,
          viewportHeight: webApp.viewportHeight,
          themeParams: webApp.themeParams
        } : null,
        user: user ? {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          photo_url: user.photo_url
        } : null
      });
    };

    // Проверяем сразу
    checkTelegram();
    
    // Проверяем через интервалы
    const interval = setInterval(checkTelegram, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Telegram WebApp Debug
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Debug Info
            </h2>
            <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Live Logs
            </h2>
            <div className="text-sm text-gray-700 dark:text-gray-300 max-h-96 overflow-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1 font-mono text-xs">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
            Инструкции для тестирования:
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-300">
            <li>Откройте эту страницу в Telegram WebApp</li>
            <li>Проверьте логи - должны появиться данные о WebApp</li>
            <li>Если данные не появляются, проверьте настройки бота</li>
            <li>Убедитесь, что бот правильно настроен для WebApp</li>
          </ol>
        </div>
        
        <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
            Возможные проблемы:
          </h3>
          <ul className="list-disc list-inside space-y-1 text-yellow-800 dark:text-yellow-300">
            <li>Бот не настроен для WebApp в BotFather</li>
            <li>Неправильный URL в настройках WebApp</li>
            <li>Отсутствует TELEGRAM_BOT_TOKEN в переменных окружения</li>
            <li>Проблемы с CORS или SSL сертификатом</li>
            <li>WebApp загружается асинхронно - попробуйте обновить страницу</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

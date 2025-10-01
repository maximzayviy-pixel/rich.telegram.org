import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stars Board - Telegram Leaderboard',
  description: 'Кидай звёзды на баланс — поднимайся в рейтинге. Вывод доступен через 21 день с момента депозита.',
  keywords: 'telegram, stars, leaderboard, webapp, blockchain, crypto',
  authors: [{ name: 'Stars Board Team' }],
  openGraph: {
    title: 'Stars Board - Telegram Leaderboard',
    description: 'Кидай звёзды на баланс — поднимайся в рейтинге. Вывод доступен через 21 день с момента депозита.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className="telegram-webapp">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Telegram WebApp initialization
              if (typeof window !== 'undefined') {
                // Wait for Telegram WebApp to load
                const initWebApp = () => {
                  if (window.Telegram?.WebApp) {
                    const webApp = window.Telegram.WebApp;
                    
                    webApp.ready();
                    webApp.expand();
                    webApp.enableClosingConfirmation();
                  
                    // Set theme colors
                    document.documentElement.style.setProperty('--tg-theme-bg-color', webApp.themeParams.bg_color || '#ffffff');
                    document.documentElement.style.setProperty('--tg-theme-text-color', webApp.themeParams.text_color || '#000000');
                    document.documentElement.style.setProperty('--tg-theme-hint-color', webApp.themeParams.hint_color || '#999999');
                    document.documentElement.style.setProperty('--tg-theme-link-color', webApp.themeParams.link_color || '#2481cc');
                    document.documentElement.style.setProperty('--tg-theme-button-color', webApp.themeParams.button_color || '#2481cc');
                    document.documentElement.style.setProperty('--tg-theme-button-text-color', webApp.themeParams.button_text_color || '#ffffff');
                    
                    // Set viewport height for proper fullscreen support
                    const setViewportHeight = () => {
                      const vh = webApp.viewportHeight || window.innerHeight;
                      document.documentElement.style.setProperty('--tg-viewport-height', vh + 'px');
                      document.documentElement.style.setProperty('--tg-viewport-stable-height', (webApp.viewportStableHeight || vh) + 'px');
                    };
                    
                    setViewportHeight();
                    
                    // Update viewport height when it changes
                    webApp.onEvent('viewportChanged', setViewportHeight);
                    
                    // Handle theme changes
                    webApp.onEvent('themeChanged', () => {
                      document.documentElement.style.setProperty('--tg-theme-bg-color', webApp.themeParams.bg_color || '#ffffff');
                      document.documentElement.style.setProperty('--tg-theme-text-color', webApp.themeParams.text_color || '#000000');
                    });
                  }
                };
                
                // Try to initialize immediately
                initWebApp();
                
                // Also try after a short delay in case WebApp loads asynchronously
                setTimeout(initWebApp, 50);
              }
            `,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}

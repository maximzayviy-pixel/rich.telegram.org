import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stars Board - Telegram Leaderboard',
  description: 'Кидай звёзды на баланс — поднимайся в рейтинге. Вывод доступен через 21 день с момента депозита.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                window.Telegram.WebApp.ready();
                window.Telegram.WebApp.expand();
                window.Telegram.WebApp.enableClosingConfirmation();
              }
            `,
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}

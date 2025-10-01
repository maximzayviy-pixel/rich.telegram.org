import './globals.css';

export const metadata = {
  title: 'Stars Board',
  description: 'Telegram Stars Leaderboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}

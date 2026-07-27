import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Inter, Manrope } from 'next/font/google';
import { APP_NAME } from '@/constants';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: `${APP_NAME} — chet eldan xavfsiz xarid yordamchisi`,
  description:
    "Mahsulotni toping, sotuvchini tekshiring, kuryerlarni solishtiring va bojxona xarajatini oldindan hisoblang.",
  applicationName: APP_NAME,
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#F8FAFC',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={`${inter.variable} ${manrope.variable}`}>
      <head>
        {/* Telegram injects window.Telegram.WebApp; loaded before hydration. */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body>{children}</body>
    </html>
  );
}

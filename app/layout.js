import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import AppShell from '@/components/AppShell';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || ('https://' + 'webcodeshop.com')),
  title: 'WebCodeShop — Code. Templates. Scripts. Solutions.',
  description: 'Production-ready PHP & HTML software, modern JS apps, and instant digital gift cards. Delivered in seconds with lifetime updates.',
  openGraph: {
    title: 'WebCodeShop — Premium code, scripts & gift cards',
    description: 'Production-ready PHP & HTML software, modern JS apps, and instant digital gift cards. Delivered in seconds with lifetime updates.',
    url: '/',
    siteName: 'WebCodeShop',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'WebCodeShop — Premium code, scripts & gift cards' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WebCodeShop — Premium code, scripts & gift cards',
    description: 'Production-ready PHP & HTML software, modern JS apps, and instant digital gift cards.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-256.png', type: 'image/png', sizes: '256x256' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable + ' ' + mono.variable}>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}

// import '@coinbase/onchainkit/styles.css';
import type { Metadata } from 'next';
import './globals.css';
import './compliance/user/kyc.css';
import './components/name-fallback.css';
import { Providers } from './providers';
import AppToaster from './components/Toaster';
import {Analytics} from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'NedaPay',
  description: 'Accept Stablecoins, Swap instantly, Cash Out Easily, Track Transactions',
  keywords: ['NedaPay', 'Stablecoins', 'Swap', 'Cash Out', 'Track Transactions'],
  authors: [{ name: 'NedaPay' }],
  openGraph: {
    title: 'NedaPay',
    description: 'Accept Stablecoins, Swap instantly, Cash Out Easily, Track Transactions',
    type: 'website',
    locale: 'en',
    siteName: 'NedaPay',
  },
  icons: {
    icon: '/favicon.png',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </head>
      <body className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900">
        <div className="flex flex-col min-h-screen">
          <Providers>
            <AppToaster />
            <main className="flex-grow">{children}</main>
          </Providers>
        </div>
        <Analytics />
      </body>
    </html>
  );
}

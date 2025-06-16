import '@coinbase/onchainkit/styles.css';
import type { Metadata } from 'next';
import './globals.css';
import './components/name-fallback.css';
import { Providers } from './providers';
import AppToaster from './components/Toaster';
import {Analytics} from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'NEDAPay',
  description: 'Accept Stablecoins, Swap instantly, Cash Out Easily, Track Transactions',
  keywords: ['NEDAPay', 'Stablecoins', 'Swap', 'Cash Out', 'Track Transactions'],
  authors: [{ name: 'NEDAPay' }],
  openGraph: {
    title: 'NEDAPay',
    description: 'Accept Stablecoins, Swap instantly, Cash Out Easily, Track Transactions',
    type: 'website',
    locale: 'en',
    siteName: 'NEDAPay',
  },
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
      </head>
      <body className="bg-white text-black dark:text-white">
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

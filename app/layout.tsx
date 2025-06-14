import '@coinbase/onchainkit/styles.css';
import type { Metadata } from 'next';
import './globals.css';
import './components/name-fallback.css';
import { Providers } from './providers';
import AppToaster from './components/Toaster';

export const metadata: Metadata = {
  title: 'NEDA Pay Merchant Portal',
  description: 'Merchant dashboard for NEDA Pay stablecoin ecosystem',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
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
        
      </body>
    </html>
  );
}

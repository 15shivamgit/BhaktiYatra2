import { Cormorant_Garamond, Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import { UserProvider } from '@/lib/auth/user-context';
import { SITE_URL } from '@/lib/config';
import { t } from '@/lib/i18n';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${t('site.name')} — ${t('site.tagline')}`,
    template: `%s | ${t('site.name')}`,
  },
  description: t('site.description'),
  applicationName: t('site.name'),
  openGraph: { type: 'website', siteName: t('site.name'), locale: 'en_IN' },
};

export const viewport = {
  themeColor: '#fffcf7',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:shadow-card-hover"
        >
          {t('nav.skipToContent')}
        </a>
        <UserProvider>
          <Navbar />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </UserProvider>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}

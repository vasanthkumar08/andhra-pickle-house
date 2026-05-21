import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Sans, Noto_Sans_Telugu } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/components/providers/AppProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { RouteTheme } from '@/components/providers/RouteTheme';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { SmoothScroll } from '@/components/effects/SmoothScroll';
import { PremiumCursor } from '@/components/effects/PremiumCursor';
import { Header } from '@/components/layout/Header';
import { AuthModal } from '@/components/auth/AuthModal';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { WhatsAppFAB } from '@/components/layout/WhatsAppFAB';
import { StickyMobileCTA } from '@/components/layout/StickyMobileCTA';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

const display = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['300', '400', '500', '600'],
});

const body = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
});

const telugu = Noto_Sans_Telugu({
  subsets: ['telugu'],
  variable: '--font-telugu',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: {
    default: 'Andhra Pickle House | Premium Homemade Avakaya & Telugu Pickles',
    template: '%s | Andhra Pickle House',
  },
  description:
    'Premium homemade Andhra pickles — Avakaya, Gongura, Tomato & more. Handcrafted Telugu family recipes. Order via WhatsApp. Pan-India delivery.',
  keywords: [
    'avakaya pickle online',
    'andhra pickles',
    'homemade pickle india',
    'gongura pickle',
    'telugu pickles',
    'vijayawada pickles',
  ],
  openGraph: {
    title: 'Andhra Pickle House — Premium Homemade Pickles',
    description: 'Cinematic handcrafted Andhra pickles. Three generations of Telugu family recipes.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Andhra Pickle House',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Andhra Pickle House',
    description: 'Premium homemade Andhra pickles — order via WhatsApp',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${telugu.variable}`}
      data-scroll-behavior="smooth"
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FoodEstablishment',
              name: 'Andhra Pickle House',
              description: 'Premium homemade Andhra pickles',
              servesCuisine: 'Indian',
              address: { '@type': 'PostalAddress', addressRegion: 'Andhra Pradesh', addressCountry: 'IN' },
            }),
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <AppProvider>
              <RouteTheme />
              <ErrorBoundary>
                <SmoothScroll>
                  <PremiumCursor />
                  <Header />
                  {children}
                  <AuthModal />
                  <CartDrawer />
                  <WhatsAppFAB />
                  <StickyMobileCTA />
                  <MobileBottomNav />
                </SmoothScroll>
              </ErrorBoundary>
            </AppProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

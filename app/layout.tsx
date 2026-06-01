import type { Metadata } from 'next';
import { Inter, Instrument_Serif } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://devrabyte.ai'),
  title: {
    default: 'Devrabyte AI Ops — From idea to execution to insight',
    template: '%s · Devrabyte AI Ops',
  },
  description:
    'AI-powered operations platform for African SMEs. Design workflows, track tasks, detect bottlenecks, and run your business from WhatsApp.',
  keywords: [
    'operations', 'SME', 'WhatsApp', 'task management', 'workflow', 'bottleneck detection',
    'African business', 'Claude AI', 'automation', 'Paystack',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Devrabyte AI Ops',
    title: 'Devrabyte AI Ops — From idea to execution to insight',
    description:
      'AI-powered operations platform for African SMEs. WhatsApp-first, built for the way your team already works.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Devrabyte AI Ops',
    description: 'WhatsApp-first operations platform for African SMEs.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

import type {Metadata} from 'next';
import {Inter, Instrument_Serif, JetBrains_Mono, Manrope} from 'next/font/google';
import './globals.css';
import {Toaster} from '@/components/ui/toaster';
import {AuthProvider} from '@/hooks/use-auth';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

const instrument = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-instrument',
  display: 'swap',
  weight: ['400'],
  style: ['normal', 'italic'],
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  weight: ['500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Peer Academy',
  description: 'Your personal AI-powered learning platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${instrument.variable} ${jetbrains.variable} ${manrope.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

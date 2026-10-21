import type { Metadata } from 'next';
import { Josefin_Sans, Raleway, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const josefin = Josefin_Sans({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['300', '400', '600', '700'],
  display: 'swap',
});

const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-raleway',
  display: 'swap',
});

// Used on the public menu screens (screen-1/screen-2) — a more modern,
// geometric sans than Raleway, with strong number legibility for prices.
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-menu',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '18g Coffee — Menu',
  description: 'The 18g Coffee & Roastery drinks menu.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${josefin.variable} ${raleway.variable} ${jakarta.variable}`}>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Josefin_Sans, Raleway } from 'next/font/google';
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

export const metadata: Metadata = {
  title: '18g Coffee — Menu',
  description: 'The 18g Coffee & Roastery drinks menu.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${josefin.variable} ${raleway.variable}`}>
      <body>{children}</body>
    </html>
  );
}

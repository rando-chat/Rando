// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import App from './src/App';
import './src/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RANDO - Free Random Chat',
  description: 'Chat randomly with people worldwide. 100% free, no subscriptions.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <App>{children}</App>
      </body>
    </html>
  );
}
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Rando Chat - Connect with Random People Safely',
  description: 'Meet new people through intelligent matching and safe, moderated conversations. Free guest access or upgrade for premium features.',
  keywords: ['chat', 'random chat', 'meet new people', 'online friends', 'safe chat'],
  authors: [{ name: 'Rando Chat Team' }],
  openGraph: {
    type: 'website',
    title: 'Rando Chat',
    description: 'Connect with random people through safe, intelligent matching',
    siteName: 'Rando Chat',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gradient-to-br from-purple-50 to-blue-50 min-h-screen`}>
        <Providers>
          <main className="min-h-screen">
            {/* Background decorative elements */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-coral-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gold-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>
            
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
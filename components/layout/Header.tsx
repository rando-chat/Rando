'use client'
import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'

export function Header() {
  const { isAuthenticated, getDisplayName, signOut } = useAuth()

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Rando Chat
        </Link>
        {isAuthenticated && (
          <div className="flex gap-4 items-center">
            <span className="text-gray-600">{getDisplayName()}</span>
            <button onClick={signOut} className="text-red-600 hover:underline">Sign Out</button>
          </div>
        )}
      </div>
    </header>
  )
}

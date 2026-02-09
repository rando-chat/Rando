'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { CheckCircle } from 'lucide-react'

export function MatchFound({ match }: { match: any }) {
  const router = useRouter()

  useEffect(() => {
    setTimeout(() => {
      router.push(`/chat/${match.session_id}`)
    }, 2000)
  }, [match, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Match Found!</h1>
        <p className="text-gray-600 mb-4">Connecting to {match.match_display_name}...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
      </div>
    </div>
  )
}

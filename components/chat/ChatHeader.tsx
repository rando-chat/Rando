'use client'

interface ChatHeaderProps {
  session: any
  guestSession: any
  onEndChat: () => void
}

export function ChatHeader({ session, guestSession, onEndChat }: ChatHeaderProps) {
  const isUser1 = guestSession?.guest_id === session?.user1_id
  const partnerName = isUser1 
    ? (session?.user2_display_name || 'Anonymous')
    : (session?.user1_display_name || 'Anonymous')

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
            {partnerName[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{partnerName}</h2>
            <p className="text-xs text-gray-500">Online</p>
          </div>
        </div>
        
        <button
          onClick={onEndChat}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
        >
          End Chat
        </button>
      </div>
    </div>
  )
}
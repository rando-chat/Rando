'use client'

interface MessageBubbleProps {
  message: any
  isOwn: boolean
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const isImage = message.content?.startsWith('📷 Image:')
  const imageUrl = isImage ? message.content.replace('📷 Image: ', '') : null

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        <span className="text-xs text-gray-500 mb-1 px-1">
          {message.sender_display_name || 'Anonymous'}
        </span>
        
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-sm'
              : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
          }`}
        >
          {isImage ? (
            <img
              src={imageUrl}
              alt="Shared image"
              className="max-w-full rounded-lg max-h-64 object-cover"
            />
          ) : (
            <p className="text-sm break-words">{message.content}</p>
          )}
        </div>
        
        {message.created_at && (
          <span className="text-xs text-gray-400 mt-1 px-1">
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>
    </div>
  )
}
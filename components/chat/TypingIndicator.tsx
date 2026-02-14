'use client'

export function TypingIndicator({ displayName }: { displayName: string }) {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-[70%]">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{displayName} is typing</span>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-150"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-300"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
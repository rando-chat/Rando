import React from 'react';
import { Message } from '@/types';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const timestamp = message.created_at 
    ? format(new Date(message.created_at), 'HH:mm')
    : '';

  if (message.content_type === 'image') {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[70%] ${isOwn ? 'ml-auto' : ''}`}>
          <div className="relative group">
            <img
              src={message.content}
              alt="Shared image"
              className="rounded-2xl max-w-full max-h-96 object-contain bg-card"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/api/placeholder/400/300';
              }}
            />
            {isOwn && message.moderated && (
              <div className="absolute top-2 right-2 bg-danger text-white text-xs px-2 py-1 rounded">
                Moderated
              </div>
            )}
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500">
              {timestamp}
            </span>
            <span className="text-xs text-gray-500">
              📸 Image
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwn ? 'ml-auto' : ''}`}>
        {!isOwn && message.sender && (
          <div className="text-xs text-gray-500 mb-1">
            {message.sender.username}
          </div>
        )}
        <div
          className={`chat-bubble ${isOwn ? 'chat-bubble-own' : 'chat-bubble-other'}`}
        >
          <div className="break-words whitespace-pre-wrap">
            {message.content}
          </div>
          {message.moderated && !isOwn && (
            <div className="text-xs text-warning mt-1">
              ⚠️ This message was moderated
            </div>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1 text-right">
          {timestamp}
        </div>
      </div>
    </div>
  );
}
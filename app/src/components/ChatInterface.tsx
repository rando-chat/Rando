import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { uploadImage } from '@/lib/supabase/storage';
import { trackAnalytics } from '@/lib/supabase/auth';
import MessageBubble from './MessageBubble';
import toast from 'react-hot-toast';

interface ChatInterfaceProps {
  sessionId: string;
  onEndSession: () => void;
}

export default function ChatInterface({ sessionId, onEndSession }: ChatInterfaceProps) {
  const { messages, session, sendMessage, endSession } = useChat(sessionId);
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const trimmedInput = input.trim();
    setInput('');

    const result = await sendMessage(trimmedInput);
    if (!result.success) {
      toast.error(result.error || 'Failed to send message');
      setInput(trimmedInput);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }

    setUploading(true);
    try {
      const uploadResult = await uploadImage(file, user.id);
      if (!uploadResult) {
        throw new Error('Upload failed');
      }

      const result = await sendMessage(uploadResult.url, 'image');
      if (!result.success) {
        toast.error(result.error || 'Failed to send image');
      } else {
        await trackAnalytics('image_sent', {
          sessionId,
          fileSize: file.size,
          fileType: file.type,
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEndChat = async () => {
    const result = await endSession();
    if (result.success) {
      toast.success('Chat ended');
      onEndSession();
    } else {
      toast.error(result.error || 'Failed to end chat');
    }
  };

  const getPartner = () => {
    if (!session || !user) return null;
    return session.user1_id === user.id ? session.user2 : session.user1;
  };

  const partner = getPartner();

  return (
    <div className="flex flex-col h-screen">
      {/* Chat Header */}
      <div className="glass border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-bold">
                {partner?.username?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <h3 className="font-bold">{partner?.username || 'Anonymous'}</h3>
              <p className="text-sm text-gray-400">
                {session?.started_at ? `Chat started ${new Date(session.started_at).toLocaleTimeString()}` : 'Connecting...'}
              </p>
            </div>
          </div>
          <button
            onClick={handleEndChat}
            className="btn-secondary text-sm px-4 py-2"
          >
            End Chat
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.sender_id === user?.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="glass border-t border-gray-800 p-4">
        <form onSubmit={handleSend} className="flex space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || user?.tier === 'free'}
            className={`px-4 py-3 rounded-lg border ${
              user?.tier === 'free'
                ? 'border-gray-600 text-gray-500 cursor-not-allowed'
                : 'border-gold text-gold hover:bg-gold hover:text-dark'
            } transition-all duration-200`}
            title={user?.tier === 'free' ? 'Upgrade to send images' : 'Send image'}
          >
            {uploading ? '📤 Uploading...' : '📸'}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="input-field flex-1"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />

          <button
            type="submit"
            disabled={!input.trim()}
            className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>

        {user?.tier === 'free' && (
          <p className="text-sm text-gray-400 mt-2 text-center">
            💡 Upgrade to Premium or Student tier to send images
          </p>
        )}
      </div>
    </div>
  );
}
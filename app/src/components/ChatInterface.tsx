// app/src/components/ChatInterface.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { uploadImage } from '@/lib/supabase/storage';
import { trackAnalytics } from '@/lib/supabase/auth';
import MessageBubble from './MessageBubble';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface ChatInterfaceProps {
  sessionId: string;
  onEndSession: () => void;
  isGuest?: boolean;
  guestId?: string;
}

export default function ChatInterface({ 
  sessionId, 
  onEndSession, 
  isGuest = false, 
  guestId 
}: ChatInterfaceProps) {
  const router = useRouter();
  const { messages, session, sendMessage, endSession } = useChat(sessionId);
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [guestMessages, setGuestMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, guestMessages]);

  // Guest-specific message sending
  const sendGuestMessage = async (content: string) => {
    if (!guestId) return { success: false, error: 'No guest ID' };

    const tempMessage = {
      id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: content,
      sender_id: guestId,
      sender_name: `Guest_${guestId.slice(-4)}`,
      type: 'text' as const,
      content_type: 'text' as const,
      created_at: new Date().toISOString(),
      session_id: sessionId,
      moderated: false,
      sender: {
        id: guestId,
        username: `Guest_${guestId.slice(-4)}`
      }
    };

    // Add to local state immediately
    setGuestMessages(prev => [...prev, tempMessage]);

    try {
      // Try to save to database (for mixed chats with registered users)
      const { error } = await supabase
        .from('messages')
        .insert({
          session_id: sessionId,
          content: content,
          sender_id: guestId,
          sender_name: `Guest_${guestId.slice(-4)}`,
          content_type: 'text',
          is_guest: true
        });

      if (error) {
        console.log('Guest message not saved to DB:', error.message);
      }

      trackAnalytics('guest_message_sent', {
        sessionId,
        length: content.length,
        guestId: guestId.slice(0, 8)
      });

      return { success: true };
    } catch (error) {
      console.error('Guest message error:', error);
      return { success: false, error: 'Failed to send message' };
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const trimmedInput = input.trim();
    setInput('');

    if (isGuest && guestId) {
      const result = await sendGuestMessage(trimmedInput);
      if (!result.success) {
        toast.error(result.error || 'Failed to send message');
        setInput(trimmedInput);
      } else {
        toast.success('Message sent');
      }
    } else {
      const result = await sendMessage(trimmedInput);
      if (!result.success) {
        toast.error(result.error || 'Failed to send message');
        setInput(trimmedInput);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isGuest) {
      toast.error('Guests cannot send images. Create an account for full features.');
      return;
    }

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
    if (isGuest) {
      // For guests, just end the session locally
      toast.success('Chat ended');
      onEndSession();
      
      trackAnalytics('guest_session_ended', {
        sessionId,
        messageCount: guestMessages.length,
        guestId: guestId?.slice(0, 8)
      });
    } else {
      const result = await endSession();
      if (result.success) {
        toast.success('Chat ended');
        onEndSession();
      } else {
        toast.error(result.error || 'Failed to end chat');
      }
    }
  };

  // Get partner info - FIXED VERSION
  const getPartner = () => {
    if (!session || !user) return null;
    
    const partnerId = session.user1_id === user.id ? session.user2_id : session.user1_id;
    const partnerName = session.user1_id === user.id 
      ? session.user2?.username 
      : session.user1?.username;
    
    return {
      id: partnerId,
      username: partnerName || 'Anonymous',
      // FIX: Use optional chaining with default value
      isGuest: session.user1_id === user.id 
        ? session.is_guest2 || false 
        : session.is_guest1 || false
    };
  };

  const partner = getPartner();
  const displayName = partner?.isGuest ? 'Anonymous' : (partner?.username || 'Anonymous');

  // Combine regular messages with guest messages
  const allMessages = isGuest ? [...guestMessages] : messages;

  return (
    <div className="flex flex-col h-screen">
      {/* Chat Header */}
      <div className="glass border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-gold flex items-center justify-center">
              <span className="text-white font-bold">
                {displayName?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <h3 className="font-bold">{displayName}</h3>
              <p className="text-sm text-gray-400">
                {isGuest ? 'Guest Mode • Anonymous chat' : 'Connected'}
                {session?.started_at && ` • ${new Date(session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isGuest && (
              <span className="px-2 py-1 bg-gradient-to-r from-primary to-gold text-dark text-xs rounded-full font-bold">
                GUEST MODE
              </span>
            )}
            <button
              onClick={handleEndChat}
              className="btn-secondary text-sm px-4 py-2"
            >
              End Chat
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {allMessages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">👋</div>
            <h3 className="text-xl font-bold mb-2">
              {isGuest ? 'Anonymous Chat Started!' : 'Chat Started!'}
            </h3>
            <p className="text-gray-400">
              {isGuest 
                ? 'Say hello! This chat is anonymous and messages are not saved.'
                : 'Say hello to start the conversation!'}
            </p>
            {isGuest && (
              <div className="mt-4 p-3 bg-gradient-to-r from-primary/20 to-gold/20 rounded-lg border border-gold/30">
                <p className="text-sm">
                  <span className="font-bold text-gold">✨ Guest Mode:</span> Create an account to save conversations, send images, and unlock all features
                </p>
              </div>
            )}
          </div>
        ) : (
          allMessages.map((message) => {
            const isOwn = isGuest 
              ? message.sender_id === guestId
              : message.sender_id === user?.id;
            
            let bubbleDisplayName: string | undefined;
            if (isGuest) {
              bubbleDisplayName = isOwn ? 'You' : 'Stranger';
            } else {
              bubbleDisplayName = isOwn ? 'You' : message.sender_name;
            }

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={isOwn}
                displayName={bubbleDisplayName}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="glass border-t border-gray-800 p-4">
        <form onSubmit={handleSend} className="flex space-x-2">
          {/* Only show image upload for non-guests */}
          {!isGuest && (
            <>
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
                title={user?.tier === 'free' 
                  ? 'Upgrade to send images' 
                  : 'Send image'}
              >
                {uploading ? '📤 Uploading...' : '📸'}
              </button>
            </>
          )}

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isGuest ? "Chat anonymously (messages not saved)..." : "Type your message..."}
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

        <div className="mt-2 flex justify-between items-center text-sm text-gray-400">
          <div>
            {isGuest ? (
              <span>💬 Guest chat • Messages not saved</span>
            ) : user?.tier === 'free' ? (
              <span>💡 Upgrade to send images</span>
            ) : (
              <span>Press Enter to send</span>
            )}
          </div>

          {isGuest && (
            <button
              onClick={() => router.push('/')}
              className="text-gold hover:text-gold/80 hover:underline"
            >
              Create account →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
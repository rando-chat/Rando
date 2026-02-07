// app/src/components/ChatInterface.tsx - FIXED VERSION
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { uploadImage } from '@/lib/supabase/storage';
import { trackAnalytics } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import MessageBubble from './MessageBubble';
import ConversationStarters from './chat/ConversationStarters';
import GuestProgress from './guest/GuestProgress';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import toast from 'react-hot-toast';

// Import icons from lucide-react
import { 
  Image as ImageIcon, 
  Send, 
  Shield, 
  Flag, 
  SkipForward,
  Mic,
  Smile,
  Zap,
  Crown
} from 'lucide-react';

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

    setGuestMessages(prev => [...prev, tempMessage]);

    try {
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

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

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

  const getPartner = () => {
    if (!session || !user) return null;

    const partnerId = session.user1_id === user.id ? session.user2_id : session.user1_id;
    const partnerName = session.user1_id === user.id 
      ? session.user2?.username 
      : session.user1?.username;

    return {
      id: partnerId,
      username: partnerName || 'Anonymous',
      isGuest: session.user1_id === user.id 
        ? session.is_guest2 || false 
        : session.is_guest1 || false
    };
  };

  const partner = getPartner();
  const displayName = partner?.isGuest ? 'Anonymous' : (partner?.username || 'Anonymous');
  const allMessages = isGuest ? [...guestMessages] : messages;

  // Helper function for random colors
  const getRandomColor = () => {
    const colors = [
      'bg-gradient-to-r from-rando-purple to-rando-purple-700',
      'bg-gradient-to-r from-rando-gold to-rando-gold-600',
      'bg-gradient-to-r from-rando-coral to-rando-coral-600',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleStarterSelect = (starter: string) => {
    setInput(starter);
    toast.success('Starter added to input');
  };

  // Chat Header Component - FIXED
  const ChatHeader = () => (
    <div className="glass border-b border-rando-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-full ${getRandomColor()} flex items-center justify-center`}>
            <span className="text-white font-bold text-lg">
              {displayName?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-lg">{displayName}</h3>
            </div>
            <div className="flex items-center space-x-3 text-sm text-text-secondary">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-success rounded-full mr-1.5" />
                Online
              </span>
              {session?.started_at && (
                <span>
                  {new Date(session.started_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              )}
              {isGuest && (
                <Badge variant="guest" size="sm">
                  Guest Mode
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Shield className="h-4 w-4" />}
          >
            Safety
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEndChat}
            leftIcon={<Flag className="h-4 w-4" />}
          >
            End Chat
          </Button>
        </div>
      </div>
    </div>
  );

  // Chat Input Component - FIXED
  const ChatInput = () => (
    <div className="glass border-t border-rando-border p-4 pb-safe">
      {/* Conversation Starters */}
      {allMessages.length < 3 && (
        <div className="mb-4">
          <ConversationStarters onSelect={handleStarterSelect} />
        </div>
      )}
      
      {/* Guest Progress */}
      {isGuest && guestId && (
        <div className="mb-4">
          <GuestProgress
            currentChatCount={3} // Replace with actual count
            onUpgrade={() => router.push('/signup')}
            onContinue={() => {}}
          />
        </div>
      )}

      <form onSubmit={handleSend} className="flex space-x-3">
        {/* Image Upload (non-guests only) */}
        {!isGuest && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || user?.tier === 'free'}
              className="flex-shrink-0"
              title={user?.tier === 'free' 
                ? 'Upgrade to send images' 
                : 'Send image'}
            >
              {uploading ? (
                <div className="animate-spin">📤</div>
              ) : (
                <ImageIcon className="h-5 w-5" />
              )}
            </Button>
          </>
        )}

        {/* Main Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isGuest 
                ? "Chat anonymously (messages not saved)..."
                : "Type your message..."
            }
            className="input-field pr-24"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          
          {/* Input Actions */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
            <button
              type="button"
              className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
            >
              <Smile className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
            >
              <Mic className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Send Button */}
        <Button
          type="submit"
          variant="gold"
          size="icon"
          disabled={!input.trim()}
          className="flex-shrink-0"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>

      {/* Quick Actions */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center space-x-2">
          {isGuest ? (
            <span className="text-sm text-text-secondary">
              💬 Guest chat • Messages not saved
            </span>
          ) : user?.tier === 'free' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {/* Show tiers */}}
              leftIcon={<Zap className="h-4 w-4" />}
            >
              Upgrade to send images
            </Button>
          ) : (
            <span className="text-sm text-text-secondary">
              Press Enter to send • Shift + Enter for new line
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {isGuest && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/signup')}
            >
              Create account →
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<SkipForward className="h-4 w-4" />}
          >
            Next Chat
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-rando-bg to-rando-card">
      <ChatHeader />
      
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {allMessages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-6 animate-float">👋</div>
            <h3 className="text-2xl font-bold mb-3">
              {isGuest ? 'Anonymous Chat Started!' : 'Chat Started!'}
            </h3>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              {isGuest 
                ? 'Say hello! This chat is anonymous and messages are not saved.'
                : 'Say hello to start the conversation! Try using a conversation starter below.'}
            </p>
            
            {!isGuest && (
              <div className="max-w-md mx-auto mb-6">
                <ConversationStarters onSelect={handleStarterSelect} />
              </div>
            )}
            
            {isGuest && (
              <Card variant="gradient" padding="md" className="max-w-md mx-auto border-rando-gold/30">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-rando-gold/20 rounded-lg">
                    <Zap className="h-5 w-5 text-rando-gold" />
                  </div>
                  <div>
                    <p className="font-semibold">✨ Guest Mode Active</p>
                    <p className="text-sm text-text-secondary">
                      Create an account to save conversations, send images, and unlock all features
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {allMessages.map((message) => {
              const isOwn = isGuest 
                ? message.sender_id === guestId
                : message.sender_id === user?.id;

              return (
                <div
                  key={message.id}
                  className="animate-message-sent"
                >
                  <MessageBubble
                    message={message}
                    isOwn={isOwn}
                    displayName={isOwn ? 'You' : displayName}
                  />
                </div>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput />
    </div>
  );
}
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { realtimeService } from '@/lib/supabase/realtime';
import { moderateContent } from '@/lib/moderation/perspective-api';
import { Message, ChatSession } from '@/types';
import { trackAnalytics } from '@/lib/supabase/auth';

export function useChat(sessionId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*, sender:users(*)')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      
      // Transform messages to include guest data
      const transformedMessages = (data || []).map((msg: any) => {
        // If it's a guest message, create a mock sender object
        if (msg.is_guest && !msg.sender) {
          return {
            ...msg,
            sender: {
              id: msg.sender_id,
              username: msg.sender_name || 'Anonymous'
            }
          };
        }
        return msg;
      });
      
      setMessages(transformedMessages as Message[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const fetchSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('*, user1:users(*), user2:users(*)')
        .eq('id', sessionId)
        .single();

      if (fetchError) throw fetchError;
      
      // Transform session to ensure guest properties exist
      const transformedSession: ChatSession = {
        ...data,
        is_guest1: data.is_guest1 || false,
        is_guest2: data.is_guest2 || false
      };
      
      setSession(transformedSession as ChatSession);
    } catch (err: any) {
      setError(err.message);
    }
  }, [sessionId]);

  const sendMessage = useCallback(async (content: string, contentType: 'text' | 'image' = 'text') => {
    if (!sessionId) return { success: false, error: 'No session ID' };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Moderate content for text messages
      if (contentType === 'text') {
        const moderation = await moderateContent(content);
        if (moderation.flagged) {
          let errorMessage = 'Message blocked: ';
          switch (moderation.reason) {
            case 'links_not_allowed':
              errorMessage += 'Links are not allowed';
              break;
            case 'profanity':
              errorMessage += 'Inappropriate content detected';
              break;
            case 'phone_number':
              errorMessage += 'Phone numbers are not allowed';
              break;
            case 'email_address':
              errorMessage += 'Email addresses are not allowed';
              break;
            default:
              errorMessage += 'Content violates community guidelines';
          }
          return { success: false, error: errorMessage };
        }
      }

      // Check if user can send images
      if (contentType === 'image') {
        const { data: userData } = await supabase
          .from('users')
          .select('tier')
          .eq('id', user.id)
          .single();

        if (userData?.tier === 'free') {
          return { success: false, error: 'Image sharing requires premium or student tier' };
        }
      }

      const { data, error: insertError } = await supabase
        .from('messages')
        .insert({
          session_id: sessionId,
          sender_id: user.id,
          content,
          content_type: contentType,
          moderated: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await trackAnalytics('message_sent', {
        sessionId,
        contentType,
        length: content.length,
      });

      return { success: true, message: data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [sessionId]);

  const endSession = useCallback(async () => {
    if (!sessionId) return { success: false, error: 'No session ID' };

    try {
      const { error: updateError } = await supabase
        .from('chat_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      await trackAnalytics('session_ended', { sessionId });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    fetchMessages();
    fetchSession();

    // Subscribe to real-time messages
    const channel = realtimeService.subscribeToMessages(sessionId, (newMessage) => {
      // Transform guest messages
      if (newMessage.is_guest && !newMessage.sender) {
        newMessage.sender = {
          id: newMessage.sender_id,
          username: newMessage.sender_name || 'Anonymous'
        };
      }
      setMessages((prev) => [...prev, newMessage]);
    });

    // Subscribe to session updates
    const sessionChannel = realtimeService.subscribeToSession(sessionId, (updatedSession) => {
      // Ensure guest properties exist
      const transformedSession: ChatSession = {
        ...updatedSession,
        is_guest1: updatedSession.is_guest1 || false,
        is_guest2: updatedSession.is_guest2 || false
      };
      setSession(transformedSession);
    });

    return () => {
      realtimeService.unsubscribe(`messages-${sessionId}`);
      realtimeService.unsubscribe(`session-${sessionId}`);
    };
  }, [sessionId, fetchMessages, fetchSession]);

  return {
    messages,
    session,
    loading,
    error,
    sendMessage,
    endSession,
    refreshMessages: fetchMessages,
    refreshSession: fetchSession,
  };
}
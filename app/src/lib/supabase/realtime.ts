// app/src/lib/supabase/realtime.ts
import { supabase } from './client';
import { Message, ChatSession } from '@/types';

export class RealtimeService {
  private channels: Map<string, any> = new Map();

  async subscribeToMessages(sessionId: string, callback: (message: Message) => void) {
    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();

    this.channels.set(`messages-${sessionId}`, channel);
    return channel;
  }

  async subscribeToSession(sessionId: string, callback: (session: ChatSession) => void) {
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          callback(payload.new as ChatSession);
        }
      )
      .subscribe();

    this.channels.set(`session-${sessionId}`, channel);
    return channel;
  }

  async subscribeToOnlineUsers(callback: (userIds: string[]) => void) {
    try {
      // Get active users in matchmaking queue (return their IDs)
      const { data: queueData, error } = await supabase
        .from('matchmaking_queue')
        .select('user_id');

      if (error) {
        console.error('Error fetching online users:', error);
        callback([]);
        return null;
      }

      // Extract user IDs
      const userIds = queueData?.map(item => item.user_id) || [];
      console.log(`Online users (searching): ${userIds.length}`);
      callback(userIds);

      // Subscribe to real-time updates
      const channel = supabase
        .channel('online-users')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'matchmaking_queue',
          },
          async () => {
            // Re-fetch when queue changes
            const { data: newData } = await supabase
              .from('matchmaking_queue')
              .select('user_id');
            
            const newUserIds = newData?.map(item => item.user_id) || [];
            console.log(`Online users updated: ${newUserIds.length}`);
            callback(newUserIds);
          }
        )
        .subscribe();

      this.channels.set('online-users', channel);
      return channel;

    } catch (error) {
      console.error('Failed to subscribe to online users:', error);
      callback([]);
      return null;
    }
  }

  unsubscribe(channelKey: string) {
    const channel = this.channels.get(channelKey);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelKey);
    }
  }

  unsubscribeAll() {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }
}

export const realtimeService = new RealtimeService();
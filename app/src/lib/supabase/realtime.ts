import { supabase } from './client';
import { Message, ChatSession } from '@/types';

// Define type for presence data
interface PresenceData {
  user_id: string;
  online_at: string;
  username?: string;
}

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

  async subscribeToOnlineUsers(callback: (count: number) => void) {
    try {
      // Simple: Count active users in matchmaking queue (people searching)
      const { count, error } = await supabase
        .from('matchmaking_queue')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error counting online users:', error);
        callback(1); // Fallback to 1
        return null;
      }

      console.log(`Online users (searching): ${count || 0}`);
      callback(count || 0);

      // Also subscribe to real-time updates of the queue
      const channel = supabase
        .channel('online-count')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'matchmaking_queue',
          },
          async () => {
            // Re-fetch count when queue changes
            const { count: newCount } = await supabase
              .from('matchmaking_queue')
              .select('*', { count: 'exact', head: true });
            
            console.log(`Online users updated: ${newCount || 0}`);
            callback(newCount || 0);
          }
        )
        .subscribe();

      this.channels.set('online-count', channel);
      return channel;

    } catch (error) {
      console.error('Failed to subscribe to online users:', error);
      callback(1); // Fallback
      return null;
    }
  }

  async updatePresence(userId: string, username?: string) {
    const channel = this.channels.get('online-users');
    if (channel) {
      await channel.track({
        user_id: userId,
        username: username,
        online_at: new Date().toISOString()
      });
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
    this.channels.forEach((channel, key) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }
}

export const realtimeService = new RealtimeService()
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
    const channel = supabase
      .channel('online-users')
      .on(
        'presence',
        { event: 'sync' },
        () => {
          const state = channel.presenceState();
          const userIds = Object.keys(state).map((key) => {
            return state[key][0]?.user_id;
          }).filter(Boolean);
          callback(userIds);
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
          }
        }
      });

    this.channels.set('online-users', channel);
    return channel;
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

export const realtimeService = new RealtimeService();
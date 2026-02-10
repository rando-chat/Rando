/**
 * useRealtime Hook
 * 
 * Manages Supabase real-time subscriptions
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type TableName = 'messages' | 'chat_sessions' | 'matchmaking_queue' | 'users'
type EventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

interface UseRealtimeOptions<T> {
  table: TableName
  event: EventType
  filter?: string
  onInsert?: (payload: T) => void
  onUpdate?: (payload: { old: T; new: T }) => void
  onDelete?: (payload: T) => void
}

/**
 * Subscribe to real-time changes on a table
 */
export function useRealtime<T = any>(options: UseRealtimeOptions<T>) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let channel: RealtimeChannel | null = null

    async function subscribe() {
      try {
        const channelName = `${options.table}:${options.event}:${options.filter || 'all'}`
        
        channel = supabase.channel(channelName)

        channel
          .on(
            'postgres_changes' as any,
            {
              event: options.event,
              schema: 'public',
              table: options.table,
              filter: options.filter,
            },
            (payload: RealtimePostgresChangesPayload<T>) => {
              if (payload.eventType === 'INSERT' && options.onInsert) {
                options.onInsert(payload.new as T)
              } else if (payload.eventType === 'UPDATE' && options.onUpdate) {
                options.onUpdate({
                  old: payload.old as T,
                  new: payload.new as T,
                })
              } else if (payload.eventType === 'DELETE' && options.onDelete) {
                options.onDelete(payload.old as T)
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsConnected(true)
              setError(null)
            } else if (status === 'CHANNEL_ERROR') {
              setError(new Error('Channel error'))
              setIsConnected(false)
            } else if (status === 'TIMED_OUT') {
              setError(new Error('Connection timed out'))
              setIsConnected(false)
            }
          })
      } catch (err) {
        setError(err as Error)
        setIsConnected(false)
      }
    }

    subscribe()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [options.table, options.event, options.filter])

  return { isConnected, error }
}

/**
 * Subscribe to messages for a chat session
 */
export function useChatMessages(
  sessionId: string,
  onNewMessage: (message: any) => void
) {
  return useRealtime({
    table: 'messages',
    event: 'INSERT',
    filter: `session_id=eq.${sessionId}`,
    onInsert: onNewMessage,
  })
}

/**
 * Subscribe to chat session updates
 */
export function useChatSession(
  sessionId: string,
  onUpdate: (session: any) => void
) {
  return useRealtime({
    table: 'chat_sessions',
    event: 'UPDATE',
    filter: `id=eq.${sessionId}`,
    onUpdate: ({ new: newSession }) => onUpdate(newSession),
  })
}

/**
 * Subscribe to matchmaking queue updates
 */
export function useMatchmakingQueue(
  userId: string,
  isGuest: boolean,
  onMatch: (match: any) => void
) {
  return useRealtime({
    table: 'matchmaking_queue',
    event: 'UPDATE',
    filter: `user_id=eq.${userId}`,
    onUpdate: ({ new: newEntry }) => {
      if (newEntry.matched_at) {
        onMatch(newEntry)
      }
    },
  })
}

/**
 * Presence tracking for online users
 */
export function usePresence(channelName: string, userId: string, metadata?: any) {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    const presenceChannel = supabase.channel(channelName)

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const users = Object.values(state).flat()
        setOnlineUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
            ...metadata,
          })
        }
      })

    setChannel(presenceChannel)

    return () => {
      if (presenceChannel) {
        presenceChannel.untrack()
        supabase.removeChannel(presenceChannel)
      }
    }
  }, [channelName, userId])

  const updatePresence = useCallback(
    async (newMetadata: any) => {
      if (channel) {
        await channel.track({
          user_id: userId,
          online_at: new Date().toISOString(),
          ...newMetadata,
        })
      }
    },
    [channel, userId]
  )

  return { onlineUsers, updatePresence }
}

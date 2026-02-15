'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export function useFriends(userId: string | undefined) {
  const [friends, setFriends] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [sentRequests, setSentRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Load all friend data
  useEffect(() => {
    if (!userId) return

    loadFriends()
    loadRequests()
    setupRealtime()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [userId])

  const loadFriends = async () => {
    setLoading(true)
    
    // Get accepted friends
    const { data, error } = await supabase
      .from('friends')
      .select(`
        id,
        friend_id,
        status,
        created_at,
        friend:guest_sessions!friend_id(
          display_name,
          last_seen_at
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      const formatted = data.map(f => ({
        id: f.id,
        friend_id: f.friend_id,
        display_name: f.friend?.[0]?.display_name || 'Unknown',
        status: f.status,
        created_at: f.created_at,
        is_online: false // Will be updated by presence
      }))
      setFriends(formatted)
    }
    
    setLoading(false)
  }

  const loadRequests = async () => {
    // Get pending requests SENT by me
    const { data: sent } = await supabase
      .from('friends')
      .select(`
        id,
        friend_id,
        created_at,
        friend:guest_sessions!friend_id(display_name)
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')

    if (sent) {
      setSentRequests(sent.map(r => ({
        id: r.id,
        friend_id: r.friend_id,
        display_name: r.friend?.[0]?.display_name || 'Unknown',
        created_at: r.created_at
      })))
    }

    // Get pending requests RECEIVED by me
    const { data: received } = await supabase
      .from('friends')
      .select(`
        id,
        user_id,
        created_at,
        requester:guest_sessions!user_id(display_name)
      `)
      .eq('friend_id', userId)
      .eq('status', 'pending')

    if (received) {
      setPendingRequests(received.map(r => ({
        id: r.id,
        requester_id: r.user_id,
        display_name: r.requester?.[0]?.display_name || 'Unknown',
        created_at: r.created_at
      })))
    }
  }

  const setupRealtime = () => {
    if (channelRef.current || !userId) return

    const channel = supabase.channel(`friends-${userId}`, {
      config: { broadcast: { self: true } }
    })

    channelRef.current = channel

    // Listen for new friend requests
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'friends',
        filter: `friend_id=eq.${userId}`
      }, (payload) => {
        loadRequests() // Reload when new request arrives
      })

    // Listen for request acceptance
    channel
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'friends',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        if (payload.new.status === 'accepted') {
          loadFriends()
          loadRequests()
        }
      })

    channel.subscribe()
  }

  // Send friend request
  const sendFriendRequest = async (friendId: string) => {
    if (!userId) return false

    try {
      const { error } = await supabase
        .from('friends')
        .insert({
          user_id: userId,
          friend_id: friendId,
          status: 'pending',
          created_at: new Date().toISOString()
        })

      if (error) throw error
      
      await loadRequests() // Refresh
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  // Accept friend request
  const acceptRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', requestId)

      if (error) throw error

      await loadFriends()
      await loadRequests()
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  // Reject/decline friend request
  const rejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', requestId)

      if (error) throw error

      await loadRequests()
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  // Remove friend
  const removeFriend = async (friendId: string) => {
    if (!userId) return false

    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('user_id', userId)
        .eq('friend_id', friendId)

      if (error) throw error

      await loadFriends()
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  return {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    error,
    sendFriendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend
  }
}
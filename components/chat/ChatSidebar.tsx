'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface ChatSidebarProps {
  isOpen: boolean
  onClose: () => void
  partnerName: string
  chatDuration: string
  messageCount: number
  onReport: () => void
  onBlock: () => void
  onAddFriend: () => void
  guestId?: string
}

interface Friend {
  id: string
  friend_id: string
  friend_name: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  is_online?: boolean
}

export function ChatSidebar({
  isOpen,
  onClose,
  partnerName,
  chatDuration,
  messageCount,
  onReport,
  onBlock,
  onAddFriend,
  guestId
}: ChatSidebarProps) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'info'>('info')

  // Load friends when sidebar opens
  useEffect(() => {
    if (isOpen && guestId) {
      loadFriends()
      loadPendingRequests()
    }
  }, [isOpen, guestId])

  const loadFriends = async () => {
    if (!guestId) return
    setLoading(true)

    try {
      // Get accepted friends
      const { data, error } = await supabase
        .from('friends')
        .select(`
          id,
          friend_id,
          status,
          created_at,
          friend:guest_sessions!friend_id(display_name)
        `)
        .eq('user_id', guestId)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedFriends = data?.map(f => ({
        id: f.id,
        friend_id: f.friend_id,
        friend_name: f.friend?.[0]?.display_name || 'Unknown',
        status: f.status,
        created_at: f.created_at,
        is_online: false // We'll add real-time presence later
      })) || []

      setFriends(formattedFriends)

    } catch (err) {
      console.error('Error loading friends:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadPendingRequests = async () => {
    if (!guestId) return

    try {
      // Get pending requests WHERE this user is the friend_id (someone added them)
      const { data, error } = await supabase
        .from('friends')
        .select(`
          id,
          user_id,
          status,
          created_at,
          requester:guest_sessions!user_id(display_name)
        `)
        .eq('friend_id', guestId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedRequests = data?.map(r => ({
        id: r.id,
        friend_id: r.user_id,
        friend_name: r.requester?.[0]?.display_name || 'Unknown',
        status: r.status,
        created_at: r.created_at
      })) || []

      setPendingRequests(formattedRequests)

    } catch (err) {
      console.error('Error loading requests:', err)
    }
  }

  const acceptRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', requestId)

      if (error) throw error

      // Refresh lists
      await loadFriends()
      await loadPendingRequests()

    } catch (err) {
      console.error('Error accepting request:', err)
    }
  }

  const rejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'rejected' })
        .eq('id', requestId)

      if (error) throw error

      await loadPendingRequests()

    } catch (err) {
      console.error('Error rejecting request:', err)
    }
  }

  const removeFriend = async (friendId: string) => {
    if (!confirm('Remove this friend?')) return

    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendId)

      if (error) throw error

      await loadFriends()

    } catch (err) {
      console.error('Error removing friend:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed' as const,
      top: 0,
      right: 0,
      bottom: 0,
      width: 'min(380px, 90vw)',
      background: '#0a0a0f',
      borderLeft: '1px solid rgba(124,58,237,0.2)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column' as const,
      animation: 'slideIn 0.3s ease',
      boxShadow: '-5px 0 30px rgba(0,0,0,0.5)',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(124,58,237,0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: 600,
          color: '#f0f0f0',
          fontFamily: "'Georgia', serif",
          margin: 0,
        }}>
          RANDO
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: '8px',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            color: '#a0a0b0',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(124,58,237,0.2)',
        padding: '0 16px',
      }}>
        <button
          onClick={() => setActiveTab('info')}
          style={{
            flex: 1,
            padding: '12px 8px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'info' ? '2px solid #7c3aed' : '2px solid transparent',
            color: activeTab === 'info' ? '#7c3aed' : '#a0a0b0',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Chat Info
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          style={{
            flex: 1,
            padding: '12px 8px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'friends' ? '2px solid #7c3aed' : '2px solid transparent',
            color: activeTab === 'friends' ? '#7c3aed' : '#a0a0b0',
            cursor: 'pointer',
            fontSize: '14px',
            position: 'relative' as const,
          }}
        >
          Friends {friends.length > 0 && `(${friends.length})`}
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          style={{
            flex: 1,
            padding: '12px 8px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'requests' ? '2px solid #7c3aed' : '2px solid transparent',
            color: activeTab === 'requests' ? '#7c3aed' : '#a0a0b0',
            cursor: 'pointer',
            fontSize: '14px',
            position: 'relative' as const,
          }}
        >
          Requests
          {pendingRequests.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '8px',
              right: '20px',
              background: '#ef4444',
              color: 'white',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '10px',
            }}>
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto' as const,
        padding: '16px',
      }}>
        {/* INFO TAB */}
        {activeTab === 'info' && (
          <>
            {/* Current Chat Partner */}
            <div style={{
              background: 'rgba(124,58,237,0.1)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              textAlign: 'center' as const,
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                margin: '0 auto 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
              }}>
                {partnerName?.[0]?.toUpperCase()}
              </div>
              <h4 style={{
                fontSize: '18px',
                color: '#f0f0f0',
                marginBottom: '4px',
                fontFamily: "'Georgia', serif",
              }}>
                {partnerName}
              </h4>
              <p style={{ fontSize: '12px', color: '#22c55e', marginBottom: '16px' }}>
                ● Online
              </p>

              {/* Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  padding: '12px',
                }}>
                  <div style={{ fontSize: '20px', color: '#7c3aed', marginBottom: '4px' }}>⏱️</div>
                  <div style={{ fontSize: '11px', color: '#60607a' }}>Duration</div>
                  <div style={{ fontSize: '14px', color: '#f0f0f0' }}>{chatDuration}</div>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  padding: '12px',
                }}>
                  <div style={{ fontSize: '20px', color: '#7c3aed', marginBottom: '4px' }}>💬</div>
                  <div style={{ fontSize: '11px', color: '#60607a' }}>Messages</div>
                  <div style={{ fontSize: '14px', color: '#f0f0f0' }}>{messageCount}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={onAddFriend}
                style={actionButtonStyle}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124,58,237,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                ➕ Add {partnerName} as Friend
              </button>
              <button
                onClick={onReport}
                style={actionButtonStyle}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124,58,237,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                ⚠️ Report User
              </button>
              <button
                onClick={onBlock}
                style={{...actionButtonStyle, color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)'}}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                🚫 Block User
              </button>
            </div>
          </>
        )}

        {/* FRIENDS TAB */}
        {activeTab === 'friends' && (
          <div>
            <h4 style={{
              fontSize: '16px',
              color: '#f0f0f0',
              marginBottom: '16px',
              fontFamily: "'Georgia', serif",
            }}>
              Your Friends
            </h4>

            {loading && (
              <div style={{ textAlign: 'center', color: '#60607a', padding: '20px' }}>
                Loading...
              </div>
            )}

            {!loading && friends.length === 0 && (
              <div style={{
                textAlign: 'center',
                color: '#60607a',
                padding: '40px 20px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '12px',
              }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
                <p>No friends yet</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>
                  Add friends during chat to see them here
                </p>
              </div>
            )}

            {friends.map(friend => (
              <div key={friend.id} style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}>
                    {friend.friend_name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color: '#f0f0f0', fontWeight: 500 }}>
                      {friend.friend_name}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: friend.is_online ? '#22c55e' : '#60607a',
                    }}>
                      {friend.is_online ? '● Online' : 'Offline'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeFriend(friend.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '18px',
                    cursor: 'pointer',
                    padding: '4px 8px',
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* REQUESTS TAB */}
        {activeTab === 'requests' && (
          <div>
            <h4 style={{
              fontSize: '16px',
              color: '#f0f0f0',
              marginBottom: '16px',
              fontFamily: "'Georgia', serif",
            }}>
              Friend Requests
            </h4>

            {pendingRequests.length === 0 && (
              <div style={{
                textAlign: 'center',
                color: '#60607a',
                padding: '40px 20px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '12px',
              }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
                <p>No pending requests</p>
              </div>
            )}

            {pendingRequests.map(request => (
              <div key={request.id} style={{
                background: 'rgba(124,58,237,0.1)',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}>
                    {request.friend_name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color: '#f0f0f0', fontWeight: 500 }}>
                      {request.friend_name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#f59e0b' }}>
                      ⏳ Wants to connect
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => acceptRequest(request.id)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => rejectRequest(request.id)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: 'transparent',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '6px',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}

const actionButtonStyle = {
  width: '100%',
  padding: '14px',
  background: 'transparent',
  border: '1px solid rgba(124,58,237,0.2)',
  borderRadius: '10px',
  color: '#f0f0f0',
  fontSize: '15px',
  textAlign: 'left' as const,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
}
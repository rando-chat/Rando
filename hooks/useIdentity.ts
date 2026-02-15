'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useIdentity() {
  const [identity, setIdentity] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load or create identity
  useEffect(() => {
    const loadIdentity = async () => {
      try {
        // Check localStorage first
        const stored = localStorage.getItem('rando-identity')
        
        if (stored) {
          const parsed = JSON.parse(stored)
          // Verify it's still valid (not expired)
          if (new Date(parsed.expires_at) > new Date()) {
            setIdentity(parsed)
            console.log('📦 Loaded existing identity:', parsed.display_name)
            setLoading(false)
            return
          }
        }

        // Create new identity
        const { data, error } = await supabase.rpc('create_guest_session')
        if (error) throw error
        
        if (data && data.length > 0) {
          const newIdentity = data[0]
          localStorage.setItem('rando-identity', JSON.stringify(newIdentity))
          setIdentity(newIdentity)
          console.log('🆕 Created new identity:', newIdentity.display_name)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadIdentity()
  }, [])

  // Update display name
  const updateDisplayName = async (newName: string) => {
    if (!identity) return

    try {
      // Update in database
      const { error } = await supabase
        .from('guest_sessions')
        .update({ display_name: newName })
        .eq('id', identity.guest_id)

      if (error) throw error

      // Update local
      const updated = { ...identity, display_name: newName }
      localStorage.setItem('rando-identity', JSON.stringify(updated))
      setIdentity(updated)
      
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  // Update interests
  const updateInterests = async (interests: string[]) => {
    if (!identity) return

    try {
      const { error } = await supabase
        .from('guest_sessions')
        .update({ interests })
        .eq('id', identity.guest_id)

      if (error) throw error

      const updated = { ...identity, interests }
      localStorage.setItem('rando-identity', JSON.stringify(updated))
      setIdentity(updated)
      
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  // Clear identity (logout)
  const clearIdentity = () => {
    localStorage.removeItem('rando-identity')
    setIdentity(null)
  }

  return {
    identity,
    loading,
    error,
    updateDisplayName,
    updateInterests,
    clearIdentity
  }
}
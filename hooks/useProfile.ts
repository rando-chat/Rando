import { useState, useEffect } from 'react'
import { getUserProfile, updateUserProfile } from '@/lib/database/queries'
import { useAuth } from '@/components/auth/AuthProvider'
export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    if (user) {
      getUserProfile(user.id).then(data => {
        setProfile(data)
        setIsLoading(false)
      })
    }
  }, [user])
  const updateProfile = async (updates: any) => {
    if (!user) return
    await updateUserProfile(user.id, updates)
    setProfile({ ...profile, ...updates })
  }
  return { profile, updateProfile, isLoading }
}

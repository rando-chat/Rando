import { useState, useEffect } from 'react'
import { updateUserProfile } from '@/lib/database/queries'
import { useAuth } from '@/components/auth/AuthProvider'
export function useInterests() {
  const { user, dbUser } = useAuth()
  const [interests, setInterests] = useState<string[]>(dbUser?.interests || [])
  const [isUpdating, setIsUpdating] = useState(false)
  const addInterest = async (interest: string) => {
    if (!user || interests.includes(interest)) return
    const newInterests = [...interests, interest]
    setIsUpdating(true)
    await updateUserProfile(user.id, { interests: newInterests })
    setInterests(newInterests)
    setIsUpdating(false)
  }
  const removeInterest = async (interest: string) => {
    if (!user) return
    const newInterests = interests.filter(i => i !== interest)
    setIsUpdating(true)
    await updateUserProfile(user.id, { interests: newInterests })
    setInterests(newInterests)
    setIsUpdating(false)
  }
  return { interests, addInterest, removeInterest, isUpdating }
}

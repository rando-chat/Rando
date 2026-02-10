import { useState, useEffect } from 'react'
import { getUserProfile } from '@/lib/database/queries'
import { useAuth } from '@/components/auth/AuthProvider'
export function useUserData() {
  const { user } = useAuth()
  const [userData, setUserData] = useState<any>(null)
  useEffect(() => {
    if (user) {
      getUserProfile(user.id).then(setUserData)
    }
  }, [user])
  const refresh = async () => {
    if (user) {
      const data = await getUserProfile(user.id)
      setUserData(data)
    }
  }
  return { userData, refresh }
}

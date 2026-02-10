import { useAuth } from '@/components/auth/AuthProvider'
export function useAdmin() {
  const { isAdmin, dbUser } = useAuth()
  return { 
    isAdmin, 
    canBanUsers: isAdmin, 
    canModerate: isAdmin, 
    canAccessAuditLog: isAdmin, 
    adminUser: dbUser 
  }
}

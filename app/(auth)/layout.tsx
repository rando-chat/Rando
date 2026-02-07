// app/(auth)/layout.tsx
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        {children}
      </div>
    </AuthGuard>
  )
}
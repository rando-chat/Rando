'use client'

import { AuthGuard } from '@/components/auth/AuthGuard'

export default function ChatSettingsPage() {
  return (
    <AuthGuard requireUser>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <h1 className="text-3xl font-bold mb-6">Chat Settings</h1>
          
          <div className="bg-white rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Notifications</h2>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked />
                <span>Enable message notifications</span>
              </label>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Privacy</h2>
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                <span>Only match with verified users</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

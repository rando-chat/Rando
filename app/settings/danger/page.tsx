'use client'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { AuthGuard } from '@/components/auth/AuthGuard'
export default function SettingsPage() {
  return <AuthGuard requireUser><SettingsLayout><div className="bg-white rounded-lg p-6">Settings content</div></SettingsLayout></AuthGuard>
}

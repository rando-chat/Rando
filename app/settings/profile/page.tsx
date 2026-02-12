'use client'

import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { ProfileEditor } from '@/components/profile/ProfileEditor'
import { AvatarUploader } from '@/components/profile/AvatarUploader'
import { InterestsManager } from '@/components/profile/InterestsManager'
import { TierDisplay } from '@/components/profile/TierDisplay'
import { StudentVerification } from '@/components/profile/StudentVerification'

export default function ProfileSettings() {
  return (
    <SettingsLayout>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Profile Settings</h1>
        <p style={{ color: '#6b7280', marginBottom: 32 }}>
          Manage your personal information and customize your profile
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <TierDisplay />
          <StudentVerification />
          <AvatarUploader />
          <ProfileEditor />
          <InterestsManager />
        </div>
      </div>
    </SettingsLayout>
  )
}
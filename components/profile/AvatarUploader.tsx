'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'

export function AvatarUploader() {
  const { dbUser, refreshUserProfile } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      setError('')

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${dbUser!.id}-${Math.random()}.${fileExt}`
      const filePath = `${dbUser!.id}/${fileName}`

      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB')
      }

      // Check file type
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        throw new Error('File must be an image (JPG, PNG, GIF, or WebP)')
      }

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', dbUser!.id)

      if (updateError) {
        throw updateError
      }

      // Refresh user profile
      if (refreshUserProfile) {
        await refreshUserProfile()
      }

    } catch (error: any) {
      setError(error.message)
      console.error('Error uploading avatar:', error)
    } finally {
      setUploading(false)
    }
  }

  const removeAvatar = async () => {
    try {
      setUploading(true)
      setError('')

      // Update profile to remove avatar
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: null })
        .eq('id', dbUser!.id)

      if (updateError) {
        throw updateError
      }

      // Optionally delete from storage
      if (dbUser?.avatar_url) {
        const path = dbUser.avatar_url.split('/avatars/')[1]
        if (path) {
          await supabase.storage.from('avatars').remove([path])
        }
      }

      if (refreshUserProfile) {
        await refreshUserProfile()
      }

    } catch (error: any) {
      setError(error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ padding: '24px', background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Profile Picture</h3>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {/* Avatar Preview */}
        <div style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          overflow: 'hidden',
          background: dbUser?.avatar_url ? 'transparent' : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48,
          color: 'white',
          fontWeight: 700,
        }}>
          {dbUser?.avatar_url ? (
            <img 
              src={dbUser.avatar_url} 
              alt="Avatar" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            dbUser?.display_name?.[0]?.toUpperCase() || '?'
          )}
        </div>

        <div style={{ flex: 1 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={uploadAvatar}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          
          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                padding: '10px 20px',
                background: uploading ? '#d1d5db' : '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {uploading ? 'Uploading...' : dbUser?.avatar_url ? 'Change Photo' : 'Upload Photo'}
            </button>

            {dbUser?.avatar_url && (
              <button
                onClick={removeAvatar}
                disabled={uploading}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  color: '#ef4444',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Remove
              </button>
            )}
          </div>

          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
            JPG, PNG, GIF or WebP. Max 5MB.
          </p>

          {error && (
            <div style={{
              marginTop: 12,
              padding: '8px 12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 6,
              color: '#ef4444',
              fontSize: 13,
            }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
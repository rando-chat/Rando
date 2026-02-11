'use client'

import { useState } from 'react'
import { updateUserProfile } from '@/lib/database/queries'
import { useAuth } from '@/components/auth/AuthProvider'

export function ProfileEditor() {
  const { dbUser, refreshUserProfile } = useAuth()
  const [displayName, setDisplayName] = useState(dbUser?.display_name || '')
  const [bio, setBio] = useState(dbUser?.bio || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!displayName.trim()) {
      setError('Display name is required')
      return
    }
    if (displayName.trim().length < 2) {
      setError('Display name must be at least 2 characters')
      return
    }
    if (displayName.trim().length > 30) {
      setError('Display name must be 30 characters or less')
      return
    }
    if (bio.length > 200) {
      setError('Bio must be 200 characters or less')
      return
    }

    setLoading(true)
    try {
      await updateUserProfile(dbUser!.id, {
        display_name: displayName.trim(),
        bio: bio.trim(),
      })
      setSuccess(true)
      if (refreshUserProfile) await refreshUserProfile()
    } catch (err) {
      setError('Failed to update profile. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-6">Edit Profile</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
            maxLength={30}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">{displayName.length}/30 characters</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell others about yourself..."
            rows={4}
            maxLength={200}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">{bio.length}/200 characters</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            Profile updated successfully!
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
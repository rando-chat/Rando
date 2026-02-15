'use client'

import { useState } from 'react'

interface PreferencesProps {
  onSave: (preferences: MatchPreferences) => void
  initialPreferences?: MatchPreferences
}

interface MatchPreferences {
  interests: string[]
  ageMin: number
  ageMax: number
  genderPreference: 'any' | 'male' | 'female' | 'neutral'
  language: string
}

const COMMON_INTERESTS = [
  'Music', 'Movies', 'Gaming', 'Sports', 'Travel',
  'Food', 'Art', 'Technology', 'Books', 'Fitness',
  'Photography', 'Dancing', 'Cooking', 'Nature', 'Science'
]

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' }
]

export function Preferences({ onSave, initialPreferences }: PreferencesProps) {
  const [preferences, setPreferences] = useState<MatchPreferences>(
    initialPreferences || {
      interests: [],
      ageMin: 18,
      ageMax: 99,
      genderPreference: 'any',
      language: 'en'
    }
  )
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    initialPreferences?.interests || []
  )

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest)
      }
      if (prev.length >= 10) {
        alert('Maximum 10 interests allowed')
        return prev
      }
      return [...prev, interest]
    })
  }

  const handleSave = () => {
    onSave({
      ...preferences,
      interests: selectedInterests
    })
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      maxWidth: '500px',
      margin: '0 auto'
    }}>
      <h3 style={{
        fontSize: '20px',
        fontWeight: 600,
        color: '#1f2937',
        marginBottom: '20px'
      }}>
        Match Preferences
      </h3>

      {/* Interests */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: '#374151',
          marginBottom: '12px'
        }}>
          Interests (max 10)
        </label>
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {COMMON_INTERESTS.map(interest => (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              style={{
                padding: '8px 16px',
                background: selectedInterests.includes(interest) ? '#667eea' : '#f3f4f6',
                color: selectedInterests.includes(interest) ? 'white' : '#374151',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
            >
              {interest}
            </button>
          ))}
        </div>
        <p style={{
          fontSize: '12px',
          color: '#6b7280',
          marginTop: '8px'
        }}>
          Selected: {selectedInterests.length}/10
        </p>
      </div>

      {/* Age Range */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: '#374151',
          marginBottom: '12px'
        }}>
          Age Range
        </label>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <input
            type="number"
            value={preferences.ageMin}
            onChange={(e) => setPreferences(prev => ({
              ...prev,
              ageMin: parseInt(e.target.value) || 18
            }))}
            min={13}
            max={preferences.ageMax}
            style={{
              width: '80px',
              padding: '8px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
          <span>to</span>
          <input
            type="number"
            value={preferences.ageMax}
            onChange={(e) => setPreferences(prev => ({
              ...prev,
              ageMax: parseInt(e.target.value) || 99
            }))}
            min={preferences.ageMin}
            max={120}
            style={{
              width: '80px',
              padding: '8px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* Gender Preference */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: '#374151',
          marginBottom: '12px'
        }}>
          Gender Preference
        </label>
        <div style={{ display: 'flex', gap: '12px' }}>
          {(['any', 'male', 'female', 'neutral'] as const).map(gender => (
            <label key={gender} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="radio"
                name="gender"
                value={gender}
                checked={preferences.genderPreference === gender}
                onChange={() => setPreferences(prev => ({
                  ...prev,
                  genderPreference: gender
                }))}
              />
              <span style={{ fontSize: '14px', textTransform: 'capitalize' }}>{gender}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Language */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: '#374151',
          marginBottom: '12px'
        }}>
          Preferred Language
        </label>
        <select
          value={preferences.language}
          onChange={(e) => setPreferences(prev => ({
            ...prev,
            language: e.target.value
          }))}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        >
          {LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        style={{
          width: '100%',
          padding: '12px',
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 600
        }}
      >
        Save Preferences
      </button>
    </div>
  )
}
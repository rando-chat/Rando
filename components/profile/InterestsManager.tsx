'use client'

import { useState } from 'react'
import { useInterests } from '@/hooks/useInterests'
import { X, Plus } from 'lucide-react'

export function InterestsManager() {
  const { interests, addInterest, removeInterest, isUpdating } = useInterests()
  const [newInterest, setNewInterest] = useState('')
  const [error, setError] = useState('')

  const handleAdd = async () => {
    if (!newInterest.trim()) return
    
    if (newInterest.length > 50) {
      setError('Interest must be 50 characters or less')
      return
    }

    if (interests.length >= 20) {
      setError('Maximum 20 interests allowed')
      return
    }

    await addInterest(newInterest.trim())
    setNewInterest('')
    setError('')
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Interests ({interests.length}/20)
        </label>
        
        {/* Add Interest */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add an interest..."
            maxLength={50}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={handleAdd}
            disabled={isUpdating || !newInterest.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-sm mt-1">{error}</p>
        )}
      </div>

      {/* Interest Tags */}
      <div className="flex flex-wrap gap-2">
        {interests.map((interest, index) => (
          <div
            key={index}
            className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full flex items-center gap-2 group"
          >
            <span>{interest}</span>
            <button
              onClick={() => removeInterest(interest)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {interests.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          No interests added yet. Add some to help with matching!
        </p>
      )}
    </div>
  )
}

'use client'
import { useState } from 'react'

export function Preferences() {
  const [interests, setInterests] = useState<string[]>([])
  const [ageRange, setAgeRange] = useState({ min: 18, max: 99 })

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Interests (optional)</label>
        <input
          type="text"
          placeholder="Add interests..."
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Age Range</label>
        <div className="flex gap-2">
          <input type="number" value={ageRange.min} onChange={(e) => setAgeRange({...ageRange, min: parseInt(e.target.value)})} className="w-20 px-3 py-2 border rounded-lg" />
          <span className="self-center">to</span>
          <input type="number" value={ageRange.max} onChange={(e) => setAgeRange({...ageRange, max: parseInt(e.target.value)})} className="w-20 px-3 py-2 border rounded-lg" />
        </div>
      </div>
    </div>
  )
}

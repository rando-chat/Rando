'use client'

const REASONS = [
  { id: 'harassment', label: 'Harassment' },
  { id: 'hate_speech', label: 'Hate Speech' },
  { id: 'spam', label: 'Spam' },
  { id: 'inappropriate_content', label: 'Inappropriate Content' },
  { id: 'threats', label: 'Threats' },
  { id: 'other', label: 'Other' },
]

export function ReportReasons({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-2">
      {REASONS.map(r => (
        <button
          key={r.id}
          onClick={() => onSelect(r.id)}
          className={`w-full text-left px-4 py-3 rounded-lg border-2 ${
            selected === r.id ? 'border-red-600 bg-red-50' : 'border-gray-200'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}

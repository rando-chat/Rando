'use client'

export function EvidenceCollector({ onCollect }: { onCollect: (evidence: string) => void }) {
  return (
    <div className="mt-4">
      <p className="text-sm text-gray-600 mb-2">Additional evidence (optional)</p>
      <textarea
        onChange={(e) => onCollect(e.target.value)}
        className="w-full border rounded-lg p-3"
        placeholder="Any additional context..."
        rows={3}
      />
    </div>
  )
}

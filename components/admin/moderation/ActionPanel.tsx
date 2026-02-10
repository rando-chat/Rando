'use client'

export function ActionPanel({ onAction }: { onAction: (action: string) => void }) {
  const actions = [
    { id: 'dismiss', label: 'Dismiss Report', color: 'bg-gray-500' },
    { id: 'warn', label: 'Warn User', color: 'bg-yellow-500' },
    { id: 'ban_temporary', label: 'Temporary Ban (7 days)', color: 'bg-orange-500' },
    { id: 'ban_permanent', label: 'Permanent Ban', color: 'bg-red-600' },
  ]

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4">Moderation Actions</h3>
      <p className="text-sm text-gray-600 mb-4">
        Choose an action to take on this report
      </p>

      <div className="space-y-2">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction(action.id)}
            className={`w-full px-4 py-3 ${action.color} text-white rounded-lg hover:opacity-90 font-medium transition-opacity`}
          >
            {action.label}
          </button>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>Note:</strong> All actions are logged in the audit trail. Permanent bans cannot be reversed.
        </p>
      </div>
    </div>
  )
}

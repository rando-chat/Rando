'use client'
import { formatRelativeTime } from '@/lib/utils'

export function ReportReview({ report }: { report: any }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div>
        <h3 className="text-xl font-bold mb-4">Report Details</h3>
      </div>

      <div>
        <h4 className="font-semibold text-sm text-gray-700">Category</h4>
        <p className="capitalize mt-1">{report.category}</p>
      </div>

      <div>
        <h4 className="font-semibold text-sm text-gray-700">Reason</h4>
        <p className="mt-1">{report.reason}</p>
      </div>

      <div>
        <h4 className="font-semibold text-sm text-gray-700">Reporter</h4>
        <p className="text-sm font-mono mt-1">{report.reporter_id}</p>
      </div>

      <div>
        <h4 className="font-semibold text-sm text-gray-700">Reported User</h4>
        <p className="text-sm font-mono mt-1">{report.reported_user_id}</p>
      </div>

      {report.evidence && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700">Evidence</h4>
          <p className="text-sm text-gray-600 mt-1">{report.evidence}</p>
        </div>
      )}

      <div>
        <h4 className="font-semibold text-sm text-gray-700">Submitted</h4>
        <p className="text-sm text-gray-600 mt-1">{formatRelativeTime(report.created_at)}</p>
      </div>

      <div>
        <h4 className="font-semibold text-sm text-gray-700">Status</h4>
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${
          report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          report.status === 'resolved' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {report.status}
        </span>
      </div>
    </div>
  )
}

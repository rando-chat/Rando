'use client'

import { use, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { DashboardLayout } from '@/components/admin/DashboardLayout'
import { ReportReview } from '@/components/admin/moderation/ReportReview'
import { ActionPanel } from '@/components/admin/moderation/ActionPanel'
import type { Database } from '@/lib/database.types'

type Report = Database['public']['Tables']['reports']['Row']

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [report, setReport] = useState<Report | null>(null)
  
  useEffect(() => { 
    supabase.from('reports')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => data && setReport(data)) 
  }, [id])
  
  const handleAction = async (action: Database['public']['Enums']['moderation_action']) => {
    await supabase
      .from('reports')
      .update({ 
        status: 'resolved' as const,
        action_taken: action,
        resolved_at: new Date().toISOString()
      })
      .eq('id', id)
    
    if (report) {
      setReport({ 
        ...report,
        status: 'resolved',
        action_taken: action,
        resolved_at: new Date().toISOString()
      })
    }
  }
  
  if (!report) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading report...</div>
        </div>
      </DashboardLayout>
    )
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Report Review</h1>
        <div className="grid md:grid-cols-2 gap-6">
          <ReportReview report={report} />
          <ActionPanel 
            onAction={handleAction} 
            currentAction={report.action_taken}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}

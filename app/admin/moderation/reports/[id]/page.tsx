'use client'
import { use, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { DashboardLayout } from '@/components/admin/DashboardLayout'
import { ReportReview } from '@/components/admin/moderation/ReportReview'
import { ActionPanel } from '@/components/admin/moderation/ActionPanel'

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [report, setReport] = useState<any>(null)
  
  useEffect(() => { 
    supabase.from('reports').select('*').eq('id', id).single().then(({ data }) => data && setReport(data)) 
  }, [id])
  
  const handleAction = async (action: string) => {
    // Cast to 'unknown' first, then to the expected type
    const updateData = {
      status: 'resolved',
      action_taken: action,
      resolved_at: new Date().toISOString()
    } as unknown as never // This bypasses the type error
    
    const { error } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', id)
    
    if (error) {
      console.error('Failed to update report:', error)
      return
    }
    
    if (report) {
      setReport({ 
        ...report, 
        status: 'resolved',
        action_taken: action,
        resolved_at: new Date().toISOString()
      })
    }
  }
  
  if (!report) return (
    <DashboardLayout>
      <div>Loading...</div>
    </DashboardLayout>
  )
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Report Review</h1>
        <div className="grid md:grid-cols-2 gap-6">
          <ReportReview report={report} />
          <ActionPanel onAction={handleAction} />
        </div>
      </div>
    </DashboardLayout>
  )
}

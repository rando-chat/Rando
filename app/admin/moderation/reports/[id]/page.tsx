'use client'
import { use, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { DashboardLayout } from '@/components/admin/DashboardLayout'
import { ReportReview } from '@/components/admin/moderation/ReportReview'
import { ActionPanel } from '@/components/admin/moderation/ActionPanel'

// Simple interface matching your database columns
interface Report {
  id: string
  reporter_id: string
  reporter_is_guest: boolean
  reported_user_id: string
  reported_user_is_guest: boolean
  session_id: string | null
  reason: string
  category: string
  evidence: string | null
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  priority: number
  reviewed_by: string | null
  review_notes: string | null
  action_taken: 'warn' | 'mute' | 'ban_temporary' | 'ban_permanent' | 'escalate' | null
  action_details: any | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [report, setReport] = useState<Report | null>(null)
  
  useEffect(() => { 
    supabase.from('reports').select('*').eq('id', id).single().then(({ data }) => data && setReport(data)) 
  }, [id])
  
  const handleAction = async (action: Report['action_taken']) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ 
          status: 'resolved', 
          action_taken: action,
          resolved_at: new Date().toISOString()
        })
        .eq('id', id)
      
      if (error) throw error
      
      if (report) {
        setReport({ 
          ...report, 
          status: 'resolved', 
          action_taken: action,
          resolved_at: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Failed to update report:', error)
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

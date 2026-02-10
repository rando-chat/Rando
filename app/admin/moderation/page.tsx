'use client'
import { DashboardLayout } from '@/components/admin/DashboardLayout'
import { ReportsQueue } from '@/components/admin/moderation/ReportsQueue'
import { ContentReview } from '@/components/admin/moderation/ContentReview'
export default function AdminModerationPage() {
  return <DashboardLayout><div className="space-y-6"><h1 className="text-3xl font-bold">Moderation</h1><ReportsQueue /><ContentReview /></div></DashboardLayout>
}

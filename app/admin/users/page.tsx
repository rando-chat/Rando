'use client'
import { DashboardLayout } from '@/components/admin/DashboardLayout'
import { UsersTable } from '@/components/admin/users/UsersTable'
export default function AdminUsersPage() {
  return <DashboardLayout><div><h1 className="text-3xl font-bold mb-6">User Management</h1><UsersTable /></div></DashboardLayout>
}

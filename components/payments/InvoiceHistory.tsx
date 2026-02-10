'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import { formatRelativeTime } from '@/lib/utils'
import { Download } from 'lucide-react'

export function InvoiceHistory() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => data && setInvoices(data))
    }
  }, [user])

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h3 className="text-xl font-bold">Invoice History</h3>
      </div>
      
      {invoices.length === 0 ? (
        <div className="px-6 py-8 text-center text-gray-600">
          No invoices yet
        </div>
      ) : (
        <div className="divide-y">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium capitalize">{invoice.tier} Plan</p>
                <p className="text-sm text-gray-600">{formatRelativeTime(invoice.created_at)}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold">${invoice.tier === 'student' ? '4.99' : '9.99'}</span>
                <button className="text-purple-600 hover:underline flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

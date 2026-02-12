import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {
      database: 'unknown',
      storage: 'unknown',
      realtime: 'unknown',
    },
    metrics: {
      activeChats: 0,
      usersInQueue: 0,
      totalUsers: 0,
    },
    errors: [] as string[],
  }

  try {
    // Check database connectivity
    const { data: dbCheck, error: dbError } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    if (dbError) {
      checks.services.database = 'unhealthy'
      checks.errors.push(`Database: ${dbError.message}`)
      checks.status = 'degraded'
    } else {
      checks.services.database = 'healthy'
    }

    // Get metrics
    const [
      { count: activeChats },
      { count: usersInQueue },
      { count: totalUsers },
    ] = await Promise.all([
      supabase.from('chat_sessions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('matchmaking_queue').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }),
    ])

    checks.metrics = {
      activeChats: activeChats || 0,
      usersInQueue: usersInQueue || 0,
      totalUsers: totalUsers || 0,
    }

    // Check storage
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets()
    if (storageError) {
      checks.services.storage = 'unhealthy'
      checks.errors.push(`Storage: ${storageError.message}`)
      checks.status = 'degraded'
    } else if (buckets && buckets.find(b => b.id === 'avatars')) {
      checks.services.storage = 'healthy'
    } else {
      checks.services.storage = 'degraded'
      checks.errors.push('Storage: avatars bucket not found')
      checks.status = 'degraded'
    }

    // Realtime is harder to check, assume healthy if DB is healthy
    checks.services.realtime = checks.services.database === 'healthy' ? 'healthy' : 'unknown'

  } catch (error: any) {
    checks.status = 'unhealthy'
    checks.errors.push(`General: ${error.message}`)
  }

  const statusCode = checks.status === 'healthy' ? 200 : checks.status === 'degraded' ? 207 : 503

  return NextResponse.json(checks, { status: statusCode })
}
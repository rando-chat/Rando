/**
 * useSupabase Hook
 * 
 * Provides typed Supabase client with helper methods
 */

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

import type { PostgrestError } from '@supabase/supabase-js'

export function useSupabase() {
  return supabase
}

/**
 * Hook for handling Supabase queries with loading/error states
 */
export function useSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<PostgrestError | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        setIsLoading(true)
        const result = await queryFn()
        
        if (!cancelled) {
          setData(result.data)
          setError(result.error)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as PostgrestError)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [])

  return { data, error, isLoading }
}

/**
 * Hook for Supabase mutations with loading/error states
 */
export function useSupabaseMutation<T, Args extends any[]>(
  mutationFn: (...args: Args) => Promise<{ data: T | null; error: PostgrestError | null }>
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<PostgrestError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mutate = async (...args: Args) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await mutationFn(...args)
      
      setData(result.data)
      setError(result.error)
      
      return result
    } catch (err) {
      const error = err as PostgrestError
      setError(error)
      return { data: null, error }
    } finally {
      setIsLoading(false)
    }
  }

  return { mutate, data, error, isLoading }
}

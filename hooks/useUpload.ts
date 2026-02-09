import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
export function useUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const upload = async (file: File, bucket: string = 'avatars'): Promise<string | null> => {
    setIsUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const { data, error } = await supabase.storage.from(bucket).upload(fileName, file)
    setIsUploading(false)
    if (error) return null
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName)
    return publicUrl
  }
  return { upload, isUploading }
}

'use client'

import { useState, useRef } from 'react'
import { Upload, User, Loader2 } from 'lucide-react'
import { useUpload } from '@/hooks/useUpload'

export function AvatarUploader({ currentUrl, onUpload }: { currentUrl?: string | null; onUpload: (url: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { upload, isUploading } = useUpload()
  const [preview, setPreview] = useState(currentUrl)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload
    const url = await upload(file, 'avatars')
    if (url) {
      onUpload(url)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        {preview ? (
          <img
            src={preview}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-200">
            <User className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </div>

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Photo
        </button>
        <p className="text-xs text-gray-500 mt-1">
          JPG, PNG or GIF. Max 5MB.
        </p>
      </div>
    </div>
  )
}

import { supabase } from './client';

export async function uploadImage(file: File, userId: string): Promise<{ url: string; path: string } | null> {
  try {
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = `chat-images/${fileName}`;

    const { data, error } = await supabase.storage
      .from('chat-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('chat-images')
      .getPublicUrl(filePath);

    return {
      url: publicUrl,
      path: filePath,
    };
  } catch (error: any) {
    console.error('Upload error:', error);
    return null;
  }
}

export async function deleteImage(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('chat-images')
      .remove([filePath]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

export async function getStorageUsage(userId: string): Promise<number> {
  try {
    const { data: files } = await supabase.storage
      .from('chat-images')
      .list(userId);

    let totalSize = 0;
    if (files) {
      for (const file of files) {
        totalSize += file.metadata?.size || 0;
      }
    }

    return totalSize;
  } catch (error) {
    console.error('Storage usage error:', error);
    return 0;
  }
}

export function getPublicImageUrl(filePath: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from('chat-images')
    .getPublicUrl(filePath);
  return publicUrl;
}
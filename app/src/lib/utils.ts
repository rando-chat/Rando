// app/src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format time
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Format date relative
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - d.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Generate random color for avatars
export function getRandomColor(): string {
  const colors = [
    'bg-gradient-to-r from-rando-purple to-rando-purple-700',
    'bg-gradient-to-r from-rando-gold to-rando-gold-600',
    'bg-gradient-to-r from-rando-coral to-rando-coral-600',
    'bg-gradient-to-r from-blue-600 to-purple-600',
    'bg-gradient-to-r from-emerald-600 to-teal-600',
    'bg-gradient-to-r from-pink-600 to-rose-600',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Get initials for avatar
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Calculate match percentage
export function calculateMatchPercentage(user1Interests: string[], user2Interests: string[]): number {
  if (!user1Interests.length || !user2Interests.length) return 50;
  
  const commonInterests = user1Interests.filter(interest => 
    user2Interests.includes(interest)
  );
  
  const maxInterests = Math.max(user1Interests.length, user2Interests.length);
  return Math.round((commonInterests.length / maxInterests) * 100);
}

// Safe localStorage access
export function safeLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('LocalStorage error:', error);
    return defaultValue;
  }
}
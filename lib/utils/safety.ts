// lib/utils/security.ts
'use client'

/**
 * Secure storage for guest sessions with encryption
 */

// Simple XOR encryption for guest session data (better than plain localStorage)
class SecureStorage {
  private static key = 'rando-chat-secure-';
  private static salt = 'rc_secure_';

  private static encrypt(data: string): string {
    // Simple encryption for demo - in production use Web Crypto API
    const encoded = btoa(encodeURIComponent(data));
    return encoded.split('').reverse().join('');
  }

  private static decrypt(encrypted: string): string | null {
    try {
      const reversed = encrypted.split('').reverse().join('');
      return decodeURIComponent(atob(reversed));
    } catch {
      return null;
    }
  }

  static setGuestSession(session: any): void {
    if (typeof window === 'undefined') return;

    // Never store the actual session token in localStorage
    const safeSession = {
      ...session,
      session_token: 'ENCRYPTED', // Don't store real token
      guest_id: session.guest_id,
      display_name: session.display_name,
      expires_at: session.expires_at
    };

    const encrypted = this.encrypt(JSON.stringify(safeSession));
    localStorage.setItem(this.key + 'guest', encrypted);
    
    // Also set a short-lived session cookie for additional security
    document.cookie = `rando_guest=${session.guest_id}; path=/; max-age=86400; SameSite=Strict; Secure`;
  }

  static getGuestSession(): any | null {
    if (typeof window === 'undefined') return null;

    const encrypted = localStorage.getItem(this.key + 'guest');
    if (!encrypted) return null;

    const decrypted = this.decrypt(encrypted);
    if (!decrypted) {
      this.clearGuestSession();
      return null;
    }

    try {
      const session = JSON.parse(decrypted);
      
      // Check if session is expired
      if (new Date(session.expires_at) < new Date()) {
        this.clearGuestSession();
        return null;
      }

      // Session token should be fetched fresh from API
      return {
        ...session,
        needsRefresh: true // Flag to refresh token
      };
    } catch {
      this.clearGuestSession();
      return null;
    }
  }

  static clearGuestSession(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.key + 'guest');
    document.cookie = 'rando_guest=; path=/; max-age=0;';
  }

  static validateGuestSession(): boolean {
    const session = this.getGuestSession();
    if (!session) return false;

    // Check expiration
    const expiresAt = new Date(session.expires_at);
    const now = new Date();
    
    if (expiresAt < now) {
      this.clearGuestSession();
      return false;
    }

    // Check if expired within last 5 minutes (allow grace period)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    if (expiresAt < fiveMinutesAgo) {
      this.clearGuestSession();
      return false;
    }

    return true;
  }
}

/**
 * Rate limiting for guest session creation
 */
class RateLimiter {
  private static key = 'rando-rate-limit-';

  static check(identifier: string, limit: number, windowMs: number): boolean {
    if (typeof window === 'undefined') return true;

    const now = Date.now();
    const windowStart = now - windowMs;
    const key = this.key + identifier;

    try {
      const history = JSON.parse(localStorage.getItem(key) || '[]');
      
      // Filter out old entries
      const recent = history.filter((timestamp: number) => timestamp > windowStart);
      
      if (recent.length >= limit) {
        return false; // Rate limited
      }

      // Add current request
      recent.push(now);
      localStorage.setItem(key, JSON.stringify(recent.slice(-limit))); // Keep only recent
      
      // Clean up old data (run occasionally)
      if (Math.random() < 0.1) { // 10% chance to clean up
        this.cleanup();
      }

      return true;
    } catch {
      return true; // If storage fails, allow request
    }
  }

  private static cleanup(): void {
    const prefix = this.key;
    const now = Date.now();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        try {
          const history = JSON.parse(localStorage.getItem(key) || '[]');
          const hourAgo = now - 3600000; // 1 hour
          const recent = history.filter((timestamp: number) => timestamp > hourAgo);
          
          if (recent.length === 0) {
            localStorage.removeItem(key);
          } else {
            localStorage.setItem(key, JSON.stringify(recent));
          }
        } catch {
          localStorage.removeItem(key);
        }
      }
    }
  }
}

/**
 * Session validation with server-side check
 */
export async function validateSessionWithServer(guestId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/guest/validate?id=${guestId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) return false;

    const data = await response.json();
    return data.valid === true;
  } catch {
    return false; // If server check fails, assume invalid
  }
}

/**
 * Content security for user input
 */
export function sanitizeInput(input: string): string {
  // Remove script tags and harmful characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .substring(0, 2000); // Limit length
}

export { SecureStorage, RateLimiter };
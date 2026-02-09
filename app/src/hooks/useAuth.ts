import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import * as authService from '@/lib/supabase/auth';
import { User } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async () => {
      await checkUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkUser() {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function signUp(email: string, password: string, username: string) {
    const result = await authService.signUp(email, password, username);
    if (result.success) {
      await checkUser();
    }
    return result;
  }

  async function signIn(email: string, password: string) {
    const result = await authService.signIn(email, password);
    if (result.success) {
      await checkUser();
    }
    return result;
  }

  async function signOut() {
    const result = await authService.signOut();
    if (result.success) {
      setUser(null);
    }
    return result;
  }

  async function updateProfile(updates: Partial<User>) {
    if (!user) return { success: false, error: 'Not authenticated' };
    return authService.updateUserProfile(user.id, updates);
  }

  async function refreshSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await checkUser();
    }
  }

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshSession,
  };
}
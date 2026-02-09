import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User } from '@/types';

export function useSupabase() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      setUser(data as User);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  return {
    user,
    loading,
    refreshUser: () => user && fetchUserProfile(user.id),
  };
}
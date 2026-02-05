import { supabase } from './client';
import { User } from '@/types';

export async function signUp(email: string, password: string, username: string) {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (authError) throw authError;

    if (authData.user) {
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          username,
          tier: 'free',
          age_verified: false,
          preferences: {},
        });

      if (profileError) throw profileError;

      // Track signup event
      await trackAnalytics('sign_up', {
        email,
        username,
        method: 'email',
      });

      return { success: true, user: authData.user };
    }

    return { success: false, error: 'User creation failed' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      // Update last seen
      await supabase
        .from('users')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', data.user.id);

      // Track login event
      await trackAnalytics('login', {
        email,
        method: 'email',
      });

      return { success: true, user: data.user };
    }

    return { success: false, error: 'Login failed' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    await trackAnalytics('logout', {});
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user: authUser }, error } = await supabase.auth.getUser();
    
    if (error || !authUser) return null;

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (userError) return null;

    return userData as User;
  } catch {
    return null;
  }
}

export async function updateUserProfile(userId: string, updates: Partial<User>) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    await trackAnalytics('profile_updated', {
      userId,
      updates: Object.keys(updates),
    });

    return { success: true, user: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function trackAnalytics(eventName: string, properties: Record<string, any>) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase
      .from('analytics_events')
      .insert({
        user_id: user?.id,
        event_name: eventName,
        properties,
        created_at: new Date().toISOString(),
      });

    // Also send to Google Analytics if configured
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, properties);
    }
  } catch (error) {
    console.error('Analytics tracking failed:', error);
  }
}
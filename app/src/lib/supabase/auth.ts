import { supabase } from './client';
import { User } from '@/types';

export async function signUp(email: string, password: string, username: string) {
  try {
    // 1. First create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
      },
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      throw authError;
    }

    // 2. Wait a moment for auth to propagate (CRITICAL for RLS)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Get session to ensure auth is ready
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!authData.user || !session) {
      throw new Error('User creation failed - no user or session returned');
    }

    // 4. Now insert into users table with explicit auth header
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        username,
        tier: 'free',
        age_verified: false,
        email_verified: false,
        preferences: {},
        created_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('Profile insertion error:', profileError);
      
      // If profile insertion fails due to RLS, add debug info
      if (profileError.message.includes('row-level security') || profileError.code === '42501') {
        console.log('RLS Error - User ID:', authData.user.id, 'Session exists:', !!session);
        
        // Try with service role key as fallback
        const serviceResponse = await fetch('/api/auth/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: authData.user.id,
            email,
            username,
          }),
        });
        
        if (serviceResponse.ok) {
          console.log('User created via service role fallback');
        } else {
          throw new Error('RLS policy blocked user creation. Check RLS policies in Supabase.');
        }
      } else {
        throw profileError;
      }
    }

    // 5. Track analytics
    await trackAnalytics('sign_up', {
      email,
      username,
      method: 'email',
    });

    return { success: true, user: authData.user };
  } catch (error: any) {
    console.error('Complete signup error:', error);
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

    if (error || !authUser) {
      console.log('No authenticated user found');
      return null;
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (userError) {
      console.error('Error fetching user profile:', userError);
      return null;
    }

    return userData as User;
  } catch (error: any) {
    console.error('Error in getCurrentUser:', error);
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

// NEW: Emergency user creation endpoint (for RLS issues)
export async function createUserViaServiceRole(userId: string, email: string, username: string) {
  try {
    const response = await fetch('/api/auth/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, email, username }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Service role creation failed:', error);
    return false;
  }
}
export interface User {
  id: string;
  email: string;
  username: string;
  tier: 'free' | 'premium' | 'student';
  age_verified: boolean;
  email_verified: boolean;
  preferences: Record<string, any>;
  stripe_customer_id?: string;
  subscription_status?: string;
  banned?: boolean;
  ban_reason?: string;
  banned_at?: string;
  created_at: string;
  last_seen?: string;
  updated_at?: string;
}

// Add GuestUser interface for anonymous users
export interface GuestUser {
  id: string;
  username: string;
  // No other properties needed for guests
}

export interface ChatSession {
  id: string;
  user1_id: string;
  user2_id: string;
  session_type: 'text' | 'video';
  started_at: string;
  ended_at?: string;
  user1?: User;
  user2?: User;
  // ADDED FOR GUEST SUPPORT
  is_guest1?: boolean;
  is_guest2?: boolean;
  total_messages?: number;
}

export interface Message {
  id: string;
  session_id: string;
  sender_id: string;
  content: string;
  content_type: 'text' | 'image';
  moderated: boolean;
  created_at: string;
  // UPDATED: Accept both User and GuestUser
  sender?: User | GuestUser;
  // ADDED FOR GUEST SUPPORT
  is_guest?: boolean;
  sender_name?: string;
}

export interface MatchmakingQueue {
  user_id: string;
  tier: string;
  interests: string[];
  looking_for: 'text' | 'video';
  entered_at: string;
  user?: User;
  // ADDED FOR GUEST SUPPORT
  is_guest?: boolean;
  username?: string;
}

// ... rest of interfaces remain the same
export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  session_id: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
}

export interface EmailVerification {
  id: string;
  email: string;
  code: string;
  verified: boolean;
  expires_at: string;
  created_at: string;
}

export interface StudentVerification {
  id: string;
  user_id: string;
  email: string;
  code: string;
  verified: boolean;
  verified_at?: string;
  expires_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  lemon_squeezy_id?: string;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  user_id?: string;
  event_name: string;
  properties: Record<string, any>;
  created_at: string;
}

export type Tier = 'free' | 'premium' | 'student';
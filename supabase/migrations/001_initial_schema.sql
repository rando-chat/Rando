-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase Auth)
CREATE TABLE users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  tier VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'student')),
  age_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  preferences JSONB DEFAULT '{}',
  stripe_customer_id TEXT,
  subscription_status VARCHAR(20),
  banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  banned_at TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat sessions
CREATE TABLE chat_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_type VARCHAR(10) DEFAULT 'text' CHECK (session_type IN ('text', 'video')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  CONSTRAINT users_different CHECK (user1_id != user2_id)
);

-- Real-time messages
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  content_type VARCHAR(20) DEFAULT 'text' CHECK (content_type IN ('text', 'image')),
  moderated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matchmaking queue
CREATE TABLE matchmaking_queue (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  tier VARCHAR(20),
  interests TEXT[] DEFAULT '{}',
  looking_for VARCHAR(10) DEFAULT 'text' CHECK (looking_for IN ('text', 'video')),
  entered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports
CREATE TABLE reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  reason VARCHAR(50) NOT NULL,
  details TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email verifications
CREATE TABLE email_verifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student verifications
CREATE TABLE student_verifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checkout sessions
CREATE TABLE checkout_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('premium', 'student')),
  checkout_url TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Analytics events
CREATE TABLE analytics_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_name VARCHAR(100) NOT NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_chat_sessions_user1_id ON chat_sessions(user1_id);
CREATE INDEX idx_chat_sessions_user2_id ON chat_sessions(user2_id);
CREATE INDEX idx_matchmaking_queue_entered_at ON matchmaking_queue(entered_at);
CREATE INDEX idx_reports_reported_user_id ON reports(reported_user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_email_verifications_email ON email_verifications(email);
CREATE INDEX idx_email_verifications_expires_at ON email_verifications(expires_at);
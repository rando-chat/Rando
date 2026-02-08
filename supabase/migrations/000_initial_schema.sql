-- Initial Production Schema for Rando Chat
-- Safe to run on existing database (idempotent)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create enum types
DO $$ BEGIN
    CREATE TYPE user_tier AS ENUM ('free', 'student', 'premium', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('waiting', 'active', 'ended', 'reported', 'banned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE moderation_action AS ENUM ('warn', 'mute', 'ban_temporary', 'ban_permanent', 'escalate');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT 'Anonymous',
    original_display_name TEXT, -- For tracking name changes
    tier user_tier NOT NULL DEFAULT 'free',
    interests TEXT[] DEFAULT '{}',
    bio TEXT,
    avatar_url TEXT,
    location TEXT,
    age INTEGER CHECK (age >= 13 AND age <= 120),
    email_verified BOOLEAN DEFAULT false,
    student_email TEXT,
    student_email_verified BOOLEAN DEFAULT false,
    is_banned BOOLEAN DEFAULT false,
    ban_reason TEXT,
    ban_expires_at TIMESTAMPTZ,
    report_count INTEGER DEFAULT 0,
    last_report_at TIMESTAMPTZ,
    match_count INTEGER DEFAULT 0,
    total_chat_time INTERVAL DEFAULT '0 seconds',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_display_name 
        CHECK (length(display_name) BETWEEN 1 AND 32),
    CONSTRAINT valid_bio 
        CHECK (bio IS NULL OR length(bio) <= 500),
    CONSTRAINT valid_student_email 
        CHECK (student_email IS NULL OR student_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Guest sessions for anonymous users
CREATE TABLE IF NOT EXISTS public.guest_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    country_code CHAR(2),
    is_banned BOOLEAN DEFAULT false,
    ban_reason TEXT,
    report_count INTEGER DEFAULT 0,
    match_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
    
    CONSTRAINT valid_guest_display_name 
        CHECK (length(display_name) BETWEEN 1 AND 32)
);

-- Chat sessions
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID, -- Can be user or guest
    user2_id UUID, -- Can be user or guest
    user1_is_guest BOOLEAN DEFAULT false,
    user2_is_guest BOOLEAN DEFAULT false,
    user1_display_name TEXT NOT NULL,
    user2_display_name TEXT NOT NULL,
    status session_status DEFAULT 'active',
    shared_interests TEXT[] DEFAULT '{}',
    match_score INTEGER, -- How good the match is (0-100)
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    ended_by UUID,
    end_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_user_combo 
        CHECK (
            (user1_id IS NOT NULL AND user2_id IS NOT NULL) OR
            (user1_is_guest = true OR user2_is_guest = true)
        ),
    CONSTRAINT no_self_chat 
        CHECK (user1_id != user2_id OR user1_is_guest != user2_is_guest)
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    sender_id UUID, -- Can be user or guest ID
    sender_is_guest BOOLEAN DEFAULT false,
    sender_display_name TEXT NOT NULL,
    content TEXT NOT NULL,
    content_hash TEXT, -- For duplicate detection
    is_safe BOOLEAN DEFAULT true,
    moderation_score DECIMAL(3,2), -- 0.00-1.00 safety score
    moderated_by TEXT, -- 'system', 'ai', 'admin'
    flagged_reason TEXT,
    edited BOOLEAN DEFAULT false,
    original_content TEXT,
    read_by_recipient BOOLEAN DEFAULT false,
    delivered BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_message_length 
        CHECK (length(content) BETWEEN 1 AND 2000)
);

-- Matchmaking queue with improved algorithm
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- Can be user or guest
    is_guest BOOLEAN DEFAULT false,
    display_name TEXT NOT NULL,
    tier user_tier NOT NULL DEFAULT 'free',
    interests TEXT[] DEFAULT '{}',
    language_preference TEXT DEFAULT 'en',
    looking_for TEXT[] DEFAULT '{"text"}',
    match_preferences JSONB DEFAULT '{"min_age": 18, "max_age": 99}',
    queue_score INTEGER DEFAULT 50, -- Dynamic score for matching priority
    entered_at TIMESTAMPTZ DEFAULT NOW(),
    last_ping_at TIMESTAMPTZ DEFAULT NOW(),
    estimated_wait_time INTEGER, -- in seconds
    matched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT active_queue 
        CHECK (matched_at IS NULL OR entered_at < matched_at)
);

-- User reports with cooldown
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL, -- Can be user or guest
    reporter_is_guest BOOLEAN DEFAULT false,
    reported_user_id UUID NOT NULL, -- Can be user or guest
    reported_user_is_guest BOOLEAN DEFAULT false,
    session_id UUID REFERENCES public.chat_sessions(id),
    reason TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'harassment', 'hate_speech', 'spam', 
        'inappropriate_content', 'underage', 
        'sharing_personal_info', 'threats', 'other'
    )),
    evidence TEXT, -- JSON with message IDs or screenshots
    status report_status DEFAULT 'pending',
    priority INTEGER DEFAULT 1, -- 1=low, 2=medium, 3=high, 4=critical
    reviewed_by UUID REFERENCES public.users(id),
    review_notes TEXT,
    action_taken moderation_action,
    action_details JSONB,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT no_self_report 
        CHECK (reporter_id != reported_user_id OR reporter_is_guest != reported_user_is_guest),
    CONSTRAINT valid_reason_length 
        CHECK (length(reason) BETWEEN 10 AND 1000)
);

-- Audit log for security and compliance
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_is_guest BOOLEAN DEFAULT false,
    action_type TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB NOT NULL,
    ip_address INET,
    user_agent TEXT,
    country_code CHAR(2),
    severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content moderation rules
CREATE TABLE IF NOT EXISTS public.moderation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_type TEXT NOT NULL CHECK (rule_type IN ('keyword', 'pattern', 'regex', 'ai_model')),
    name TEXT NOT NULL UNIQUE,
    pattern TEXT NOT NULL,
    action moderation_action NOT NULL,
    severity INTEGER DEFAULT 1,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    applies_to TEXT[] DEFAULT '{"messages", "display_names", "bio"}',
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Banned patterns (URLs, emails, phone numbers)
CREATE TABLE IF NOT EXISTS public.banned_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern TEXT NOT NULL UNIQUE,
    pattern_type TEXT NOT NULL CHECK (pattern_type IN ('url', 'email', 'phone', 'custom')),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription/payment records
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tier user_tier NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('stripe', 'lemon_squeezy')),
    provider_subscription_id TEXT NOT NULL UNIQUE,
    provider_customer_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    user_id UUID,
    user_is_guest BOOLEAN DEFAULT false,
    session_id UUID,
    properties JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_tier ON public.users(tier);
CREATE INDEX IF NOT EXISTS idx_users_banned ON public.users(is_banned) WHERE is_banned = true;
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON public.users(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON public.chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_users ON public.chat_sessions(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_session ON public.messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id, created_at);
CREATE INDEX IF NOT EXISTS idx_matchmaking_active ON public.matchmaking_queue(entered_at) WHERE matched_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_matchmaking_tier ON public.matchmaking_queue(tier, entered_at);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON public.reports(reported_user_id, reported_user_is_guest);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_expires ON public.guest_sessions(expires_at) WHERE expires_at < NOW();

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
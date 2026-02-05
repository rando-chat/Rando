-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- Chat sessions policies
CREATE POLICY "Users can view their own chat sessions"
ON chat_sessions FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can insert their own chat sessions"
ON chat_sessions FOR INSERT
WITH CHECK (auth.uid() = user1_id);

-- Messages policies
CREATE POLICY "Users can view messages in their sessions"
ON messages FOR SELECT
USING (
  session_id IN (
    SELECT id FROM chat_sessions 
    WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own messages"
ON messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Matchmaking queue policies
CREATE POLICY "Users can view matchmaking queue"
ON matchmaking_queue FOR SELECT
USING (true);

CREATE POLICY "Users can manage their own queue entry"
ON matchmaking_queue FOR ALL
USING (auth.uid() = user_id);

-- Reports policies
CREATE POLICY "Users can create reports"
ON reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
ON reports FOR SELECT
USING (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.email = 'admin@example.com'
));

-- Email verifications policies
CREATE POLICY "Users can verify their own email"
ON email_verifications FOR ALL
USING (email = auth.email());

-- Student verifications policies
CREATE POLICY "Users can manage their own student verification"
ON student_verifications FOR ALL
USING (auth.uid() = user_id);

-- Checkout sessions policies
CREATE POLICY "Users can manage their own checkout sessions"
ON checkout_sessions FOR ALL
USING (auth.uid() = user_id);

-- Analytics events policies
CREATE POLICY "Users can view their own analytics"
ON analytics_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert analytics events"
ON analytics_events FOR INSERT
WITH CHECK (true);

-- Service role bypass (for server-side operations)
CREATE POLICY "Service role can do everything"
ON ALL TABLES FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');
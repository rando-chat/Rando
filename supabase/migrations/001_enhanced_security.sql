-- Enhanced Security Policies for Rando Chat
-- Run after initial schema

-- RLS Policies for users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users u2 
            WHERE u2.id = auth.uid() 
            AND u2.tier = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can update users" ON public.users;
CREATE POLICY "Admins can update users"
    ON public.users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users u2 
            WHERE u2.id = auth.uid() 
            AND u2.tier = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u2 
            WHERE u2.id = auth.uid() 
            AND u2.tier = 'admin'
        )
    );

-- RLS Policies for guest_sessions
DROP POLICY IF EXISTS "Guests can view own session" ON public.guest_sessions;
CREATE POLICY "Guests can view own session"
    ON public.guest_sessions FOR SELECT
    USING (session_token = current_setting('request.jwt.claims', true)::json->>'session_token');

DROP POLICY IF EXISTS "System can create guest sessions" ON public.guest_sessions;
CREATE POLICY "System can create guest sessions"
    ON public.guest_sessions FOR INSERT
    WITH CHECK (true);

-- RLS Policies for chat_sessions
DROP POLICY IF EXISTS "Users can view their chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can view their chat sessions"
    ON public.chat_sessions FOR SELECT
    USING (
        -- User is participant
        (user1_id = auth.uid() AND NOT user1_is_guest) OR
        (user2_id = auth.uid() AND NOT user2_is_guest) OR
        -- Guest session token matches
        (user1_is_guest AND EXISTS (
            SELECT 1 FROM public.guest_sessions g 
            WHERE g.id = user1_id 
            AND g.session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
        )) OR
        (user2_is_guest AND EXISTS (
            SELECT 1 FROM public.guest_sessions g 
            WHERE g.id = user2_id 
            AND g.session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
        )) OR
        -- Admin access
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.tier = 'admin'
        )
    );

DROP POLICY IF EXISTS "System can create chat sessions" ON public.chat_sessions;
CREATE POLICY "System can create chat sessions"
    ON public.chat_sessions FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "System can update chat sessions" ON public.chat_sessions;
CREATE POLICY "System can update chat sessions"
    ON public.chat_sessions FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- RLS Policies for messages
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
CREATE POLICY "Users can view messages in their chats"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions cs
            WHERE cs.id = session_id
            AND (
                -- User is participant
                (cs.user1_id = auth.uid() AND NOT cs.user1_is_guest) OR
                (cs.user2_id = auth.uid() AND NOT cs.user2_is_guest) OR
                -- Guest session
                (cs.user1_is_guest AND EXISTS (
                    SELECT 1 FROM public.guest_sessions g 
                    WHERE g.id = cs.user1_id 
                    AND g.session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
                )) OR
                (cs.user2_is_guest AND EXISTS (
                    SELECT 1 FROM public.guest_sessions g 
                    WHERE g.id = cs.user2_id 
                    AND g.session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
                )) OR
                -- Admin access
                EXISTS (
                    SELECT 1 FROM public.users u 
                    WHERE u.id = auth.uid() 
                    AND u.tier = 'admin'
                )
            )
        )
    );

DROP POLICY IF EXISTS "Users can insert messages in active chats" ON public.messages;
CREATE POLICY "Users can insert messages in active chats"
    ON public.messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_sessions cs
            WHERE cs.id = session_id
            AND cs.status = 'active'
            AND (
                (sender_id = auth.uid() AND NOT sender_is_guest) OR
                (sender_is_guest AND EXISTS (
                    SELECT 1 FROM public.guest_sessions g 
                    WHERE g.id = sender_id 
                    AND g.session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
                ))
            )
        )
        AND is_safe = true -- Only safe messages can be inserted
    );

DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages"
    ON public.messages FOR UPDATE
    USING (
        (sender_id = auth.uid() AND NOT sender_is_guest) OR
        (sender_is_guest AND EXISTS (
            SELECT 1 FROM public.guest_sessions g 
            WHERE g.id = sender_id 
            AND g.session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
        ))
    )
    WITH CHECK (
        (sender_id = auth.uid() AND NOT sender_is_guest) OR
        (sender_is_guest AND EXISTS (
            SELECT 1 FROM public.guest_sessions g 
            WHERE g.id = sender_id 
            AND g.session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
        ))
    );

-- RLS Policies for matchmaking_queue
DROP POLICY IF EXISTS "Users can view own queue position" ON public.matchmaking_queue;
CREATE POLICY "Users can view own queue position"
    ON public.matchmaking_queue FOR SELECT
    USING (
        (user_id = auth.uid() AND NOT is_guest) OR
        (is_guest AND EXISTS (
            SELECT 1 FROM public.guest_sessions g 
            WHERE g.id = user_id 
            AND g.session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
        ))
    );

DROP POLICY IF EXISTS "Users can join queue" ON public.matchmaking_queue;
CREATE POLICY "Users can join queue"
    ON public.matchmaking_queue FOR INSERT
    WITH CHECK (
        (user_id = auth.uid() AND NOT is_guest) OR
        (is_guest AND EXISTS (
            SELECT 1 FROM public.guest_sessions g 
            WHERE g.id = user_id 
            AND g.session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
        ))
    );

DROP POLICY IF EXISTS "Users can leave queue" ON public.matchmaking_queue;
CREATE POLICY "Users can leave queue"
    ON public.matchmaking_queue FOR DELETE
    USING (
        (user_id = auth.uid() AND NOT is_guest) OR
        (is_guest AND EXISTS (
            SELECT 1 FROM public.guest_sessions g 
            WHERE g.id = user_id 
            AND g.session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
        ))
    );

DROP POLICY IF EXISTS "System can update queue" ON public.matchmaking_queue;
CREATE POLICY "System can update queue"
    ON public.matchmaking_queue FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- RLS Policies for reports
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports"
    ON public.reports FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
CREATE POLICY "Users can view own reports"
    ON public.reports FOR SELECT
    USING (
        (reporter_id = auth.uid() AND NOT reporter_is_guest) OR
        (reporter_is_guest AND EXISTS (
            SELECT 1 FROM public.guest_sessions g 
            WHERE g.id = reporter_id 
            AND g.session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
        )) OR
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.tier = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can manage reports" ON public.reports;
CREATE POLICY "Admins can manage reports"
    ON public.reports FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.tier = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.tier = 'admin'
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moderation_rules_updated_at
    BEFORE UPDATE ON public.moderation_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create audit log trigger function
CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
    user_id_val UUID;
    user_is_guest_val BOOLEAN;
    action_text TEXT;
BEGIN
    action_text := TG_OP;
    
    -- Determine user info
    IF TG_TABLE_NAME = 'guest_sessions' THEN
        user_id_val := NEW.id;
        user_is_guest_val := true;
    ELSIF TG_TABLE_NAME = 'users' AND TG_OP = 'INSERT' THEN
        user_id_val := NEW.id;
        user_is_guest_val := false;
    ELSE
        -- Try to get user from JWT
        user_id_val := auth.uid();
        user_is_guest_val := false;
        
        -- If no auth user, check for guest session
        IF user_id_val IS NULL THEN
            user_is_guest_val := true;
            -- Extract from JWT claims if available
            user_id_val := (current_setting('request.jwt.claims', true)::json->>'session_token')::UUID;
        END IF;
    END IF;
    
    INSERT INTO public.audit_log (
        user_id,
        user_is_guest,
        action_type,
        resource_type,
        resource_id,
        details,
        severity
    ) VALUES (
        user_id_val,
        user_is_guest_val,
        action_text,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        jsonb_build_object(
            'old', to_jsonb(OLD),
            'new', to_jsonb(NEW)
        ),
        CASE 
            WHEN TG_OP = 'DELETE' THEN 'warning'
            WHEN TG_TABLE_NAME = 'reports' THEN 'error'
            ELSE 'info'
        END
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create auto-ban trigger function
CREATE OR REPLACE FUNCTION auto_ban_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- If report is resolved as valid and user has 3+ reports, auto-ban
    IF NEW.status = 'resolved' AND NEW.action_taken IN ('warn', 'mute', 'ban_temporary', 'ban_permanent') THEN
        UPDATE public.users 
        SET 
            report_count = report_count + 1,
            last_report_at = NOW()
        WHERE id = NEW.reported_user_id 
        AND NOT reported_user_is_guest;
        
        -- Auto-ban after 3 valid reports
        UPDATE public.users 
        SET 
            is_banned = true,
            ban_reason = 'Auto-banned after 3+ valid reports',
            ban_expires_at = NOW() + INTERVAL '7 days'
        WHERE id = NEW.reported_user_id 
        AND NOT reported_user_is_guest
        AND report_count >= 3;
        
        -- For guests
        IF NEW.reported_user_is_guest THEN
            UPDATE public.guest_sessions 
            SET 
                report_count = report_count + 1,
                is_banned = CASE 
                    WHEN report_count >= 2 THEN true 
                    ELSE false 
                END,
                ban_reason = CASE 
                    WHEN report_count >= 2 THEN 'Auto-banned after multiple reports' 
                    ELSE ban_reason 
                END
            WHERE id = NEW.reported_user_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create message sanitizer function
CREATE OR REPLACE FUNCTION sanitize_message_content()
RETURNS TRIGGER AS $$
DECLARE
    safety_score DECIMAL(3,2);
    contains_url BOOLEAN;
    contains_email BOOLEAN;
    contains_phone BOOLEAN;
BEGIN
    -- Check for banned patterns
    SELECT EXISTS (
        SELECT 1 FROM public.banned_patterns 
        WHERE is_active = true 
        AND NEW.content ~* pattern
    ) INTO contains_url;
    
    -- Check for email patterns
    SELECT NEW.content ~* '\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b' 
    INTO contains_email;
    
    -- Check for phone patterns
    SELECT NEW.content ~* '\b(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b' 
    INTO contains_phone;
    
    -- Calculate safety score (simplified - in production, use AI/ML)
    safety_score := 1.0;
    
    IF contains_url THEN
        safety_score := safety_score - 0.5;
        NEW.is_safe := false;
        NEW.flagged_reason := 'Contains URL';
    END IF;
    
    IF contains_email OR contains_phone THEN
        safety_score := safety_score - 0.3;
        NEW.is_safe := false;
        NEW.flagged_reason := COALESCE(NEW.flagged_reason || ', ', '') || 
                             CASE 
                                 WHEN contains_email THEN 'Contains email'
                                 WHEN contains_phone THEN 'Contains phone number'
                             END;
    END IF;
    
    -- Check against keyword rules
    SELECT 1.0 - (COUNT(*) * 0.1) INTO safety_score
    FROM public.moderation_rules 
    WHERE is_active = true 
    AND rule_type = 'keyword'
    AND 'messages' = ANY(applies_to)
    AND NEW.content ~* pattern;
    
    NEW.moderation_score := safety_score;
    
    -- Auto-flag unsafe messages
    IF safety_score < 0.5 THEN
        NEW.is_safe := false;
        NEW.flagged_reason := COALESCE(NEW.flagged_reason || ', ', '') || 'Failed safety check';
        NEW.moderated_by := 'system';
    END IF;
    
    -- Generate content hash for duplicate detection
    NEW.content_hash := ENCODE(DIGEST(NEW.content, 'sha256'), 'hex');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS audit_users ON public.users;
CREATE TRIGGER audit_users
    AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

DROP TRIGGER IF EXISTS audit_reports ON public.reports;
CREATE TRIGGER audit_reports
    AFTER INSERT OR UPDATE ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

DROP TRIGGER IF EXISTS auto_ban_on_report ON public.reports;
CREATE TRIGGER auto_ban_on_report
    AFTER UPDATE OF status ON public.reports
    FOR EACH ROW
    WHEN (NEW.status = 'resolved')
    EXECUTE FUNCTION auto_ban_trigger();

DROP TRIGGER IF EXISTS sanitize_message ON public.messages;
CREATE TRIGGER sanitize_message
    BEFORE INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION sanitize_message_content();

-- Create cleanup function for stale sessions
CREATE OR REPLACE FUNCTION cleanup_stale_sessions()
RETURNS void AS $$
BEGIN
    -- End chat sessions inactive for > 30 minutes
    UPDATE public.chat_sessions 
    SET 
        status = 'ended',
        ended_at = NOW(),
        end_reason = 'Session timeout'
    WHERE status = 'active'
    AND started_at < NOW() - INTERVAL '30 minutes'
    AND (SELECT COUNT(*) FROM public.messages WHERE session_id = chat_sessions.id AND created_at > NOW() - INTERVAL '30 minutes') = 0;
    
    -- Remove matchmaking queue entries older than 1 hour
    DELETE FROM public.matchmaking_queue 
    WHERE entered_at < NOW() - INTERVAL '1 hour'
    AND matched_at IS NULL;
    
    -- Clean up expired guest sessions
    DELETE FROM public.guest_sessions 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
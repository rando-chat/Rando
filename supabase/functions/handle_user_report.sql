-- Handle User Report with Cooldown and Smart Processing
CREATE OR REPLACE FUNCTION public.handle_user_report(
    p_reporter_id UUID,
    p_reporter_is_guest BOOLEAN,
    p_reported_user_id UUID,
    p_reported_user_is_guest BOOLEAN,
    p_session_id UUID DEFAULT NULL,
    p_reason TEXT,
    p_category TEXT,
    p_evidence JSONB DEFAULT NULL
)
RETURNS TABLE(
    report_id UUID,
    success BOOLEAN,
    message TEXT,
    cooldown_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_report_id UUID;
    v_cooldown_seconds INTEGER;
    v_last_report TIMESTAMPTZ;
    v_report_count_today INTEGER;
    v_max_reports_per_day INTEGER := 5;
    v_cooldown_minutes INTEGER := 5;
    v_user_is_banned BOOLEAN;
BEGIN
    -- Check if reporter is banned
    IF NOT p_reporter_is_guest THEN
        SELECT is_banned INTO v_user_is_banned
        FROM public.users WHERE id = p_reporter_id;
    ELSE
        SELECT is_banned INTO v_user_is_banned
        FROM public.guest_sessions WHERE id = p_reporter_id;
    END IF;
    
    IF v_user_is_banned THEN
        report_id := NULL;
        success := false;
        message := 'You are banned from reporting users';
        cooldown_remaining := 0;
        RETURN NEXT;
        RETURN;
    END IF;
    
    -- Check report cooldown
    SELECT MAX(created_at) INTO v_last_report
    FROM public.reports 
    WHERE reporter_id = p_reporter_id
    AND reporter_is_guest = p_reporter_is_guest
    AND created_at > NOW() - INTERVAL '24 hours';
    
    IF v_last_report IS NOT NULL THEN
        v_cooldown_seconds := EXTRACT(EPOCH FROM (NOW() - v_last_report));
        
        IF v_cooldown_seconds < (v_cooldown_minutes * 60) THEN
            report_id := NULL;
            success := false;
            message := 'Please wait before submitting another report';
            cooldown_remaining := (v_cooldown_minutes * 60) - v_cooldown_seconds;
            RETURN NEXT;
            RETURN;
        END IF;
    END IF;
    
    -- Check daily report limit
    SELECT COUNT(*) INTO v_report_count_today
    FROM public.reports 
    WHERE reporter_id = p_reporter_id
    AND reporter_is_guest = p_reporter_is_guest
    AND created_at > NOW() - INTERVAL '24 hours';
    
    IF v_report_count_today >= v_max_reports_per_day THEN
        report_id := NULL;
        success := false;
        message := 'Daily report limit reached';
        cooldown_remaining := 86400; -- 24 hours in seconds
        RETURN NEXT;
        RETURN;
    END IF;
    
    -- Prevent self-reports
    IF p_reporter_id = p_reported_user_id AND p_reporter_is_guest = p_reported_user_is_guest THEN
        report_id := NULL;
        success := false;
        message := 'Cannot report yourself';
        cooldown_remaining := 0;
        RETURN NEXT;
        RETURN;
    END IF;
    
    -- Check for duplicate reports (same users within 1 hour)
    PERFORM 1 FROM public.reports 
    WHERE reporter_id = p_reporter_id
    AND reporter_is_guest = p_reporter_is_guest
    AND reported_user_id = p_reported_user_id
    AND reported_user_is_guest = p_reported_user_is_guest
    AND created_at > NOW() - INTERVAL '1 hour'
    AND status IN ('pending', 'reviewed');
    
    IF FOUND THEN
        report_id := NULL;
        success := false;
        message := 'You have already reported this user recently';
        cooldown_remaining := 3600; -- 1 hour
        RETURN NEXT;
        RETURN;
    END IF;
    
    -- Calculate priority based on category
    DECLARE
        v_priority INTEGER;
    BEGIN
        CASE p_category
            WHEN 'threats' THEN v_priority := 4;
            WHEN 'underage' THEN v_priority := 4;
            WHEN 'hate_speech' THEN v_priority := 3;
            WHEN 'harassment' THEN v_priority := 3;
            WHEN 'sharing_personal_info' THEN v_priority := 3;
            WHEN 'inappropriate_content' THEN v_priority := 2;
            WHEN 'spam' THEN v_priority := 1;
            ELSE v_priority := 1;
        END CASE;
        
        -- Insert the report
        INSERT INTO public.reports (
            reporter_id,
            reporter_is_guest,
            reported_user_id,
            reported_user_is_guest,
            session_id,
            reason,
            category,
            evidence,
            priority
        ) VALUES (
            p_reporter_id,
            p_reporter_is_guest,
            p_reported_user_id,
            p_reported_user_is_guest,
            p_session_id,
            p_reason,
            p_category,
            p_evidence,
            v_priority
        )
        RETURNING id INTO v_report_id;
        
        -- Log the action
        INSERT INTO public.audit_log (
            user_id,
            user_is_guest,
            action_type,
            resource_type,
            resource_id,
            details,
            severity
        ) VALUES (
            p_reporter_id,
            p_reporter_is_guest,
            'CREATE',
            'reports',
            v_report_id,
            jsonb_build_object(
                'reported_user', p_reported_user_id,
                'category', p_category,
                'priority', v_priority
            ),
            'warning'
        );
        
        -- Update user's report count if not guest
        IF NOT p_reported_user_is_guest THEN
            UPDATE public.users 
            SET report_count = report_count + 1,
                last_report_at = NOW()
            WHERE id = p_reported_user_id;
        ELSE
            UPDATE public.guest_sessions 
            SET report_count = report_count + 1
            WHERE id = p_reported_user_id;
        END IF;
        
        -- Auto-flag for immediate attention if high priority
        IF v_priority >= 3 THEN
            -- Could trigger notification to admins here
            UPDATE public.reports 
            SET status = 'reviewed' -- Auto-escalate for immediate review
            WHERE id = v_report_id;
        END IF;
        
        -- Return success
        report_id := v_report_id;
        success := true;
        message := 'Report submitted successfully';
        cooldown_remaining := v_cooldown_minutes * 60;
        
        RETURN NEXT;
    END;
END;
$$;
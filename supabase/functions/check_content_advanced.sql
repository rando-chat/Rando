-- Advanced Content Moderation Function
-- Uses multiple layers of safety checks
CREATE OR REPLACE FUNCTION public.check_content_advanced(
    p_content TEXT,
    p_user_id UUID DEFAULT NULL,
    p_is_guest BOOLEAN DEFAULT false
)
RETURNS TABLE(
    is_safe BOOLEAN,
    safety_score DECIMAL(3,2),
    flagged_reasons TEXT[],
    suggested_action TEXT,
    confidence DECIMAL(3,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_safety_score DECIMAL(3,2) := 1.0;
    v_flagged_reasons TEXT[] := '{}';
    v_confidence DECIMAL(3,2) := 0.0;
    v_temp_reason TEXT;
    v_url_count INTEGER;
    v_email_count INTEGER;
    v_phone_count INTEGER;
    v_bad_word_count INTEGER;
    v_suspicious_pattern_count INTEGER;
BEGIN
    -- Layer 1: Basic Pattern Checks (Fast)
    
    -- Check for URLs
    SELECT COUNT(*) INTO v_url_count
    FROM public.banned_patterns 
    WHERE is_active = true 
    AND pattern_type = 'url'
    AND p_content ~* pattern;
    
    IF v_url_count > 0 THEN
        v_safety_score := v_safety_score - 0.3;
        v_flagged_reasons := array_append(v_flagged_reasons, 'Contains ' || v_url_count || ' URL(s)');
        v_confidence := GREATEST(v_confidence, 0.8);
    END IF;
    
    -- Check for emails
    SELECT COUNT(*) INTO v_email_count
    FROM regexp_matches(p_content, 
        '\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', 'gi');
    
    IF v_email_count > 0 THEN
        v_safety_score := v_safety_score - 0.25;
        v_flagged_reasons := array_append(v_flagged_reasons, 'Contains ' || v_email_count || ' email(s)');
        v_confidence := GREATEST(v_confidence, 0.9);
    END IF;
    
    -- Check for phone numbers
    SELECT COUNT(*) INTO v_phone_count
    FROM regexp_matches(p_content, 
        '\b(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b', 'gi');
    
    IF v_phone_count > 0 THEN
        v_safety_score := v_safety_score - 0.25;
        v_flagged_reasons := array_append(v_flagged_reasons, 'Contains ' || v_phone_count || ' phone number(s)');
        v_confidence := GREATEST(v_confidence, 0.9);
    END IF;
    
    -- Layer 2: Keyword Checks (Moderate speed)
    
    -- Check against banned keywords
    SELECT COUNT(*) INTO v_bad_word_count
    FROM public.moderation_rules 
    WHERE is_active = true 
    AND rule_type IN ('keyword', 'regex')
    AND p_content ~* pattern;
    
    IF v_bad_word_count > 0 THEN
        v_safety_score := v_safety_score - (v_bad_word_count * 0.15);
        v_flagged_reasons := array_append(v_flagged_reasons, 'Contains ' || v_bad_word_count || ' inappropriate terms');
        v_confidence := GREATEST(v_confidence, 0.7);
    END IF;
    
    -- Layer 3: Suspicious Pattern Checks
    
    -- Check for excessive punctuation (spam indicator)
    IF (SELECT COUNT(*) FROM regexp_matches(p_content, '[!?]{3,}', 'g')) > 0 THEN
        v_safety_score := v_safety_score - 0.1;
        v_flagged_reasons := array_append(v_flagged_reasons, 'Excessive punctuation');
        v_confidence := GREATEST(v_confidence, 0.6);
    END IF;
    
    -- Check for ALL CAPS (shouting)
    IF length(p_content) > 10 THEN
        IF (SELECT COUNT(*) FROM regexp_matches(p_content, '[A-Z]', 'g'))::FLOAT / 
           length(p_content) > 0.7 THEN
            v_safety_score := v_safety_score - 0.05;
            v_flagged_reasons := array_append(v_flagged_reasons, 'Excessive capitalization');
            v_confidence := GREATEST(v_confidence, 0.5);
        END IF;
    END IF;
    
    -- Check for repetitive characters
    IF (SELECT COUNT(*) FROM regexp_matches(p_content, '(.)\1{4,}', 'g')) > 0 THEN
        v_safety_score := v_safety_score - 0.1;
        v_flagged_reasons := array_append(v_flagged_reasons, 'Repetitive characters');
        v_confidence := GREATEST(v_confidence, 0.6);
    END IF;
    
    -- Layer 4: User History Check (if user ID provided)
    
    IF p_user_id IS NOT NULL AND NOT p_is_guest THEN
        -- Check user's report history
        DECLARE
            v_report_count INTEGER;
            v_avg_safety_score DECIMAL(3,2);
        BEGIN
            SELECT COUNT(*) INTO v_report_count
            FROM public.reports 
            WHERE reported_user_id = p_user_id
            AND NOT reported_user_is_guest
            AND created_at > NOW() - INTERVAL '7 days';
            
            SELECT AVG(moderation_score) INTO v_avg_safety_score
            FROM public.messages 
            WHERE sender_id = p_user_id
            AND NOT sender_is_guest
            AND created_at > NOW() - INTERVAL '24 hours';
            
            -- Adjust score based on history
            IF v_report_count > 2 THEN
                v_safety_score := v_safety_score * 0.8;
                v_confidence := GREATEST(v_confidence, 0.8);
            ELSIF v_avg_safety_score < 0.6 THEN
                v_safety_score := v_safety_score * 0.9;
                v_confidence := GREATEST(v_confidence, 0.7);
            END IF;
        END;
    END IF;
    
    -- Ensure score is between 0 and 1
    v_safety_score := GREATEST(0.0, LEAST(1.0, v_safety_score));
    
    -- Determine suggested action
    DECLARE
        v_suggested_action TEXT;
    BEGIN
        IF v_safety_score < 0.3 THEN
            v_suggested_action := 'block';
        ELSIF v_safety_score < 0.6 THEN
            v_suggested_action := 'flag_for_review';
        ELSIF v_safety_score < 0.8 THEN
            v_suggested_action := 'allow_with_warning';
        ELSE
            v_suggested_action := 'allow';
        END IF;
        
        -- Return results
        is_safe := v_safety_score >= 0.6;
        safety_score := v_safety_score;
        flagged_reasons := v_flagged_reasons;
        suggested_action := v_suggested_action;
        confidence := v_confidence;
        
        RETURN NEXT;
    END;
END;
$$;
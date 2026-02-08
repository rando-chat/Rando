-- Create Guest Session with Random Display Name
CREATE OR REPLACE FUNCTION public.create_guest_session(
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_country_code CHAR(2) DEFAULT NULL
)
RETURNS TABLE(
    guest_id UUID,
    session_token TEXT,
    display_name TEXT,
    expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_guest_id UUID;
    v_session_token TEXT;
    v_display_name TEXT;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Generate secure session token
    v_session_token := encode(gen_random_bytes(32), 'hex');
    
    -- Generate random display name
    v_display_name := public.generate_display_name('neutral');
    
    -- Set expiration (24 hours)
    v_expires_at := NOW() + INTERVAL '24 hours';
    
    -- Insert guest session
    INSERT INTO public.guest_sessions (
        display_name,
        session_token,
        ip_address,
        user_agent,
        country_code,
        expires_at
    ) VALUES (
        v_display_name,
        v_session_token,
        p_ip_address,
        p_user_agent,
        p_country_code,
        v_expires_at
    )
    RETURNING id INTO v_guest_id;
    
    -- Log the creation
    INSERT INTO public.audit_log (
        user_id,
        user_is_guest,
        action_type,
        resource_type,
        resource_id,
        details,
        severity
    ) VALUES (
        v_guest_id,
        true,
        'CREATE',
        'guest_sessions',
        v_guest_id,
        jsonb_build_object(
            'ip', p_ip_address,
            'user_agent', LEFT(p_user_agent, 100),
            'country', p_country_code
        ),
        'info'
    );
    
    -- Return results
    guest_id := v_guest_id;
    session_token := v_session_token;
    display_name := v_display_name;
    expires_at := v_expires_at;
    
    RETURN NEXT;
END;
$$;
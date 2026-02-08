-- Advanced Matchmaking Function
-- Finds the best match for a user based on multiple factors
CREATE OR REPLACE FUNCTION public.match_users_v2(
    p_user_id UUID,
    p_is_guest BOOLEAN DEFAULT false,
    p_user_tier user_tier DEFAULT 'free',
    p_user_interests TEXT[] DEFAULT '{}',
    p_min_age INTEGER DEFAULT 18,
    p_max_age INTEGER DEFAULT 99
)
RETURNS TABLE(
    match_user_id UUID,
    match_is_guest BOOLEAN,
    match_display_name TEXT,
    match_tier user_tier,
    match_score INTEGER,
    shared_interests TEXT[],
    estimated_wait_time INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_best_match RECORD;
    v_match_score INTEGER;
    v_shared_interests TEXT[];
    v_queue_position INTEGER;
    v_avg_wait_time INTEGER;
BEGIN
    -- Safety check: Ensure user isn't banned
    IF NOT p_is_guest THEN
        PERFORM 1 FROM public.users 
        WHERE id = p_user_id AND is_banned = false;
        IF NOT FOUND THEN
            RETURN;
        END IF;
    ELSE
        PERFORM 1 FROM public.guest_sessions 
        WHERE id = p_user_id AND is_banned = false;
        IF NOT FOUND THEN
            RETURN;
        END IF;
    END IF;

    -- Calculate queue position
    SELECT COUNT(*) + 1 INTO v_queue_position
    FROM public.matchmaking_queue 
    WHERE matched_at IS NULL 
    AND entered_at < (
        SELECT entered_at 
        FROM public.matchmaking_queue 
        WHERE user_id = p_user_id 
        AND is_guest = p_is_guest
        LIMIT 1
    );

    -- Calculate average wait time (simplified)
    SELECT COALESCE(
        AVG(EXTRACT(EPOCH FROM (matched_at - entered_at))::INTEGER),
        30
    ) INTO v_avg_wait_time
    FROM public.matchmaking_queue 
    WHERE matched_at IS NOT NULL 
    AND matched_at > NOW() - INTERVAL '5 minutes'
    AND tier = p_user_tier;

    -- Find best match using intelligent scoring
    FOR v_best_match IN (
        WITH potential_matches AS (
            SELECT 
                mq.user_id,
                mq.is_guest,
                mq.display_name,
                mq.tier,
                mq.interests,
                mq.entered_at,
                -- Tier compatibility score (0-40 points)
                CASE 
                    WHEN mq.tier = 'premium' AND p_user_tier = 'premium' THEN 40
                    WHEN mq.tier = 'premium' AND p_user_tier = 'student' THEN 35
                    WHEN mq.tier = 'student' AND p_user_tier = 'premium' THEN 35
                    WHEN mq.tier = 'student' AND p_user_tier = 'student' THEN 30
                    WHEN mq.tier = 'free' AND p_user_tier = 'free' THEN 25
                    WHEN (mq.tier = 'premium' OR p_user_tier = 'premium') THEN 20
                    ELSE 15
                END AS tier_score,
                
                -- Interest match score (0-35 points)
                CASE 
                    WHEN array_length(p_user_interests, 1) > 0 AND array_length(mq.interests, 1) > 0 THEN
                        (SELECT COUNT(*) FROM unnest(p_user_interests) 
                         WHERE unnest = ANY(mq.interests)) * 10
                    ELSE 5
                END AS interest_score,
                
                -- Wait time fairness (0-25 points)
                (EXTRACT(EPOCH FROM (NOW() - mq.entered_at)) / 60)::INTEGER * 2 AS wait_score,
                
                -- Guest matching preference
                CASE 
                    WHEN mq.is_guest = p_is_guest THEN 10
                    ELSE 0
                END AS guest_score
                
            FROM public.matchmaking_queue mq
            WHERE mq.matched_at IS NULL
            AND mq.user_id != p_user_id
            AND (
                -- Prevent banned users
                (mq.is_guest = false AND NOT EXISTS (
                    SELECT 1 FROM public.users u 
                    WHERE u.id = mq.user_id AND u.is_banned = true
                ))
                OR
                (mq.is_guest = true AND NOT EXISTS (
                    SELECT 1 FROM public.guest_sessions g 
                    WHERE g.id = mq.user_id AND g.is_banned = true
                ))
            )
            -- Age compatibility (for registered users only)
            AND (
                mq.is_guest = true 
                OR NOT EXISTS (
                    SELECT 1 FROM public.users u 
                    WHERE u.id = mq.user_id 
                    AND (u.age < p_min_age OR u.age > p_max_age)
                )
            )
            ORDER BY entered_at ASC
            LIMIT 50 -- Limit for performance
        )
        SELECT 
            user_id,
            is_guest,
            display_name,
            tier,
            interests,
            (tier_score + interest_score + wait_score + guest_score) as total_score,
            entered_at
        FROM potential_matches
        WHERE total_score > 30 -- Minimum match threshold
        ORDER BY total_score DESC, entered_at ASC
        LIMIT 1
    ) 
    LOOP
        -- Calculate shared interests
        SELECT ARRAY(
            SELECT unnest(p_user_interests)
            INTERSECT
            SELECT unnest(v_best_match.interests)
        ) INTO v_shared_interests;

        -- Return the match
        match_user_id := v_best_match.user_id;
        match_is_guest := v_best_match.is_guest;
        match_display_name := v_best_match.display_name;
        match_tier := v_best_match.tier;
        match_score := v_best_match.total_score;
        shared_interests := v_shared_interests;
        estimated_wait_time := v_queue_position * (v_avg_wait_time / 10);
        
        RETURN NEXT;
        
        -- Exit after first match
        EXIT;
    END LOOP;

    -- If no match found, return empty
    IF NOT FOUND THEN
        estimated_wait_time := v_queue_position * (v_avg_wait_time / 10);
        RETURN NEXT;
    END IF;
END;
$$;
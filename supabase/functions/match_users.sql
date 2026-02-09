-- Function to match users in queue
CREATE OR REPLACE FUNCTION match_users()
RETURNS TABLE(match_user_id UUID, match_tier VARCHAR, match_interests TEXT[]) AS $$
DECLARE
  current_user_id UUID;
  current_user_tier VARCHAR;
  current_user_interests TEXT[];
  current_looking_for VARCHAR;
  matched_user RECORD;
BEGIN
  -- Get current user from JWT
  current_user_id := auth.uid();
  
  -- Get user details from queue
  SELECT tier, interests, looking_for 
  INTO current_user_tier, current_user_interests, current_looking_for
  FROM matchmaking_queue 
  WHERE user_id = current_user_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Find best match
  FOR matched_user IN
    SELECT mq.user_id, mq.tier, mq.interests
    FROM matchmaking_queue mq
    JOIN users u ON mq.user_id = u.id
    WHERE mq.user_id != current_user_id
      AND mq.looking_for = current_looking_for
      AND NOT u.banned
      AND (mq.tier = current_user_tier OR mq.tier IN ('premium', 'student'))
    ORDER BY 
      -- Prioritize same tier
      CASE WHEN mq.tier = current_user_tier THEN 0 ELSE 1 END,
      -- Prioritize shared interests
      ARRAY_LENGTH(ARRAY(
        SELECT UNNEST(mq.interests) 
        INTERSECT 
        SELECT UNNEST(current_user_interests)
      ), 1) DESC,
      -- Oldest in queue first
      mq.entered_at ASC
    LIMIT 1
  LOOP
    match_user_id := matched_user.user_id;
    match_tier := matched_user.tier;
    match_interests := matched_user.interests;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION match_users TO authenticated;
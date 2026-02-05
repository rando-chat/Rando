-- Function to cleanup old queue entries
CREATE OR REPLACE FUNCTION cleanup_old_queue()
RETURNS void AS $$
BEGIN
  -- Delete queue entries older than 5 minutes
  DELETE FROM matchmaking_queue 
  WHERE entered_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to run every 5 minutes
SELECT cron.schedule(
  'cleanup-matchmaking-queue',
  '*/5 * * * *', -- Every 5 minutes
  'SELECT cleanup_old_queue();'
);
// In realtime.ts, fix the presence function:
async subscribeToOnlineUsers(callback: (count: number) => void) {
  // Simple: Query matchmaking_queue for active searchers
  const { count } = await supabase
    .from('matchmaking_queue')
    .select('*', { count: 'exact', head: true });
  
  callback(count || 0);
}
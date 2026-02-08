// supabase/functions/daily-report/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_KEY')
const DISCORD_WEBHOOK = Deno.env.get('DISCORD_WEBHOOK_DAILY')

serve(async () => {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)
  
  // Get daily stats
  const { data: stats } = await supabase.rpc('get_daily_stats')
  
  const message = {
    embeds: [{
      title: '📊 Daily Platform Report',
      description: `Report for ${new Date().toLocaleDateString()}`,
      color: 0x7289da,
      fields: [
        { name: 'New Users', value: stats.new_users?.toString() || '0', inline: true },
        { name: 'Active Chats', value: stats.active_chats?.toString() || '0', inline: true },
        { name: 'Messages Sent', value: stats.total_messages?.toString() || '0', inline: true },
        { name: 'Reports Filed', value: stats.new_reports?.toString() || '0', inline: true },
        { name: 'Avg Match Score', value: stats.avg_match_score?.toFixed(1) || '0', inline: true },
        { name: 'Safety Score', value: stats.safety_score?.toFixed(1) + '%' || '0%', inline: true }
      ],
      timestamp: new Date().toISOString()
    }]
  }

  if (DISCORD_WEBHOOK) {
    await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    })
  }

  return new Response('Daily report generated', { status: 200 })
})
// supabase/functions/send-alert/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const DISCORD_WEBHOOK = Deno.env.get('DISCORD_WEBHOOK_URL')

serve(async (req) => {
  if (!DISCORD_WEBHOOK) {
    return new Response('No webhook configured', { status: 500 })
  }

  const alert = await req.json()
  
  const discordMessage = {
    embeds: [{
      title: alert.title || 'Platform Alert',
      description: alert.message,
      color: alert.type === 'critical' ? 0xff0000 : 0xff9900,
      timestamp: new Date().toISOString(),
      fields: [
        {
          name: 'Metric',
          value: alert.metric || 'unknown',
          inline: true
        },
        {
          name: 'Value',
          value: alert.value?.toString() || 'N/A',
          inline: true
        }
      ]
    }]
  }

  await fetch(DISCORD_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(discordMessage)
  })

  return new Response('Alert sent', { status: 200 })
})
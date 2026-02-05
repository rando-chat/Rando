import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  try {
    const text = await request.text();
    const signature = request.headers.get('X-Signature');
    
    // Verify webhook signature (Lemon Squeezy sends raw text)
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET!;
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(text).digest('hex');
    
    if (signature !== digest) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const event = JSON.parse(text);
    const { meta } = event;
    
    if (!meta?.custom_data?.user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing user data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = meta.custom_data.user_id;
    const tier = meta.custom_data.tier || 'premium';
    
    switch (event.meta.event_name) {
      case 'order_created':
      case 'subscription_created':
      case 'subscription_updated':
        // Update user tier
        await supabase
          .from('users')
          .update({
            tier,
            subscription_status: 'active',
            stripe_customer_id: event.data.attributes.customer_id,
          })
          .eq('id', userId);
        
        // Update checkout session
        if (meta.custom_data.checkout_id) {
          await supabase
            .from('checkout_sessions')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', meta.custom_data.checkout_id);
        }
        break;

      case 'subscription_cancelled':
      case 'subscription_expired':
        // Downgrade user to free
        await supabase
          .from('users')
          .update({
            tier: 'free',
            subscription_status: 'cancelled',
          })
          .eq('id', userId);
        break;

      default:
        // Ignore other events
        break;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
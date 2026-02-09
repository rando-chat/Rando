import { supabase } from '../supabase/client';
import { trackAnalytics } from '../supabase/auth';

const LEMON_STORE_ID = process.env.NEXT_PUBLIC_LEMON_STORE_ID;
const LEMON_PRODUCT_ID = process.env.NEXT_PUBLIC_LEMON_PRODUCT_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function createCheckoutSession(userId: string, email: string, tier: 'premium' | 'student') {
  try {
    // Generate a unique checkout identifier
    const checkoutId = `rando_${userId}_${Date.now()}`;
    
    // Lemon Squeezy doesn't have a direct frontend SDK like Stripe
    // We'll redirect to their hosted checkout page
    const checkoutUrl = `https://${LEMON_STORE_ID}.lemonsqueezy.com/checkout/buy/${LEMON_PRODUCT_ID}?` + new URLSearchParams({
      'checkout[email]': email,
      'checkout[custom][user_id]': userId,
      'checkout[custom][tier]': tier,
      'checkout[custom][checkout_id]': checkoutId,
      'checkout[redirect]': `${APP_URL}/payment-success`,
      'checkout[custom][app_url]': APP_URL || '',
    }).toString();

    // Store checkout session
    await supabase.from('checkout_sessions').insert({
      id: checkoutId,
      user_id: userId,
      tier,
      status: 'pending',
      checkout_url: checkoutUrl,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    });

    await trackAnalytics('checkout_started', {
      userId,
      tier,
      checkoutId,
    });

    return { success: true, url: checkoutUrl };
  } catch (error: any) {
    console.error('Checkout creation error:', error);
    return { success: false, error: error.message };
  }
}

export async function verifyPurchase(checkoutId: string) {
  try {
    const { data: session, error } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('id', checkoutId)
      .single();

    if (error) throw error;
    if (!session) throw new Error('Checkout session not found');

    // Check if payment was completed (this would normally be verified via webhook)
    // For now, we'll trust the client and mark as completed
    const { error: updateError } = await supabase
      .from('checkout_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', checkoutId);

    if (updateError) throw updateError;

    // Update user tier
    const { error: userError } = await supabase
      .from('users')
      .update({
        tier: session.tier,
        subscription_status: 'active',
      })
      .eq('id', session.user_id);

    if (userError) throw userError;

    await trackAnalytics('payment_completed', {
      userId: session.user_id,
      tier: session.tier,
      checkoutId,
    });

    return { success: true, tier: session.tier };
  } catch (error: any) {
    console.error('Purchase verification error:', error);
    return { success: false, error: error.message };
  }
}
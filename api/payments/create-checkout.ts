export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  try {
    const { userId, email, tier } = await request.json();
    
    if (!userId || !email || !tier) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const LEMON_STORE_ID = process.env.LEMON_STORE_ID;
    const LEMON_PRODUCT_ID = process.env.LEMON_PRODUCT_ID;
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

    // Generate checkout ID
    const checkoutId = `rando_${userId}_${Date.now()}`;

    // Create Lemon Squeezy checkout URL
    const checkoutUrl = `https://${LEMON_STORE_ID}.lemonsqueezy.com/checkout/buy/${LEMON_PRODUCT_ID}?` + new URLSearchParams({
      'checkout[email]': email,
      'checkout[custom][user_id]': userId,
      'checkout[custom][tier]': tier,
      'checkout[custom][checkout_id]': checkoutId,
      'checkout[redirect]': `${APP_URL}/payment-success`,
      'checkout[custom][app_url]': APP_URL || '',
    }).toString();

    return new Response(
      JSON.stringify({
        success: true,
        checkoutId,
        url: checkoutUrl,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Checkout creation error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
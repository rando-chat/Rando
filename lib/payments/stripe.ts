import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })

// Use NEXT_PUBLIC_APP_URL with fallback to NEXT_PUBLIC_URL
const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL || 'https://rando-chat.vercel.app'

export async function createCheckoutSession(userId: string, tier: 'student' | 'premium'): Promise<string> {
  const prices: Record<string, string> = {
    student: process.env.STRIPE_STUDENT_PRICE_ID || '',
    premium: process.env.STRIPE_PREMIUM_PRICE_ID || '',
  }

  if (!prices[tier]) {
    throw new Error(`Stripe price ID for ${tier} not configured. Add STRIPE_${tier.toUpperCase()}_PRICE_ID to environment variables.`)
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: prices[tier], quantity: 1 }],
    success_url: `${appUrl}/payments/success/{CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/matchmaking`,
    metadata: { user_id: userId, tier },
  })

  return session.url!
}

export async function createPortalSession(customerId: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/settings/account`,
  })
  return session.url
}
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })

export async function createCheckoutSession(userId: string, tier: 'student' | 'premium'): Promise<string> {
  const prices = {
    student: process.env.STRIPE_STUDENT_PRICE_ID!,
    premium: process.env.STRIPE_PREMIUM_PRICE_ID!,
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price: prices[tier],
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/payments/success/{CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/payments/cancel`,
    metadata: { user_id: userId, tier },
  })

  return session.url!
}

export async function createPortalSession(userId: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: userId,
    return_url: `${process.env.NEXT_PUBLIC_URL}/payments/billing`,
  })

  return session.url
}
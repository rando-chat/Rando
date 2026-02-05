declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export function initializeGA4(measurementId: string) {
  if (typeof window === 'undefined') return;

  // Load gtag.js
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);
}

export function trackPageView(path: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID!, {
      page_path: path,
    });
  }
}

export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}

export function trackUserSignUp(method: string) {
  trackEvent('sign_up', { method });
}

export function trackUserLogin(method: string) {
  trackEvent('login', { method });
}

export function trackChatStarted(sessionId: string) {
  trackEvent('chat_started', { session_id: sessionId });
}

export function trackMessageSent(sessionId: string, length: number) {
  trackEvent('message_sent', {
    session_id: sessionId,
    message_length: length,
  });
}

export function trackPaymentStarted(tier: string, amount: number) {
  trackEvent('begin_checkout', {
    currency: 'USD',
    value: amount,
    items: [{ tier }],
  });
}

export function trackPaymentCompleted(tier: string, amount: number) {
  trackEvent('purchase', {
    currency: 'USD',
    value: amount,
    transaction_id: `rando_${Date.now()}`,
    items: [{ tier }],
  });
}
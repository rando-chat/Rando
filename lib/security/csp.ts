/**
 * Content Security Policy
 */

export function getCSP(): string {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.supabase.co",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: *.supabase.co",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ]
  
  return csp.join('; ')
}

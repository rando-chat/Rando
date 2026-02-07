'use client'

import React, { useEffect } from 'react'
import Head from 'next/head'

interface SecurityHeadersProps {
  enableCSP?: boolean
  enableHSTS?: boolean
  enableXSS?: boolean
  enableFrameOptions?: boolean
  enableReferrerPolicy?: boolean
  enablePermissionsPolicy?: boolean
}

export function SecurityHeaders({
  enableCSP = true,
  enableHSTS = true,
  enableXSS = true,
  enableFrameOptions = true,
  enableReferrerPolicy = true,
  enablePermissionsPolicy = true,
}: SecurityHeadersProps) {
  useEffect(() => {
    // Set security headers via meta tags (for static export compatibility)
    // In production, these should be set at server/edge level
    
    if (enableCSP) {
      const meta = document.createElement('meta')
      meta.httpEquiv = 'Content-Security-Policy'
      meta.content = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
        "frame-src 'self'",
        "media-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "block-all-mixed-content",
        "upgrade-insecure-requests"
      ].join('; ')
      document.head.appendChild(meta)
    }
  }, [enableCSP])

  return (
    <Head>
      {/* Basic Security Headers */}
      {enableXSS && (
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      )}
      
      {enableFrameOptions && (
        <meta httpEquiv="X-Frame-Options" content="DENY" />
      )}
      
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      
      {enableReferrerPolicy && (
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      )}
      
      {/* Permissions Policy */}
      {enablePermissionsPolicy && (
        <meta
          httpEquiv="Permissions-Policy"
          content="camera=(), microphone=(), geolocation=(), interest-cohort=()"
        />
      )}
      
      {/* HSTS - Note: This should be set at server level for proper HTTPS enforcement */}
      {enableHSTS && process.env.NODE_ENV === 'production' && (
        <meta
          httpEquiv="Strict-Transport-Security"
          content="max-age=31536000; includeSubDomains; preload"
        />
      )}
      
      {/* Additional Security Headers */}
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
      />
      
      {/* Security-related meta tags */}
      <meta name="robots" content="noindex, nofollow" />
      
      {/* Prevents browser from using dangerous MIME types */}
      <meta httpEquiv="X-Download-Options" content="noopen" />
      
      {/* CSP Report Only (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <meta
          httpEquiv="Content-Security-Policy-Report-Only"
          content="default-src 'self'; report-uri /api/csp-report"
        />
      )}
    </Head>
  )
}

// Server-side security headers configuration (for Next.js API routes)
export const securityHeadersConfig = {
  headers: [
    {
      key: 'X-DNS-Prefetch-Control',
      value: 'on',
    },
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    },
    {
      key: 'X-XSS-Protection',
      value: '1; mode=block',
    },
    {
      key: 'X-Frame-Options',
      value: 'DENY',
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    {
      key: 'Referrer-Policy',
      value: 'origin-when-cross-origin',
    },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    },
    {
      key: 'Content-Security-Policy',
      value: process.env.NODE_ENV === 'production' 
        ? [
            "default-src 'self';",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live;",
            "style-src 'self' 'unsafe-inline';",
            "img-src 'self' data: https:;",
            "font-src 'self' data:;",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co;",
            "frame-src 'self';",
            "media-src 'self';",
            "object-src 'none';",
            "base-uri 'self';",
            "form-action 'self';",
            "frame-ancestors 'none';",
            "block-all-mixed-content;",
            "upgrade-insecure-requests;"
          ].join(' ')
        : "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co;",
    },
  ],
}

// Helper to set security headers in API routes
export function setSecurityHeaders(headers: Headers) {
  securityHeadersConfig.headers.forEach(({ key, value }) => {
    headers.set(key, value)
  })
}

// Security middleware for API routes
export function withSecurityHeaders(handler: Function) {
  return async (req: Request, ...args: any[]) => {
    const response = await handler(req, ...args)
    
    // Add security headers to response
    securityHeadersConfig.headers.forEach(({ key, value }) => {
      response.headers.set(key, value)
    })
    
    return response
  }
}

export default SecurityHeaders
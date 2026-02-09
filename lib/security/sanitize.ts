/**
 * Input Sanitization
 */

export function sanitizeHtml(dirty: string): string {
  return dirty
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

export function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, '').trim()
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

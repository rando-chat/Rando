export function verifyStudentEmail(email: string): boolean {
  const eduDomains = ['.edu', '.ac.uk', '.ac.', '.edu.']
  return eduDomains.some(domain => email.toLowerCase().includes(domain))
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  // TODO: Integrate with email service (SendGrid, Resend, etc.)
  console.log(`Send code ${code} to ${email}`)
}

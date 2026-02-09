export async function verifyStudentEmail(email: string): Promise<boolean> {
  const eduDomains = ['.edu', '.ac.uk', '.ac.']
  return eduDomains.some(domain => email.endsWith(domain))
}

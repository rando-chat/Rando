export function formatReportCategory(category: string): string {
  return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export function getReportCooldownMessage(seconds: number): string {
  if (seconds <= 0) return 'You can submit a report'
  const minutes = Math.ceil(seconds / 60)
  return `Please wait ${minutes} minute${minutes === 1 ? '' : 's'} before reporting again`
}

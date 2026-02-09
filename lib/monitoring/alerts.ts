interface Alert {
  id: string
  type: 'error' | 'warning' | 'info'
  message: string
  threshold?: number
}

export const AlertConfig: Alert[] = [
  {
    id: 'high_error_rate',
    type: 'error',
    message: 'Error rate exceeds threshold',
    threshold: 0.05, // 5%
  },
  {
    id: 'low_match_rate',
    type: 'warning',
    message: 'Match success rate below normal',
    threshold: 0.5, // 50%
  },
  {
    id: 'high_churn',
    type: 'warning',
    message: 'Subscription churn rate elevated',
    threshold: 0.1, // 10%
  },
]

export function checkAlerts(metrics: any): Alert[] {
  const triggered: Alert[] = []

  // Check each alert condition
  if (metrics.errorRate > 0.05) {
    triggered.push(AlertConfig[0])
  }

  if (metrics.matchRate < 0.5) {
    triggered.push(AlertConfig[1])
  }

  if (metrics.churnRate > 0.1) {
    triggered.push(AlertConfig[2])
  }

  return triggered
}

import { MatchmakingQueue } from '@/components/matchmaking/MatchmakingQueue'

// No AuthGuard - guests can chat without signing in
export default function MatchmakingPage() {
  return <MatchmakingQueue />
}
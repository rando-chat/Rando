// app/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="p-8 w-full max-w-md">
        <div className="space-y-4">
          <div className="text-center">
            <Skeleton className="h-8 w-1/2 mx-auto mb-2" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </div>
          
          <div className="space-y-3 pt-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>

          <div className="pt-6">
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </Card>
    </div>
  )
}
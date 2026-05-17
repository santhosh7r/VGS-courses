import { Skeleton } from '@/components/ui/skeleton'

/** Premium content skeleton shown while a panel page loads. */
export default function PageSkeleton() {
  return (
    <div className="p-6 md:p-8 animate-fade-rise">
      <Skeleton className="h-9 w-56 rounded-lg" />
      <Skeleton className="mt-3 h-4 w-80 rounded" />

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  )
}

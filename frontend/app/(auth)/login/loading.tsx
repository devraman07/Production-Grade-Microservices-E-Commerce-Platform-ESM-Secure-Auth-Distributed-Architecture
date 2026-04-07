import { Skeleton } from "@/components/ui/Skeleton"

export default function Loading() {
  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Skeleton className="h-8 w-48 mx-auto mb-8" />
      <div className="space-y-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    </div>
  )
}

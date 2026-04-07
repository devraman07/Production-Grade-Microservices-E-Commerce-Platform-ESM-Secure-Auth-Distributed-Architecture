import { Skeleton } from "@/components/ui/Skeleton"

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Skeleton className="h-10 w-64 mb-8" />
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <Skeleton className="h-20 w-full mt-8" />
    </div>
  )
}

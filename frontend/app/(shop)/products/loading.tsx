import { Skeleton, ProductGridSkeleton } from "@/components/ui/Skeleton"

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-10 w-48" />
      </div>
      <ProductGridSkeleton count={8} />
    </div>
  )
}

import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const skeletonVariants = cva(
  "animate-pulse rounded-md bg-muted",
  {
    variants: {
      variant: {
        default: "bg-muted",
        card: "bg-muted rounded-xl",
        circle: "rounded-full bg-muted",
        text: "bg-muted rounded",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof skeletonVariants> {
  width?: string | number
  height?: string | number
}

function Skeleton({
  className,
  variant,
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ variant }), className)}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    />
  )
}

function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-lg">
      <Skeleton variant="card" className="h-48 w-full" />
      <div className="mt-4 space-y-2">
        <Skeleton variant="text" className="h-5 w-3/4" />
        <Skeleton variant="text" className="h-4 w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton variant="text" className="h-6 w-20" />
          <Skeleton variant="text" className="h-10 w-28" />
        </div>
      </div>
    </div>
  )
}

function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

function CartItemSkeleton() {
  return (
    <div className="flex gap-6 rounded-2xl bg-white p-6 shadow-lg">
      <Skeleton variant="card" className="h-24 w-24" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="h-5 w-48" />
        <Skeleton variant="text" className="h-6 w-24" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton variant="text" className="h-9 w-9" />
        <Skeleton variant="text" className="h-5 w-12" />
        <Skeleton variant="text" className="h-9 w-9" />
      </div>
    </div>
  )
}

export { Skeleton, ProductCardSkeleton, ProductGridSkeleton, CartItemSkeleton }

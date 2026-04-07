"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/Alert"

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error("Cart page error:", error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertTitle>Cart Error</AlertTitle>
        <AlertDescription>
          {error.message || "Unable to load your cart. Please try again."}
        </AlertDescription>
      </Alert>
      <Button onClick={reset} className="mt-4">
        Try again
      </Button>
    </div>
  )
}

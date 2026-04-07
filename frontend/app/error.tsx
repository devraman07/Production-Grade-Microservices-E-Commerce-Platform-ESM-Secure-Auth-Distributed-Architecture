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
    console.error("Error caught by error boundary:", error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertTitle>Something went wrong!</AlertTitle>
        <AlertDescription>
          {error.message || "An unexpected error occurred. Please try again."}
        </AlertDescription>
      </Alert>
      <Button onClick={reset} className="mt-4">
        Try again
      </Button>
    </div>
  )
}

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
    console.error("Login page error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-orange-400 to-red-500">
      <Alert variant="destructive" className="max-w-md bg-white">
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription>
          {error.message || "Unable to load the login page. Please try again."}
        </AlertDescription>
      </Alert>
      <Button onClick={reset} className="mt-4" variant="secondary">
        Try again
      </Button>
    </div>
  )
}

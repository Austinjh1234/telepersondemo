"use client"

import { useEffect } from "react"

export default function SuppressResizeObserverError() {
  useEffect(() => {
    // Store original error handler
    const originalOnError = window.onerror

    // Override window.onerror to catch and suppress ResizeObserver errors
    window.onerror = function (message, source, lineno, colno, error) {
      // Check if the error is related to ResizeObserver
      if (
        message &&
        typeof message === "string" &&
        (message.includes("ResizeObserver") || (error && error.message && error.message.includes("ResizeObserver")))
      ) {
        // Suppress the error
        console.warn("Suppressed ResizeObserver error")
        return true // Prevents the error from being shown in console
      }

      // For other errors, use the original handler if available
      if (originalOnError) {
        return originalOnError.call(this, message, source, lineno, colno, error)
      }

      return false
    }

    // Also patch console.error to filter out ResizeObserver warnings
    const originalConsoleError = console.error
    console.error = (...args) => {
      // Check if this is a ResizeObserver error
      if (args.length > 0 && typeof args[0] === "string" && args[0].includes("ResizeObserver")) {
        console.warn("Suppressed ResizeObserver console error")
        return
      }
      originalConsoleError.apply(console, args)
    }

    return () => {
      // Restore original handlers when component unmounts
      window.onerror = originalOnError
      console.error = originalConsoleError
    }
  }, [])

  return null
}

"use client"

import { useState, useEffect } from "react"
import { MessageCircle, Mic, Send } from "lucide-react"

export function EnhancedChatbotSkeleton() {
  const [loadingStep, setLoadingStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const steps = [
      "Initializing AI Assistant...",
      "Loading conversation context...",
      "Preparing voice capabilities...",
      "Ready to chat!",
    ]

    let stepInterval: NodeJS.Timeout
    let progressInterval: NodeJS.Timeout
    let animationFrameId: number

    // Use requestAnimationFrame for smoother animations
    const updateProgress = (timestamp: number) => {
      setProgress((prev) => {
        if (prev >= 100) return 0
        return prev + 0.5 // Slower, more controlled progress
      })
      animationFrameId = requestAnimationFrame(updateProgress)
    }

    try {
      // Use setTimeout instead of setInterval for step changes
      const nextStep = () => {
        setLoadingStep((prev) => {
          const next = (prev + 1) % steps.length
          if (next === 0) {
            // If we've cycled through all steps, stop the animation
            clearTimeout(stepInterval)
            cancelAnimationFrame(animationFrameId)
            return prev
          }
          stepInterval = setTimeout(nextStep, 1500)
          return next
        })
      }

      stepInterval = setTimeout(nextStep, 1500)
      animationFrameId = requestAnimationFrame(updateProgress)
    } catch (error) {
      console.warn("Animation error:", error)
    }

    return () => {
      clearTimeout(stepInterval)
      clearInterval(progressInterval)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  const steps = [
    "Initializing AI Assistant...",
    "Loading conversation context...",
    "Preparing voice capabilities...",
    "Ready to chat!",
  ]

  return (
    <div className="w-full h-full p-4 relative overflow-hidden size-stable">
      {/* Static background instead of animated */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/10 to-orange-900/10" />

      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-orange-400" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-700/50 rounded w-32"></div>
            <div className="h-3 bg-gray-700/30 rounded w-24"></div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-gray-700/50 rounded-full"></div>
          <div className="w-8 h-8 bg-gray-700/50 rounded-full"></div>
        </div>
      </div>

      {/* Chat messages skeleton - simplified */}
      <div className="space-y-6 mb-8 relative z-10">
        {/* AI welcome message */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-700/50 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700/50 rounded w-1/2"></div>
            <div className="h-4 bg-gray-700/50 rounded w-2/3"></div>
          </div>
        </div>

        {/* Typing indicator */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex-shrink-0"></div>
          <div className="flex items-center gap-1 bg-gray-800/40 rounded-lg px-3 py-2">
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-gray-500 rounded-full"
                  style={{ opacity: i === loadingStep % 3 ? 1 : 0.5 }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400 ml-2">AI is thinking...</span>
          </div>
        </div>
      </div>

      {/* Input area skeleton */}
      <div className="border-t border-gray-700/50 pt-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-12 bg-gray-700/50 rounded-lg relative overflow-hidden">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-600/20 to-transparent"
              style={{
                transform: `translateX(${progress}%)`,
                transition: "transform 0.3s ease-out",
              }}
            ></div>
          </div>
          <div className="h-12 w-12 bg-gradient-to-r from-orange-600/50 to-red-600/50 rounded-lg flex items-center justify-center">
            <Send className="w-5 h-5 text-orange-300" />
          </div>
          <div className="h-12 w-12 bg-gradient-to-r from-blue-600/50 to-purple-600/50 rounded-lg flex items-center justify-center">
            <Mic className="w-5 h-5 text-blue-300" />
          </div>
        </div>
      </div>

      {/* Loading status */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full"></div>
            <span className="text-gray-300 text-sm font-medium">{steps[loadingStep]}</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>Loading AI capabilities...</span>
            <span>{Math.round(Math.min(progress, 100))}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

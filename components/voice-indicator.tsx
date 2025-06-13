"use client"

import { useState, useEffect } from "react"
import { Mic, MicOff } from "lucide-react"

interface VoiceIndicatorProps {
  isActive?: boolean
  hasPermission?: boolean
}

export function VoiceIndicator({ isActive = false, hasPermission = false }: VoiceIndicatorProps) {
  const [pulseIntensity, setPulseIntensity] = useState(0)

  useEffect(() => {
    if (isActive) {
      // Use requestAnimationFrame for smoother animations
      let animationFrameId: number
      let lastUpdate = 0
      const minUpdateInterval = 150 // ms between updates

      const updatePulse = (timestamp: number) => {
        if (timestamp - lastUpdate >= minUpdateInterval) {
          setPulseIntensity(Math.random() * 100)
          lastUpdate = timestamp
        }
        animationFrameId = requestAnimationFrame(updatePulse)
      }

      animationFrameId = requestAnimationFrame(updatePulse)

      return () => {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [isActive])

  if (!hasPermission) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <MicOff className="w-3 h-3" />
        <span className="text-xs">Mic Disabled</span>
      </div>
    )
  }

  return (
    <div
      className={`flex items-center gap-2 transition-colors duration-300 ${isActive ? "text-green-400" : "text-blue-400"}`}
    >
      <div className="relative">
        <Mic className="w-3 h-3" />
        {isActive && (
          <div
            className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"
            style={{
              transform: `scale(${1 + pulseIntensity / 200})`,
              opacity: 0.3 + pulseIntensity / 300,
            }}
          />
        )}
      </div>
      <div className="flex items-center gap-1">
        <div
          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
            isActive ? "bg-green-400 animate-pulse" : "bg-blue-400"
          }`}
        />
        <span className="text-xs font-medium">{isActive ? "Listening..." : "Voice Ready"}</span>
      </div>
      {isActive && (
        <div className="flex gap-0.5">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-0.5 bg-green-400 rounded-full animate-pulse"
              style={{
                height: `${4 + pulseIntensity / 25}px`,
                animationDelay: `${i * 100}ms`,
                animationDuration: "0.6s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

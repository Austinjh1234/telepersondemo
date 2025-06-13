"use client"

import type React from "react"

import { useEffect } from "react"

interface AnalyticsEvent {
  event: string
  properties: Record<string, any>
  timestamp: number
}

class AnalyticsTracker {
  private events: AnalyticsEvent[] = []
  private sessionId: string

  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  track(event: string, properties: Record<string, any> = {}) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    }

    this.events.push(analyticsEvent)

    // Log to console for development
    console.log("📊 Analytics Event:", analyticsEvent)

    // Store in localStorage for persistence
    try {
      const stored = localStorage.getItem("teleperson_analytics") || "[]"
      const allEvents = JSON.parse(stored)
      allEvents.push(analyticsEvent)

      // Keep only last 100 events
      if (allEvents.length > 100) {
        allEvents.splice(0, allEvents.length - 100)
      }

      localStorage.setItem("teleperson_analytics", JSON.stringify(allEvents))
    } catch (error) {
      console.warn("Failed to store analytics event:", error)
    }

    // In production, you would send this to your analytics service
    // this.sendToAnalyticsService(analyticsEvent)
  }

  trackSectorChange(fromSector: string, toSector: string, method: "dropdown" | "url" = "dropdown") {
    this.track("sector_changed", {
      from_sector: fromSector,
      to_sector: toSector,
      change_method: method,
    })
  }

  trackVoiceActivation(success: boolean, method: string, error?: string) {
    this.track("voice_activation_attempted", {
      success,
      method,
      error: error || null,
    })
  }

  trackChatbotLoad(sector: string, loadTime: number, success: boolean) {
    this.track("chatbot_loaded", {
      sector,
      load_time_ms: loadTime,
      success,
    })
  }

  trackWaitlistOpen(sector: string) {
    this.track("waitlist_modal_opened", {
      sector,
    })
  }

  trackWaitlistSubmit(sector: string, formData: any) {
    this.track("waitlist_submitted", {
      sector,
      company_size: formData.companySize,
      timeline: formData.timeline,
      chatbot_status: formData.chatbotStatus,
    })
  }

  trackMicrophonePermission(granted: boolean) {
    this.track("microphone_permission", {
      granted,
    })
  }

  getSessionStats() {
    return {
      sessionId: this.sessionId,
      eventCount: this.events.length,
      events: this.events,
    }
  }
}

// Global analytics instance
export const analytics = new AnalyticsTracker()

interface AnalyticsProviderProps {
  children: React.ReactNode
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  useEffect(() => {
    // Track page load
    analytics.track("page_loaded", {
      page: "home",
    })

    // Track session start
    analytics.track("session_started")

    return () => {
      // Track session end
      analytics.track("session_ended", {
        duration_ms: Date.now() - Number.parseInt(analytics.getSessionStats().sessionId.split("_")[1]),
      })
    }
  }, [])

  return <>{children}</>
}

"use client"

import { useState, useEffect, useRef } from "react"
import Script from "next/script"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MessageCircle } from "lucide-react"
import { EnhancedChatbotSkeleton } from "@/components/enhanced-chatbot-skeleton"
import SuppressResizeObserverError from "./suppress-resize-observer-error"
import { useRouter, useSearchParams } from "next/navigation"
import {
  CheckCircle,
  Truck,
  Building2,
  Languages,
  Pill,
  Users,
  Calendar,
  Brain,
  Sparkles,
  Zap,
  Shield,
  Clock,
  ShoppingBag,
  Tag,
  MapPin,
  FileText,
  ClipboardCheck,
  Calculator,
} from "lucide-react"
import { analytics, AnalyticsProvider } from "@/components/analytics-tracker"
import { MicPermissionModal } from "@/components/mic-permission-modal"
import { WaitlistModal } from "@/components/waitlist-modal"

// Throttle function to limit how often a function can be called
function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle = false
  let lastFunc: ReturnType<typeof setTimeout> | null = null
  let lastRan = 0

  return function (this: any, ...args: Parameters<T>): void {
    if (!inThrottle) {
      func.apply(this, args)
      lastRan = Date.now()
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    } else {
      clearTimeout(lastFunc as ReturnType<typeof setTimeout>)
      lastFunc = setTimeout(
        () => {
          if (Date.now() - lastRan >= limit) {
            func.apply(this, args)
            lastRan = Date.now()
          }
        },
        limit - (Date.now() - lastRan),
      )
    }
  }
}

// Safe window resize handler that doesn't use ResizeObserver
function useSafeWindowResize(callback: () => void, delay = 100) {
  useEffect(() => {
    // Use throttled version of the callback
    const throttledCallback = throttle(callback, delay)

    // Add event listener
    window.addEventListener("resize", throttledCallback)

    // Call once on mount
    callback()

    // Clean up
    return () => window.removeEventListener("resize", throttledCallback)
  }, [callback, delay])
}

export default function HomePage() {
  const [chatbotLoaded, setChatbotLoaded] = useState(false)
  const [chatbotError, setChatbotError] = useState(false)
  const [chatbotLoadStartTime, setChatbotLoadStartTime] = useState<number>(0)
  const [selectedSector, setSelectedSector] = useState("trucking")
  const router = useRouter()
  const searchParams = useSearchParams()
  const [micPermission, setMicPermission] = useState<string>("unknown")
  const previousSector = useRef("trucking")
  const truckingScriptRef = useRef<string | null>(null)
  const interpreterScriptRef = useRef<string | null>(null)
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const physicianOfficesScriptRef = useRef<string | null>(null)
  const creditUnionsScriptRef = useRef<string | null>(null)
  const pharmacyScriptRef = useRef<string | null>(null)
  const bpoScriptRef = useRef<string | null>(null)
  const [showInstructions, setShowInstructions] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showBenefits, setShowBenefits] = useState(false)
  const appointmentSettingScriptRef = useRef<string | null>(null)
  const placeholderRemovalInterval = useRef<NodeJS.Timeout | null>(null)
  const contextualizeScriptRef = useRef<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isVoiceActive, setIsVoiceActive] = useState(false)

  // Alphabetically sorted sectors
  const capabilities = [
    { value: "appointment-setting", label: "Appointment Setting", path: "appointment-setting" },
    { value: "contextualize", label: "Contextualize", path: "contextualize" },
  ]

  const sectors = [
    { value: "bpo", label: "BPO", path: "bpo" },
    { value: "consumer-packaged-goods", label: "CPG", path: "consumer-packaged-goods" },
    { value: "credit-unions", label: "Credit Unions", path: "credit-unions" },
    { value: "insurance", label: "Insurance", path: "insurance" },
    { value: "interpreter", label: "Interpreter", path: "interpreter" },
    { value: "pharmacy", label: "Pharmacy", path: "pharmacy" },
    { value: "physician-offices", label: "Physician Offices", path: "physician-offices" },
    { value: "trucking", label: "Trucking", path: "trucking" },
  ]

  // Add script references for the new sectors (around line 200)
  const cpgScriptRef = useRef<string | null>(null)
  const insuranceScriptRef = useRef<string | null>(null)

  // Use our safe window resize handler instead of ResizeObserver
  useSafeWindowResize(() => {
    setIsMobile(window.innerWidth < 768)
  })

  // Handle microphone permission result from modal
  const handleMicPermissionResult = (granted: boolean) => {
    setMicPermission(granted ? "granted" : "denied")
    analytics.trackMicrophonePermission(granted)

    if (granted) {
      console.log("Microphone access granted via modal")
    } else {
      console.log("Microphone access denied or skipped via modal")
    }
  }

  // Auto-detect microphone permissions on load (but don't show modal if already asked)
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      // Check if we've already handled permission in this session
      const hasAskedPermission = sessionStorage.getItem("teleperson_mic_permission_asked")
      const previouslyGranted = sessionStorage.getItem("teleperson_mic_permission_granted")

      if (hasAskedPermission) {
        // Use the previous session result
        setMicPermission(previouslyGranted === "true" ? "granted" : "denied")
        return
      }

      try {
        const permission = await navigator.permissions.query({ name: "microphone" as PermissionName })

        // If permission is already granted, don't show the modal
        if (permission.state === "granted") {
          setMicPermission("granted")
          analytics.trackMicrophonePermission(true)
          sessionStorage.setItem("teleperson_mic_permission_asked", "true")
          sessionStorage.setItem("teleperson_mic_permission_granted", "true")
        } else {
          // Let the modal handle the permission request
          setMicPermission(permission.state)
        }

        permission.addEventListener("change", () => {
          setMicPermission(permission.state)
          analytics.trackMicrophonePermission(permission.state === "granted")
        })
      } catch (error) {
        console.log("Permission API not supported, will use modal")
        // Let the modal handle the permission request
      }
    }

    checkMicrophonePermission()
  }, [])

  // Handle URL-based sector selection
  useEffect(() => {
    const sectorParam = searchParams.get("sector")
    if (sectorParam) {
      const allSectors = [...capabilities, ...sectors]
      const foundSector = allSectors.find((s) => s.path === sectorParam || s.value === sectorParam)
      if (foundSector && foundSector.value !== selectedSector) {
        analytics.trackSectorChange(selectedSector, foundSector.value, "url")
        setSelectedSector(foundSector.value)
      }
    }
  }, [searchParams, selectedSector])

  // Update URL when sector changes
  const updateURL = (sector: string) => {
    const allSectors = [...capabilities, ...sectors]
    const sectorData = allSectors.find((s) => s.value === sector)
    if (sectorData) {
      const newURL = `${window.location.pathname}?sector=${sectorData.path}`
      window.history.pushState({}, "", newURL)
    }
  }

  // Persist chat state in localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("teleperson_chat_state")
    if (savedState) {
      try {
        const state = JSON.parse(savedState)
        if (state.sector && state.sector !== selectedSector) {
          setSelectedSector(state.sector)
        }
      } catch (error) {
        console.warn("Failed to restore chat state:", error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(
      "teleperson_chat_state",
      JSON.stringify({
        sector: selectedSector,
        timestamp: Date.now(),
      }),
    )
  }, [selectedSector])

  const getSectorIcon = (sector: string) => {
    switch (sector) {
      case "appointment-setting":
        return <Calendar className="h-4 w-4 text-indigo-400" />
      case "trucking":
        return <Truck className="h-4 w-4 text-orange-400" />
      case "credit-unions":
        return <Building2 className="h-4 w-4 text-green-400" />
      case "physician-offices":
        return <CheckCircle className="h-4 w-4 text-blue-400" />
      case "interpreter":
        return <Languages className="h-4 w-4 text-purple-400" />
      case "pharmacy":
        return <Pill className="h-4 w-4 text-red-400" />
      case "bpo":
        return <Users className="h-4 w-4 text-teal-400" />
      case "contextualize":
        return <Brain className="h-4 w-4 text-purple-400" />
      case "consumer-packaged-goods":
        return <ShoppingBag className="h-4 w-4 text-yellow-400" />
      case "insurance":
        return <Shield className="h-4 w-4 text-cyan-400" />
      default:
        return <MessageCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getHeroTitle = () => {
    switch (selectedSector) {
      case "appointment-setting":
        return {
          main: "Streamline Your",
          highlight: "Appointment Setting",
          subtitle: "With AI-Powered Scheduling",
        }
      case "trucking":
        return {
          main: "Revolutionize Your",
          highlight: "Trucking Operations",
          subtitle: "With AI-Powered Voice Assistance",
        }
      case "credit-unions":
        return {
          main: "Transform Your",
          highlight: "Member Experience",
          subtitle: "With Intelligent Financial Assistance",
        }
      case "physician-offices":
        return {
          main: "Enhance Your",
          highlight: "Patient Care",
          subtitle: "With Smart Medical Assistance",
        }
      case "interpreter":
        return {
          main: "Bridge Language",
          highlight: "Barriers Instantly",
          subtitle: "With AI-Powered Interpretation",
        }
      case "pharmacy":
        return {
          main: "Streamline Your",
          highlight: "Pharmacy Services",
          subtitle: "With Intelligent Customer Support",
        }
      case "bpo":
        return {
          main: "Optimize Your",
          highlight: "Business Processes",
          subtitle: "With AI-Driven Automation",
        }
      case "contextualize":
        return {
          main: "Enhance Your",
          highlight: "Context Understanding",
          subtitle: "With AI-Powered Intelligence",
        }
      case "consumer-packaged-goods":
        return {
          main: "Elevate Your",
          highlight: "Consumer Products",
          subtitle: "With AI-Powered Customer Engagement",
        }
      case "insurance":
        return {
          main: "Modernize Your",
          highlight: "Insurance Services",
          subtitle: "With Intelligent Policy Assistance",
        }
      default:
        return {
          main: "Reimagine",
          highlight: "Effortless Engagement",
          subtitle: "With Your Customers",
        }
    }
  }

  const getSectorBenefits = () => {
    switch (selectedSector) {
      case "appointment-setting":
        return [
          {
            title: "24/7 Availability",
            description: "Schedule appointments anytime, day or night",
            icon: <Clock className="h-4 w-4 text-indigo-400" />,
          },
          {
            title: "Instant Confirmation",
            description: "Get immediate booking confirmation and reminders",
            icon: <Zap className="h-4 w-4 text-yellow-400" />,
          },
          {
            title: "Smart Scheduling",
            description: "AI optimizes appointment slots for efficiency",
            icon: <Brain className="h-4 w-4 text-purple-400" />,
          },
          {
            title: "Multi-Channel Support",
            description: "Book via phone, web, or voice assistant",
            icon: <Sparkles className="h-4 w-4 text-blue-400" />,
          },
        ]
      case "trucking":
        return [
          {
            title: "Instant Parts Availability",
            description: "Check inventory and pricing in real-time",
            icon: <Zap className="h-4 w-4 text-yellow-400" />,
          },
          {
            title: "24/7 Roadside Support",
            description: "Get help when you need it most on the road",
            icon: <Clock className="h-4 w-4 text-orange-400" />,
          },
          {
            title: "Service Scheduling",
            description: "Book maintenance appointments instantly",
            icon: <Calendar className="h-4 w-4 text-green-400" />,
          },
          {
            title: "Cost Estimates",
            description: "Get accurate pricing for repairs and services",
            icon: <Shield className="h-4 w-4 text-blue-400" />,
          },
        ]
      case "credit-unions":
        return [
          {
            title: "Instant Rate Quotes",
            description: "Get current rates for loans and deposits",
            icon: <Zap className="h-4 w-4 text-yellow-400" />,
          },
          {
            title: "Account Assistance",
            description: "Help with account opening and management",
            icon: <Shield className="h-4 w-4 text-green-400" />,
          },
          {
            title: "Financial Guidance",
            description: "Personalized advice for your financial goals",
            icon: <Brain className="h-4 w-4 text-purple-400" />,
          },
          {
            title: "Member Support",
            description: "Dedicated support for all member needs",
            icon: <Sparkles className="h-4 w-4 text-blue-400" />,
          },
        ]
      case "physician-offices":
        return [
          {
            title: "Easy Appointment Booking",
            description: "Schedule visits quickly and efficiently",
            icon: <Calendar className="h-4 w-4 text-blue-400" />,
          },
          {
            title: "Insurance Verification",
            description: "Instant verification of coverage and benefits",
            icon: <Shield className="h-4 w-4 text-green-400" />,
          },
          {
            title: "Service Information",
            description: "Learn about available medical services",
            icon: <Sparkles className="h-4 w-4 text-purple-400" />,
          },
          {
            title: "Patient Support",
            description: "Get answers to health-related questions",
            icon: <Clock className="h-4 w-4 text-orange-400" />,
          },
        ]
      case "interpreter":
        return [
          {
            title: "Multi-Language Support",
            description: "Professional interpretation in 100+ languages",
            icon: <Languages className="h-4 w-4 text-purple-400" />,
          },
          {
            title: "Instant Availability",
            description: "Connect with interpreters within minutes",
            icon: <Zap className="h-4 w-4 text-yellow-400" />,
          },
          {
            title: "Cost Transparency",
            description: "Clear pricing with no hidden fees",
            icon: <Shield className="h-4 w-4 text-green-400" />,
          },
          {
            title: "Easy Booking",
            description: "Simple scheduling for all interpretation needs",
            icon: <Calendar className="h-4 w-4 text-blue-400" />,
          },
        ]
      case "pharmacy":
        return [
          {
            title: "Prescription Status",
            description: "Check if your medications are ready",
            icon: <Clock className="h-4 w-4 text-orange-400" />,
          },
          {
            title: "Insurance Verification",
            description: "Verify coverage and copay amounts",
            icon: <Shield className="h-4 w-4 text-green-400" />,
          },
          {
            title: "Delivery Options",
            description: "Convenient home delivery services",
            icon: <Zap className="h-4 w-4 text-yellow-400" />,
          },
          {
            title: "Transfer Assistance",
            description: "Easy prescription transfers from other pharmacies",
            icon: <Sparkles className="h-4 w-4 text-blue-400" />,
          },
        ]
      case "bpo":
        return [
          {
            title: "Cost Reduction",
            description: "Reduce operational costs by up to 60%",
            icon: <Shield className="h-4 w-4 text-green-400" />,
          },
          {
            title: "Quality Assurance",
            description: "Rigorous quality control processes",
            icon: <Sparkles className="h-4 w-4 text-blue-400" />,
          },
          {
            title: "Industry Expertise",
            description: "Specialized knowledge across multiple sectors",
            icon: <Brain className="h-4 w-4 text-purple-400" />,
          },
          {
            title: "Scalable Solutions",
            description: "Flexible services that grow with your business",
            icon: <Zap className="h-4 w-4 text-yellow-400" />,
          },
        ]
      case "contextualize":
        return [
          {
            title: "Smart Context Analysis",
            description: "AI understands conversation context and history",
            icon: <Brain className="h-4 w-4 text-purple-400" />,
          },
          {
            title: "Personalized Responses",
            description: "Tailored answers based on user preferences",
            icon: <Sparkles className="h-4 w-4 text-blue-400" />,
          },
          {
            title: "Intelligent Recommendations",
            description: "Proactive suggestions based on context",
            icon: <Zap className="h-4 w-4 text-yellow-400" />,
          },
          {
            title: "Seamless Conversations",
            description: "Natural dialogue flow with context awareness",
            icon: <Clock className="h-4 w-4 text-green-400" />,
          },
        ]
      case "consumer-packaged-goods":
        return [
          {
            title: "Product Information",
            description: "Instant details on product features and availability",
            icon: <ShoppingBag className="h-4 w-4 text-yellow-400" />,
          },
          {
            title: "Customer Support",
            description: "Resolve product inquiries and issues efficiently",
            icon: <Users className="h-4 w-4 text-green-400" />,
          },
          {
            title: "Promotional Guidance",
            description: "Information on current deals and promotions",
            icon: <Tag className="h-4 w-4 text-blue-400" />,
          },
          {
            title: "Retailer Locator",
            description: "Find nearby stores carrying your products",
            icon: <MapPin className="h-4 w-4 text-red-400" />,
          },
        ]
      case "insurance":
        return [
          {
            title: "Policy Information",
            description: "Quick access to coverage details and benefits",
            icon: <FileText className="h-4 w-4 text-cyan-400" />,
          },
          {
            title: "Claims Assistance",
            description: "Streamlined claims filing and status updates",
            icon: <ClipboardCheck className="h-4 w-4 text-green-400" />,
          },
          {
            title: "Quote Generation",
            description: "Instant premium estimates for new policies",
            icon: <Calculator className="h-4 w-4 text-purple-400" />,
          },
          {
            title: "24/7 Support",
            description: "Round-the-clock assistance for urgent matters",
            icon: <Clock className="h-4 w-4 text-blue-400" />,
          },
        ]
      default:
        return [
          {
            title: "Instant Support",
            description: "Get help when you need it",
            icon: <Zap className="h-4 w-4 text-yellow-400" />,
          },
          {
            title: "24/7 Availability",
            description: "Always here to assist you",
            icon: <Clock className="h-4 w-4 text-orange-400" />,
          },
          {
            title: "Expert Knowledge",
            description: "Professional guidance and advice",
            icon: <Brain className="h-4 w-4 text-purple-400" />,
          },
          {
            title: "Easy Access",
            description: "Simple and convenient service",
            icon: <Sparkles className="h-4 w-4 text-blue-400" />,
          },
        ]
    }
  }

  // Function to activate voice chat by clicking the phone button in the chatbot
  const speakWithJessica = () => {
    const startTime = Date.now()

    try {
      console.log("🎯 Starting enhanced voice chat activation...")

      // Function to find and click phone button - now more targeted
      const findAndClickPhoneButton = (container: Document | HTMLElement = document, attempt = 1): boolean => {
        console.log(`🔍 Search attempt ${attempt} in:`, container === document ? "main document" : "container")

        // More specific selectors for phone/voice buttons, excluding page controls
        const phoneSelectors = [
          // Chatbot-specific selectors first
          '#chatbot-container [aria-label*="phone" i]',
          '#chatbot-container [title*="phone" i]',
          '#chatbot-container [aria-label*="voice" i]',
          '#chatbot-container [title*="voice" i]',
          '#chatbot-container [aria-label*="call" i]',
          '#chatbot-container [title*="call" i]',
          '#chatbot-container [aria-label*="microphone" i]',
          '#chatbot-container [title*="microphone" i]',
          '#chatbot-container [aria-label*="mic" i]',
          '#chatbot-container [class*="phone"]',
          '#chatbot-container [class*="voice"]',
          '#chatbot-container [class*="mic"]',
          '#chatbot-container [class*="call"]',
          '#chatbot-container [class*="audio"]',
          '#chatbot-container [class*="speak"]',

          // Generic phone/voice selectors (but exclude page controls)
          '[aria-label*="phone" i]:not([aria-label*="fullscreen" i]):not([aria-label*="expand" i]):not([aria-label*="minimize" i])',
          '[title*="phone" i]:not([title*="fullscreen" i]):not([title*="expand" i]):not([title*="minimize" i])',
          '[aria-label*="voice" i]:not([aria-label*="fullscreen" i]):not([aria-label*="expand" i]):not([aria-label*="minimize" i])',
          '[title*="voice" i]:not([title*="fullscreen" i]):not([title*="expand" i]):not([title*="minimize" i])',
          '[aria-label*="call" i]:not([aria-label*="fullscreen" i]):not([aria-label*="expand" i]):not([aria-label*="minimize" i])',
          '[title*="call" i]:not([title*="fullscreen" i]):not([aria-label*="expand" i]):not([title*="minimize" i])',
          '[aria-label*="microphone" i]:not([aria-label*="fullscreen" i]):not([aria-label*="expand" i]):not([aria-label*="minimize" i])',
          '[title*="microphone" i]:not([aria-label*="fullscreen" i]):not([aria-label*="expand" i]):not([aria-label*="minimize" i])',
          '[aria-label*="mic" i]:not([aria-label*="fullscreen" i]):not([aria-label*="expand" i]):not([aria-label*="minimize" i])',
        ]

        // Search through all selectors
        for (const selector of phoneSelectors) {
          try {
            const elements = container.querySelectorAll(selector)
            console.log(`📋 Selector "${selector}" found ${elements.length} elements`)

            for (let i = 0; i < elements.length; i++) {
              const element = elements[i] as HTMLElement

              // Skip if element is not visible
              if (element.offsetParent === null && element.style.display !== "none") {
                continue
              }

              // Skip if element is part of page controls (header, navigation, etc.)
              const isPageControl =
                element.closest("header") ||
                element.closest("nav") ||
                element.closest('[class*="header"]') ||
                element.closest('[class*="navigation"]') ||
                element.closest('[class*="menu"]')

              if (isPageControl) {
                console.log(`⏭️ Skipping page control element:`, element)
                continue
              }

              const text = (element.textContent || "").toLowerCase().trim()
              const title = (element.getAttribute("title") || "").toLowerCase()
              const ariaLabel = (element.getAttribute("aria-label") || "").toLowerCase()
              const className = (element.className || "").toString().toLowerCase()
              const id = (element.id || "").toLowerCase()
              const innerHTML = element.innerHTML.toLowerCase()

              // Exclude fullscreen/expand related elements
              const isFullscreenControl =
                text.includes("fullscreen") ||
                text.includes("expand") ||
                text.includes("minimize") ||
                title.includes("fullscreen") ||
                title.includes("expand") ||
                title.includes("minimize") ||
                ariaLabel.includes("fullscreen") ||
                ariaLabel.includes("expand") ||
                ariaLabel.includes("minimize") ||
                className.includes("fullscreen") ||
                className.includes("expand") ||
                className.includes("minimize")

              if (isFullscreenControl) {
                console.log(`⏭️ Skipping fullscreen control:`, element)
                continue
              }

              // Check for phone/voice indicators
              const phoneKeywords = ["phone", "voice", "call", "mic", "microphone", "speak", "audio", "talk"]
              const hasPhoneKeyword = phoneKeywords.some(
                (keyword) =>
                  text.includes(keyword) ||
                  title.includes(keyword) ||
                  ariaLabel.includes(keyword) ||
                  className.includes(keyword) ||
                  id.includes(keyword) ||
                  innerHTML.includes(keyword),
              )

              // Check for phone-like SVG icons
              const svgs = element.querySelectorAll("svg")
              let hasPhoneSvg = false

              for (let j = 0; j < svgs.length; j++) {
                const svg = svgs[j]
                const viewBox = svg.getAttribute("viewBox") || ""
                const svgClass = (svg.className || "").toString().toLowerCase()
                const paths = svg.querySelectorAll("path")

                // Common phone icon characteristics
                if (
                  viewBox.includes("24") ||
                  viewBox.includes("22") ||
                  svgClass.includes("phone") ||
                  svgClass.includes("call") ||
                  svgClass.includes("mic")
                ) {
                  hasPhoneSvg = true
                  break
                }

                // Check path data for phone-like shapes
                for (let k = 0; k < paths.length; k++) {
                  const pathData = paths[k].getAttribute("d") || ""
                  if (pathData.length > 50) {
                    // Phone icons typically have complex paths
                    hasPhoneSvg = true
                    break
                  }
                }
              }

              // Log element details for debugging
              if (hasPhoneKeyword || hasPhoneSvg) {
                console.log(`🎯 Potential phone button found:`, {
                  element,
                  text,
                  title,
                  ariaLabel,
                  className,
                  id,
                  hasPhoneKeyword,
                  hasPhoneSvg,
                  tagName: element.tagName,
                  visible: element.offsetParent !== null,
                  isInChatbot: !!element.closest("#chatbot-container"),
                })

                // Prioritize elements inside chatbot container
                const isInChatbot = !!element.closest("#chatbot-container")
                if (isInChatbot || attempt > 3) {
                  // Try to click the element
                  if (clickElement(element)) {
                    console.log(`✅ Successfully clicked phone button!`)
                    setIsVoiceActive(true)
                    analytics.trackVoiceActivation(true, "auto_click")
                    return true
                  }
                }
              }
            }
          } catch (error) {
            console.log(`❌ Error with selector "${selector}":`, error)
          }
        }

        return false
      }

      // Enhanced click function
      const clickElement = (element: HTMLElement): boolean => {
        try {
          console.log(`🖱️ Attempting to click element:`, element)

          // Method 1: Standard click
          element.click()
          console.log(`✓ Standard click executed`)

          // Method 2: Mouse events
          const mouseEvents = ["mousedown", "mouseup", "click"]
          mouseEvents.forEach((eventType) => {
            const event = new MouseEvent(eventType, {
              bubbles: true,
              cancelable: true,
              view: window,
              button: 0,
            })
            element.dispatchEvent(event)
          })
          console.log(`✓ Mouse events dispatched`)

          // Method 3: Touch events (for mobile)
          try {
            const touchStart = new TouchEvent("touchstart", { bubbles: true })
            const touchEnd = new TouchEvent("touchend", { bubbles: true })
            element.dispatchEvent(touchStart)
            element.dispatchEvent(touchEnd)
            console.log(`✓ Touch events dispatched`)
          } catch (e) {
            console.log(`⚠️ Touch events not supported`)
          }

          // Method 4: Focus and keyboard
          try {
            element.focus()
            const enterEvent = new KeyboardEvent("keydown", {
              key: "Enter",
              code: "Enter",
              bubbles: true,
            })
            element.dispatchEvent(enterEvent)
            console.log(`✓ Focus and Enter key dispatched`)
          } catch (e) {
            console.log(`⚠️ Keyboard events failed`)
          }

          // Method 5: Pointer events
          try {
            const pointerDown = new PointerEvent("pointerdown", { bubbles: true })
            const pointerUp = new PointerEvent("pointerup", { bubbles: true })
            element.dispatchEvent(pointerDown)
            element.dispatchEvent(pointerUp)
            console.log(`✓ Pointer events dispatched`)
          } catch (e) {
            console.log(`⚠️ Pointer events not supported`)
          }

          return true
        } catch (error) {
          console.error(`❌ Error clicking element:`, error)
          return false
        }
      }

      // Function to search in iframes
      const searchInIframes = (): boolean => {
        const iframes = document.querySelectorAll("iframe")
        console.log(`🖼️ Found ${iframes.length} iframes to search`)

        for (let i = 0; i < iframes.length; i++) {
          try {
            const iframe = iframes[i] as HTMLIFrameElement
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document

            if (iframeDoc) {
              console.log(`🔍 Searching in iframe ${i + 1}`)
              if (findAndClickPhoneButton(iframeDoc)) {
                return true
              }
            } else {
              console.log(`⚠️ Cannot access iframe ${i + 1} (cross-origin)`)
            }
          } catch (error) {
            console.log(`❌ Error accessing iframe ${i + 1}:`, error)
          }
        }

        return false
      }

      // Function to try global chatbot methods
      const tryGlobalMethods = (): boolean => {
        console.log(`🌐 Trying global chatbot methods...`)

        const globalObjects = [
          (window as any).telepersonChatbot,
          (window as any).chatbot,
          (window as any).webAgent,
          (window as any).voiceChat,
          (window as any).assistant,
        ]

        const methods = [
          "startVoice",
          "activateVoice",
          "enableVoice",
          "toggleVoice",
          "startCall",
          "call",
          "startAudio",
          "enableAudio",
          "activatePhone",
          "startPhone",
        ]

        for (const obj of globalObjects) {
          if (obj && typeof obj === "object") {
            console.log(`🔍 Found global object:`, obj)

            for (const method of methods) {
              if (typeof obj[method] === "function") {
                try {
                  console.log(`🎯 Trying ${method}()`)
                  obj[method]()
                  console.log(`✅ Successfully called ${method}()`)
                  setIsVoiceActive(true)
                  analytics.trackVoiceActivation(true, `global_${method}`)
                  return true
                } catch (error) {
                  console.log(`❌ ${method}() failed:`, error)
                }
              }
            }
          }
        }

        return false
      }

      // Main execution with multiple attempts - prioritize chatbot container
      const executeWithRetry = (maxAttempts = 6) => {
        let attempt = 1

        const tryActivation = () => {
          console.log(`\n🚀 Voice activation attempt ${attempt}/${maxAttempts}`)

          // Step 1: Search specifically in chatbot container FIRST
          const chatbotContainer = document.getElementById("chatbot-container")
          if (chatbotContainer) {
            console.log(`🤖 Searching in chatbot container first...`)
            if (findAndClickPhoneButton(chatbotContainer, attempt)) {
              console.log(`🎉 Phone button found and clicked in chatbot container!`)
              return
            }
          }

          // Step 2: Search in iframes (chatbot might be in iframe)
          console.log(`🖼️ Searching in iframes...`)
          if (searchInIframes()) {
            console.log(`🎉 Phone button found and clicked in iframe!`)
            return
          }

          // Step 3: Search in main document (but exclude page controls)
          console.log(`📄 Searching in main document (excluding page controls)...`)
          if (findAndClickPhoneButton(document, attempt)) {
            console.log(`🎉 Phone button found and clicked in main document!`)
            return
          }

          // Step 4: Try global methods
          if (attempt === maxAttempts) {
            console.log(`🌐 Final attempt - trying global methods...`)
            if (tryGlobalMethods()) {
              console.log(`🎉 Voice activated via global method!`)
              return
            }
          }

          // Retry if not successful and attempts remaining
          if (attempt < maxAttempts) {
            attempt++
            const delay = attempt * 1000 // Increasing delay
            console.log(`⏳ Retrying in ${delay}ms...`)
            setTimeout(tryActivation, delay)
          } else {
            console.log(`❌ All ${maxAttempts} attempts failed - phone button not found`)
            analytics.trackVoiceActivation(false, "auto_click", "button_not_found")

            // Final fallback - show user guidance
            console.log(`💡 Suggestion: Look for a phone 📞 or microphone 🎤 icon in the chatbot and click it manually`)
          }
        }

        tryActivation()
      }

      // Start the process
      executeWithRetry()
    } catch (error) {
      console.error("💥 Critical error in speakWithJessica:", error)
      analytics.trackVoiceActivation(false, "auto_click", error instanceof Error ? error.message : "unknown_error")
      return false
    }
  }

  // Function to clear the placeholder text from chatbot input
  const clearChatbotPlaceholder = () => {
    try {
      // Try different selectors to find the input field
      const inputSelectors = [
        'input[placeholder*="two people meet at a hotel"]',
        'textarea[placeholder*="two people meet at a hotel"]',
        'input[placeholder*="Catskills"]',
        'textarea[placeholder*="Catskills"]',
        'input[placeholder*="1950"]',
        'textarea[placeholder*="1950"]',
        'input[type="text"]',
        "textarea",
        ".chatbot-input",
        '[role="textbox"]',
        '[contenteditable="true"]',
      ]

      // Try to find the input using various selectors
      let chatInput = null
      for (const selector of inputSelectors) {
        const elements = document.querySelectorAll(selector)
        if (elements.length > 0) {
          // Check if any element has the specific placeholder text
          for (let i = 0; i < elements.length; i++) {
            const element = elements[i]
            const placeholder = element.getAttribute("placeholder") || element.getAttribute("data-placeholder") || ""
            if (
              placeholder.toLowerCase().includes("two people meet at a hotel") ||
              placeholder.toLowerCase().includes("catskills") ||
              placeholder.toLowerCase().includes("1950")
            ) {
              chatInput = element
              break
            }
          }
          if (chatInput) break

          // If no specific match, use the last one as fallback
          if (!chatInput) {
            chatInput = elements[elements.length - 1]
          }
        }
      }

      // If we found an input element, clear its placeholder
      if (chatInput) {
        if ("placeholder" in chatInput) {
          // For standard input/textarea elements
          chatInput.setAttribute("placeholder", "")
          chatInput.placeholder = ""
        } else if (chatInput.hasAttribute("data-placeholder")) {
          // For elements with data-placeholder attribute
          chatInput.setAttribute("data-placeholder", "")
        }

        console.log("Chatbot placeholder cleared")

        // If we found and cleared the input, we can stop the interval
        if (placeholderRemovalInterval.current) {
          clearInterval(placeholderRemovalInterval.current)
          placeholderRemovalInterval.current = null
        }
      }
    } catch (error) {
      console.error("Error clearing chatbot placeholder:", error)
    }
  }

  const requestMicrophoneAccess = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      setMicPermission("granted")
      analytics.trackMicrophonePermission(true)
      console.log("Microphone access granted")
    } catch (error) {
      console.error("Microphone access denied:", error)
      setMicPermission("denied")
      analytics.trackMicrophonePermission(false)
    }
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // Check if fullscreen is supported
        if (!document.documentElement.requestFullscreen) {
          console.warn("Fullscreen API not supported")
          return
        }

        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        // Check if exitFullscreen is available
        if (!document.exitFullscreen) {
          console.warn("Exit fullscreen not supported")
          return
        }

        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.warn("Fullscreen operation failed:", error)
      // Don't throw the error, just log it and continue
      // This prevents the error from breaking the app
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  // Cache script content for each sector
  useEffect(() => {
    // Cache scripts for faster loading
    if (!interpreterScriptRef.current) {
      interpreterScriptRef.current = `
        (function () {
          var d = document;
          var s = d.createElement("script");
          s.src = "https://teleperson.webagent.ai/api/chatbot/industry/interpreter";
          s.async = true;
          d.getElementsByTagName("head")[0].appendChild(s);
        })();
      `
    }

    if (!truckingScriptRef.current) {
      truckingScriptRef.current = `
        (function () {
          var d = document;
          var s = d.createElement("script");
          s.src = "https://teleperson.webagent.ai/api/chatbot/industry/trucking";
          s.async = true;
          d.getElementsByTagName("head")[0].appendChild(s);
        })();
      `
    }

    if (!physicianOfficesScriptRef.current) {
      physicianOfficesScriptRef.current = `
        (function () {
          var d = document;
          var s = d.createElement("script");
          s.src = "https://teleperson.webagent.ai/api/chatbot/industry/doctor-offices";
          s.async = true;
          d.getElementsByTagName("head")[0].appendChild(s);
        })();
      `
    }

    if (!creditUnionsScriptRef.current) {
      creditUnionsScriptRef.current = `
        (function () {
          var d = document;
          var s = d.createElement("script");
          s.src = "https://teleperson.webagent.ai/api/chatbot/industry/creditunion";
          s.async = true;
          d.getElementsByTagName("head")[0].appendChild(s);
        })();
      `
    }

    if (!pharmacyScriptRef.current) {
      pharmacyScriptRef.current = `
        (function () {
          var d = document;
          var s = d.createElement("script");
          s.src = "https://teleperson.webagent.ai/api/chatbot/industry/pharmacy";
          s.async = true;
          d.getElementsByTagName("head")[0].appendChild(s);
        })();
      `
    }

    if (!bpoScriptRef.current) {
      bpoScriptRef.current = `
        (function () {
          var d = document;
          var s = d.createElement("script");
          s.src = "https://teleperson.webagent.ai/api/chatbot/industry/bpo";
          s.async = true;
          d.getElementsByTagName("head")[0].appendChild(s);
        })();
      `
    }

    if (!appointmentSettingScriptRef.current) {
      appointmentSettingScriptRef.current = `
    (function () {
      var d = document;
      var s = d.createElement("script");
      s.src = "https://teleperson.webagent.ai/api/chatbot/industry/sales";
      s.async = true;
      d.getElementsByTagName("head")[0].appendChild(s);
    })();
  `
    }
    if (!contextualizeScriptRef.current) {
      contextualizeScriptRef.current = `
    (function () {
      var d = document;
      var s = d.createElement("script");
      s.src = "https://teleperson.webagent.ai/api/chatbot/industry/contextualize";
      s.async = true;
      d.getElementsByTagName("head")[0].appendChild(s);
    })();
  `
    }

    if (!cpgScriptRef.current) {
      cpgScriptRef.current = `
  (function () {
    var d = document;
    var s = d.createElement("script");
    s.src = "https://teleperson.webagent.ai/api/chatbot/industry/consumerpackagedgoods";
    s.async = true;
    d.getElementsByTagName("head")[0].appendChild(s);
  })();
`
    }

    if (!insuranceScriptRef.current) {
      insuranceScriptRef.current = `
    (function () {
      var d = document;
      var s = d.createElement("script");
      s.src = "https://teleperson.webagent.ai/api/chatbot/industry/pharmacy";
      s.async = true;
      d.getElementsByTagName("head")[0].appendChild(s);
    })();
  `
    }
  }, [])

  const handleSectorChange = (newSector: string) => {
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current)
    }

    // Track sector change
    analytics.trackSectorChange(selectedSector, newSector, "dropdown")

    previousSector.current = selectedSector
    setSelectedSector(newSector)
    setChatbotLoaded(false)
    setChatbotError(false)
    setShowMobileMenu(false) // Close mobile menu when sector changes
    setIsVoiceActive(false) // Reset voice state
    setChatbotLoadStartTime(Date.now()) // Track load time

    // Update URL
    updateURL(newSector)

    const container = document.getElementById("chatbot-container")
    if (container) {
      while (container.firstChild) {
        container.removeChild(container.firstChild)
      }
    }

    console.log(`Switching to ${newSector} sector from ${previousSector.current}`)

    const existingScripts = document.querySelectorAll('script[src*="teleperson.webagent.ai"]')
    existingScripts.forEach((script) => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    })

    setTimeout(() => {
      if (newSector === "appointment-setting" && appointmentSettingScriptRef.current) {
        console.log("Using cached appointment setting script for faster loading")
        injectScript(appointmentSettingScriptRef.current)
      } else if (newSector === "trucking" && truckingScriptRef.current) {
        injectScript(truckingScriptRef.current)
      } else if (newSector === "interpreter" && interpreterScriptRef.current) {
        injectScript(interpreterScriptRef.current)
      } else if (newSector === "physician-offices" && physicianOfficesScriptRef.current) {
        injectScript(physicianOfficesScriptRef.current)
      } else if (newSector === "credit-unions" && creditUnionsScriptRef.current) {
        injectScript(creditUnionsScriptRef.current)
      } else if (newSector === "pharmacy" && pharmacyScriptRef.current) {
        injectScript(pharmacyScriptRef.current)
      } else if (newSector === "bpo" && bpoScriptRef.current) {
        injectScript(bpoScriptRef.current)
      } else if (newSector === "contextualize" && contextualizeScriptRef.current) {
        console.log("Using cached contextualize script for faster loading")
        injectScript(contextualizeScriptRef.current)
      } else if (newSector === "consumer-packaged-goods" && cpgScriptRef.current) {
        console.log("Using cached CPG script for faster loading")
        injectScript(cpgScriptRef.current)
      } else if (newSector === "insurance" && insuranceScriptRef.current) {
        console.log("Using cached insurance script for faster loading")
        injectScript(insuranceScriptRef.current)
      } else {
        injectSectorScript(newSector)
      }

      // Set up interval to clear placeholder after chatbot loads
      if (placeholderRemovalInterval.current) {
        clearInterval(placeholderRemovalInterval.current)
      }

      placeholderRemovalInterval.current = setInterval(clearChatbotPlaceholder, 500)

      // Safety timeout to clear the interval after 10 seconds if it hasn't been cleared already
      setTimeout(() => {
        if (placeholderRemovalInterval.current) {
          clearInterval(placeholderRemovalInterval.current)
          placeholderRemovalInterval.current = null
        }
      }, 10000)
    }, 100)

    // Set a longer timeout for chatbot loaded state
    setTimeout(() => {
      setChatbotLoaded(true)
      const loadTime = Date.now() - chatbotLoadStartTime
      analytics.trackChatbotLoad(newSector, loadTime, true)
    }, 2000)
  }

  const injectScript = (scriptContent: string) => {
    try {
      const existingScripts = document.querySelectorAll('script[src*="teleperson.webagent.ai"]')
      existingScripts.forEach((script) => {
        if (script.parentNode) {
          script.parentNode.removeChild(script)
        }
      })

      const script = document.createElement("script")
      script.type = "text/javascript"
      script.innerHTML = scriptContent

      const head = document.getElementsByTagName("head")[0]
      if (head) {
        head.appendChild(script)
      }

      // Set loaded after a delay to show skeleton
      setTimeout(() => {
        setChatbotLoaded(true)
        const loadTime = Date.now() - chatbotLoadStartTime
        analytics.trackChatbotLoad(selectedSector, loadTime, true)
      }, 1500)
    } catch (error) {
      console.error("Error injecting script:", error)
      setChatbotError(true)
      const loadTime = Date.now() - chatbotLoadStartTime
      analytics.trackChatbotLoad(selectedSector, loadTime, false)
    }
  }

  const injectSectorScript = (sector: string) => {
    let scriptUrl = ""

    switch (sector) {
      case "appointment-setting":
        scriptUrl = "https://teleperson.webagent.ai/api/chatbot/industry/sales"
        break
      case "physician-offices":
        scriptUrl = "https://teleperson.webagent.ai/api/chatbot/industry/doctor-offices"
        break
      case "trucking":
        scriptUrl = "https://teleperson.webagent.ai/api/chatbot/industry/trucking"
        break
      case "interpreter":
        scriptUrl = "https://teleperson.webagent.ai/api/chatbot/industry/interpreter"
        break
      case "credit-unions":
        scriptUrl = "https://teleperson.webagent.ai/api/chatbot/industry/creditunion"
        break
      case "pharmacy":
        scriptUrl = "https://teleperson.webagent.ai/api/chatbot/industry/pharmacy"
        break
      case "bpo":
        scriptUrl = "https://teleperson.webagent.ai/api/chatbot/industry/bpo"
        break
      case "contextualize":
        scriptUrl = "https://teleperson.webagent.ai/api/chatbot/industry/contextualize"
        break
      case "consumer-packaged-goods":
        scriptUrl = "https://teleperson.webagent.ai/api/chatbot/industry/consumerpackagedgoods"
        break
      case "insurance":
        scriptUrl = "https://teleperson.webagent.ai/api/chatbot/industry/pharmacy"
        break
      default:
        scriptUrl = "https://teleperson.webagent.ai/api/chatbot/industry/sales"
    }

    const script = document.createElement("script")
    script.src = scriptUrl
    script.async = true

    script.crossOrigin = "anonymous"

    script.onload = () => {
      console.log(`${sector} script loaded successfully`)
      setTimeout(() => {
        setChatbotLoaded(true)
        const loadTime = Date.now() - chatbotLoadStartTime
        analytics.trackChatbotLoad(sector, loadTime, true)
      }, 1500)
    }

    script.onerror = () => {
      console.error(`Failed to load ${sector} script`)
      setChatbotError(true)
      const loadTime = Date.now() - chatbotLoadStartTime
      analytics.trackChatbotLoad(sector, loadTime, false)
    }

    document.head.appendChild(script)
  }

  useEffect(() => {
    setChatbotLoadStartTime(Date.now())

    const timer = setTimeout(() => {
      setChatbotLoaded(true)
      const errorElements = document.querySelectorAll('[class*="error"], [data-error]')
      if (errorElements.length > 0) {
        setChatbotError(true)
      }
      const loadTime = Date.now() - chatbotLoadStartTime
      analytics.trackChatbotLoad(selectedSector, loadTime, !errorElements.length)
    }, 5000)

    // Set up interval to clear placeholder after initial load
    placeholderRemovalInterval.current = setInterval(clearChatbotPlaceholder, 500)

    // Safety timeout to clear the interval after 10 seconds if it hasn't been cleared already
    setTimeout(() => {
      if (placeholderRemovalInterval.current) {
        clearInterval(placeholderRemovalInterval.current)
        placeholderRemovalInterval.current = null
      }
    }, 10000)

    return () => {
      clearTimeout(timer)
      if (placeholderRemovalInterval.current) {
        clearInterval(placeholderRemovalInterval.current)
      }
    }
  }, [])

  // Watch for chatbot content changes - using throttled approach instead of MutationObserver
  useEffect(() => {
    const chatbotContainer = document.getElementById("chatbot-container")
    if (!chatbotContainer) return

    // Instead of using MutationObserver, we'll use a simple interval check
    // This is less efficient but avoids ResizeObserver issues
    const checkInterval = 1000 // Check every second
    let lastButtonCount = 0

    const intervalId = setInterval(() => {
      try {
        const buttons = chatbotContainer.querySelectorAll('button, [role="button"]')

        if (buttons.length !== lastButtonCount) {
          console.log(`🔄 Chatbot content changed, buttons: ${buttons.length} (was ${lastButtonCount})`)
          lastButtonCount = buttons.length
        }
      } catch (e) {
        // Silently ignore errors
      }
    }, checkInterval)

    return () => clearInterval(intervalId)
  }, [])

  const heroTitle = getHeroTitle()

  // Add global error handler for ResizeObserver errors
  useEffect(() => {
    // Suppress ResizeObserver loop errors globally
    const originalError = console.error
    console.error = (...args) => {
      if (args[0] && typeof args[0] === "string" && args[0].includes("ResizeObserver loop")) {
        // Ignore ResizeObserver loop errors
        return
      }
      originalError.apply(console, args)
    }

    return () => {
      console.error = originalError
    }
  }, [])

  // Set initial load time
  useEffect(() => {
    setChatbotLoadStartTime(Date.now())

    // Set a timeout to mark chatbot as loaded after a delay
    const timer = setTimeout(() => {
      setChatbotLoaded(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <AnalyticsProvider>
      {/* Add our ResizeObserver error suppressor */}
      <SuppressResizeObserverError />

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* Microphone Permission Modal */}
        <MicPermissionModal onPermissionResult={handleMicPermissionResult} />

        {/* Header */}
        <header className="p-4 border-b border-gray-800">
          <div className="container mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <Image
                  src="/images/teleperson-logo.png"
                  alt="Teleperson Logo"
                  width={160}
                  height={40}
                  className="h-8 w-auto"
                />
              </div>
              <WaitlistModal selectedSector={selectedSector}>
                <Button className="bg-orange-600 hover:bg-orange-700">Join Waitlist</Button>
              </WaitlistModal>
            </div>
          </div>
        </header>

        {/* Sector Selection */}
        <div className="container mx-auto p-4">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-gray-400 text-sm">Select Industry:</span>
            <div className="flex flex-wrap gap-2">
              {sectors.map((sector) => (
                <Button
                  key={sector.value}
                  variant={selectedSector === sector.value ? "default" : "outline"}
                  size="sm"
                  className={`flex items-center gap-1.5 ${
                    selectedSector === sector.value
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                  onClick={() => handleSectorChange(sector.value)}
                >
                  {getSectorIcon(sector.value)}
                  <span>{sector.label}</span>
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-400 text-sm">Select Capabilities:</span>
            <div className="flex flex-wrap gap-2">
              {capabilities.map((capability) => (
                <Button
                  key={capability.value}
                  variant={selectedSector === capability.value ? "default" : "outline"}
                  size="sm"
                  className={`flex items-center gap-1.5 ${
                    selectedSector === capability.value
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                  onClick={() => handleSectorChange(capability.value)}
                >
                  {getSectorIcon(capability.value)}
                  <span>{capability.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto p-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white"></h1>
          </div>

          <Card className="bg-gray-900 border-gray-800 shadow-xl">
            <CardContent className="p-6">
              <div
                className="w-full h-[60vh] rounded-lg relative overflow-hidden border border-gray-800"
                id="chatbot-container"
                style={{ contain: "strict" }} // Add CSS containment to prevent layout thrashing
              >
                {!chatbotLoaded && <EnhancedChatbotSkeleton />}

                {chatbotError && (
                  <div className="absolute inset-0 flex items-center justify-center p-4 bg-gray-900">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">Chatbot Temporarily Unavailable</h3>
                      <p className="text-gray-400 mb-4">
                        We're experiencing technical difficulties. Please try refreshing the page.
                      </p>
                      <Button onClick={() => window.location.reload()}>Refresh Page</Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Load the teleperson chatbot script */}
        <Script
          id="teleperson-chatbot"
          strategy="afterInteractive"
          onLoad={() => {
            console.log("Teleperson script loaded successfully")
            setTimeout(() => {
              setChatbotLoaded(true)
              const loadTime = Date.now() - chatbotLoadStartTime
              analytics.trackChatbotLoad(selectedSector, loadTime, true)
            }, 1500)

            // Try to clear placeholder after script loads
            setTimeout(clearChatbotPlaceholder, 1000)
            setTimeout(clearChatbotPlaceholder, 2000)
            setTimeout(clearChatbotPlaceholder, 3000)
          }}
          onError={(error) => {
            console.error("Teleperson script failed to load:", error)
            setChatbotError(true)
            const loadTime = Date.now() - chatbotLoadStartTime
            analytics.trackChatbotLoad(selectedSector, loadTime, false)
          }}
        >
          {`
  (function () {
    console.log('Starting Teleperson chatbot initialization for ${selectedSector}...');
    
    function loadChatbotMethod1() {
        var d = document;
        var s = d.createElement("script");
        
        var chatbotUrl;
        switch('${selectedSector}') {
            case 'appointment-setting':
                chatbotUrl = "https://teleperson.webagent.ai/api/chatbot/industry/sales";
                break;
            case 'physician-offices':
                chatbotUrl = "https://teleperson.webagent.ai/api/chatbot/industry/doctor-offices";
                break;
            case 'trucking':
                chatbotUrl = "https://teleperson.webagent.ai/api/chatbot/industry/trucking";
                break;
            case 'interpreter':
                chatbotUrl = "https://teleperson.webagent.ai/api/chatbot/industry/interpreter";
                break;
            case 'credit-unions':
                chatbotUrl = "https://teleperson.webagent.ai/api/chatbot/industry/creditunion";
                break;
            case 'pharmacy':
                chatbotUrl = "https://teleperson.webagent.ai/api/chatbot/industry/pharmacy";
                break;
            case 'bpo':
                chatbotUrl = "https://teleperson.webagent.ai/api/chatbot/industry/bpo";
                break;
            case 'contextualize':
                chatbotUrl = "https://teleperson.webagent.ai/api/chatbot/industry/contextualize";
                break;
            case 'consumer-packaged-goods':
                chatbotUrl = "https://teleperson.webagent.ai/api/chatbot/industry/consumerpackagedgoods";
                break;
            case 'insurance':
                chatbotUrl = "https://teleperson.webagent.ai/api/chatbot/industry/pharmacy";
                break;
            default:
                chatbotUrl = "https://teleperson.webagent.ai/api/chatbot/industry/sales";
                break;
        }
        
        s.src = chatbotUrl;
        s.async = true;
        s.crossOrigin = "anonymous";
        
        s.onload = function() {
            console.log('Teleperson script loaded successfully for ${selectedSector}');
            initializeChatbot();
        };
        
        s.onerror = function(error) {
            console.error('Script loading failed:', error);
        };
        
        d.getElementsByTagName("head")[0].appendChild(s);
    }
    
    function initializeChatbot() {
        setTimeout(function() {
            try {
                var sessionData = {
                    conversationId: 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    userId: 'user_' + Date.now(),
                    domain: window.location.hostname,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    language: navigator.language || 'en-US',
                    sector: '${selectedSector}'
                };
                
                console.log('Initializing with session data:', sessionData);
                
                if (window.telepersonChatbot) {
                    if (typeof window.telepersonChatbot.init === 'function') {
                        window.telepersonChatbot.init(sessionData);
                    } else if (typeof window.telepersonChatbot.setConfig === 'function') {
                        window.telepersonChatbot.setConfig(sessionData);
                    }
                } else if (window.chatbot) {
                    if (typeof window.chatbot.initialize === 'function') {
                        window.chatbot.initialize(sessionData);
                    } else if (typeof window.chatbot.config === 'function') {
                        window.chatbot.config(sessionData);
                    }
                }
                
                // Try to clear the placeholder text after initialization
                setTimeout(function() {
                  try {
                    var inputs = document.querySelectorAll('input, textarea');
                    if (inputs && inputs.length > 0) {
                      for (var i = 0; i < inputs.length; i++) {
                        var placeholder = inputs[i].getAttribute('placeholder') || inputs[i].getAttribute('data-placeholder') || '';
                        if (placeholder.toLowerCase().indexOf('two people meet at a hotel') !== -1 || 
                            placeholder.toLowerCase().indexOf('catskills') !== -1 || 
                            placeholder.toLowerCase().indexOf('1950') !== -1) {
                          inputs[i].setAttribute('placeholder', '');
                          inputs[i].placeholder = '';
                          if (inputs[i].hasAttribute('data-placeholder')) {
                            inputs[i].setAttribute('data-placeholder', '');
                          }
                        }
                      }
                    }
                  } catch (e) {
                    console.error('Error clearing placeholder:', e);
                  }
                }, 1000);
                  
              } catch (error) {
                  console.error('Chatbot initialization error:', error);
              }
        }, 500);
    }
    
    loadChatbotMethod1();
    
  })();
`}
        </Script>

        {/* Inject CSS to hide the placeholder */}
        <style jsx global>{`
          input[placeholder*="two people meet at a hotel"],
          textarea[placeholder*="two people meet at a hotel"],
          input[placeholder*="Catskills"],
          textarea[placeholder*="Catskills"],
          input[placeholder*="1950"],
          textarea[placeholder*="1950"],
          [data-placeholder*="two people meet at a hotel"],
          [data-placeholder*="Catskills"],
          [data-placeholder*="1950"] {
            placeholder: "" !important;
          }
          
          /* Hide any placeholder containing these keywords */
          input::-webkit-input-placeholder,
          textarea::-webkit-input-placeholder {
            color: transparent !important;
          }

          input:-moz-placeholder,
          textarea:-moz-placeholder {
            color: transparent !important;
          }

          input::-moz-placeholder,
          textarea::-moz-placeholder {
            color: transparent !important;
          }

          input:-ms-input-placeholder,
          textarea:-ms-input-placeholder {
            color: transparent !important;
          }

          input::placeholder,
          textarea::placeholder {
            color: transparent !important;
          }
          /* Prevent layout thrashing */
          .size-stable {
            contain: layout size style;
          }

          /* Force hardware acceleration for animations */
          .hardware-accelerated {
            transform: translateZ(0);
            backface-visibility: hidden;
            perspective: 1000px;
          }

          /* Optimize animations */
          @media (prefers-reduced-motion: reduce) {
            * {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
              scroll-behavior: auto !important;
            }
          }

          /* Add will-change hints for browser optimization */
          .animate-pulse,
          .animate-bounce,
          .animate-spin,
          .animate-ping {
            will-change: transform, opacity;
          }

          /* Prevent ResizeObserver issues with iframes */
          #chatbot-container iframe {
            height: 100% !important;
            width: 100% !important;
            min-height: 300px;
            position: relative !important;
            display: block !important;
          }

          /* Fix for chatbot container */
          #chatbot-container {
            position: relative;
            pointer-events: auto;
            isolation: isolate;
          }

          #chatbot-container iframe,
          #chatbot-container > div:not(.absolute) {
            width: 100% !important;
            height: 100% !important;
            border: none !important;
            border-radius: 8px !important;
          }
        `}</style>
      </div>
    </AnalyticsProvider>
  )
}

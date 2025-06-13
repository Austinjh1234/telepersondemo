"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquare, Move, X } from "lucide-react"
import { ExpandableTopics } from "@/components/expandable-topics"

interface ConversationTopicsDialogProps {
  selectedSector: string
}

export function ConversationTopicsDialog({ selectedSector }: ConversationTopicsDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isMobile, setIsMobile] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    // Disable dragging on mobile
    if (isMobile) return

    if (e.target === e.currentTarget || (e.target as HTMLElement).closest(".drag-handle")) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    // Disable dragging on mobile
    if (isMobile) return

    const touch = e.touches[0]
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest(".drag-handle")) {
      setIsDragging(true)
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      })
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && !isMobile) {
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y

      // Keep dialog within viewport bounds - increased width
      const maxX = window.innerWidth - (isMobile ? window.innerWidth * 0.95 : 480)
      const maxY = window.innerHeight - (isMobile ? window.innerHeight * 0.8 : 300)

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      })
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging && !isMobile) {
      const touch = e.touches[0]
      const newX = touch.clientX - dragStart.x
      const newY = touch.clientY - dragStart.y

      const maxX = window.innerWidth - 480
      const maxY = window.innerHeight - 300

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging && !isMobile) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchmove", handleTouchMove)
      document.addEventListener("touchend", handleTouchEnd)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.removeEventListener("touchmove", handleTouchMove)
        document.removeEventListener("touchend", handleTouchEnd)
      }
    }
  }, [isDragging, dragStart, isMobile])

  // Reset position when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (isMobile) {
        // Center on mobile
        setPosition({
          x: window.innerWidth * 0.025, // 2.5% margin on each side for 95% width
          y: window.innerHeight * 0.1, // 10% from top
        })
      } else {
        // Default desktop position
        setPosition({ x: 50, y: 100 })
      }
    }
  }, [isOpen, isMobile])

  const getDialogStyles = () => {
    if (isMobile) {
      return {
        left: position.x,
        top: position.y,
        width: "95vw",
        maxWidth: "95vw",
        maxHeight: "80vh",
        zIndex: 9999,
      }
    } else {
      return {
        left: position.x,
        top: position.y,
        width: "480px", // Increased from 400px
        maxWidth: "480px", // Increased from 400px
        maxHeight: "500px",
        zIndex: 9999,
      }
    }
  }

  const getContentMaxHeight = () => {
    if (isMobile) {
      return "65vh" // Leave room for header on mobile
    } else {
      return "400px"
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-3 sm:px-6 py-2 rounded-lg shadow-lg transition-all duration-200 min-w-[140px] sm:min-w-[180px] text-xs sm:text-sm"
      >
        <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
        <span className="hidden sm:inline">Conversation Topics</span>
        <span className="sm:hidden">Topics</span>
      </Button>

      {isOpen && (
        <>
          {/* Mobile backdrop */}
          {isMobile && <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />}

          <div className="fixed inset-0 z-50 pointer-events-none">
            <div
              ref={dialogRef}
              className="absolute bg-gray-900 border border-gray-700 rounded-lg shadow-2xl pointer-events-auto"
              style={getDialogStyles()}
            >
              {/* Header */}
              <div
                className={`flex items-center justify-between p-3 sm:p-4 bg-gray-800 rounded-t-lg border-b border-gray-700 ${
                  !isMobile ? "cursor-move drag-handle" : ""
                }`}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
              >
                <div className="flex items-center gap-2">
                  {!isMobile && <Move className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />}
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {isMobile ? "Conversation Topics" : "Topics"}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white p-1 h-auto min-w-[32px] min-h-[32px] flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-3 sm:p-4 overflow-y-auto" style={{ maxHeight: getContentMaxHeight() }}>
                <ExpandableTopics selectedSector={selectedSector} initiallyExpanded={isMobile} />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Mic, MicOff, Volume2 } from "lucide-react"

interface MicPermissionModalProps {
  onPermissionResult: (granted: boolean) => void
}

export function MicPermissionModal({ onPermissionResult }: MicPermissionModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    // Check if we've already asked for permission in this session
    const hasAskedPermission = sessionStorage.getItem("teleperson_mic_permission_asked")

    if (!hasAskedPermission) {
      // Small delay to let the page load first
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [])

  const handleEnableMic = async () => {
    setIsRequesting(true)

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log("Microphone access granted")
      onPermissionResult(true)
      setIsOpen(false)
      sessionStorage.setItem("teleperson_mic_permission_asked", "true")
      sessionStorage.setItem("teleperson_mic_permission_granted", "true")
    } catch (error) {
      console.error("Microphone access denied:", error)
      onPermissionResult(false)
      setIsOpen(false)
      sessionStorage.setItem("teleperson_mic_permission_asked", "true")
      sessionStorage.setItem("teleperson_mic_permission_granted", "false")
    } finally {
      setIsRequesting(false)
    }
  }

  const handleSkip = () => {
    onPermissionResult(false)
    setIsOpen(false)
    sessionStorage.setItem("teleperson_mic_permission_asked", "true")
    sessionStorage.setItem("teleperson_mic_permission_granted", "false")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[450px] bg-gray-900 border-gray-800">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <Volume2 className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-white">Enable Voice Chat?</DialogTitle>
          <DialogDescription className="text-gray-400 text-base leading-relaxed">
            Get the full experience with voice-powered conversations. You can talk directly to our AI assistant using
            your microphone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {/* Benefits */}
          <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
            <h4 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Voice Chat Benefits:
            </h4>
            <ul className="text-blue-200 text-sm space-y-1">
              <li>• Natural conversation experience</li>
              <li>• Hands-free interaction</li>
              <li>• Faster than typing</li>
              <li>• More engaging assistance</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleEnableMic}
              disabled={isRequesting}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12"
            >
              {isRequesting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Requesting Access...
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Enable Microphone
                </>
              )}
            </Button>

            <Button
              onClick={handleSkip}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-800 hover:bg-gray-700 hover:text-white h-12"
            >
              <MicOff className="h-4 w-4 mr-2" />
              Skip for Now
            </Button>
          </div>

          {/* Privacy Note */}
          <p className="text-xs text-gray-500 text-center">
            🔒 Your privacy is protected. Audio is only processed during active conversations and is not stored.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

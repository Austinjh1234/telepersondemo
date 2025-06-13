"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Globe, Check } from "lucide-react"

interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
}

const languages: Language[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
]

interface LanguageSelectorProps {
  onLanguageChange?: (language: Language) => void
}

export function LanguageSelector({ onLanguageChange }: LanguageSelectorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(languages[0])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleLanguageChange = (language: Language) => {
    setSelectedLanguage(language)
    setIsOpen(false)
    onLanguageChange?.(language)

    // Store language preference
    localStorage.setItem("preferred-language", language.code)

    // Send message to chatbot to switch language
    sendLanguageChangeMessage(language)
  }

  const sendLanguageChangeMessage = (language: Language) => {
    try {
      // Try to find chatbot input and send language change message
      const chatInputs = document.querySelectorAll('input[type="text"], textarea')
      if (chatInputs.length > 0) {
        const lastInput = chatInputs[chatInputs.length - 1] as HTMLInputElement
        const message = getLanguageChangeMessage(language)

        // Set the message
        lastInput.value = message
        lastInput.focus()

        // Trigger input event
        const event = new Event("input", { bubbles: true })
        lastInput.dispatchEvent(event)

        // Try to find and click send button after a short delay
        setTimeout(() => {
          const sendButtons = document.querySelectorAll(
            'button[type="submit"], button[aria-label*="send" i], button[title*="send" i]',
          )
          if (sendButtons.length > 0) {
            const sendButton = sendButtons[sendButtons.length - 1] as HTMLButtonElement
            sendButton.click()
          }
        }, 500)
      }
    } catch (error) {
      console.error("Error sending language change message:", error)
    }
  }

  const getLanguageChangeMessage = (language: Language): string => {
    const messages = {
      en: "Please respond in English from now on.",
      es: "Por favor responde en español a partir de ahora.",
      fr: "Veuillez répondre en français à partir de maintenant.",
      de: "Bitte antworten Sie ab sofort auf Deutsch.",
      it: "Per favore rispondi in italiano d'ora in poi.",
      pt: "Por favor responda em português a partir de agora.",
      ja: "これからは日本語で回答してください。",
      ko: "이제부터 한국어로 답변해 주세요.",
      zh: "请从现在开始用中文回答。",
      ar: "يرجى الرد باللغة العربية من الآن فصاعداً.",
      ru: "Пожалуйста, отвечайте на русском языке с этого момента.",
      hi: "कृपया अब से हिंदी में उत्तर दें।",
    }
    return messages[language.code as keyof typeof messages] || messages.en
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-white hover:bg-gray-700/50 p-2"
        title={`Language: ${selectedLanguage.nativeName}`}
      >
        <Globe className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language)}
              className="w-full px-3 py-2 text-left hover:bg-gray-600 focus:bg-gray-600 focus:outline-none text-white flex items-center gap-2"
            >
              <span>{language.flag}</span>
              <div className="flex flex-col items-start flex-1">
                <span className="font-medium">{language.nativeName}</span>
                <span className="text-xs text-gray-400">{language.name}</span>
              </div>
              {selectedLanguage.code === language.code && <Check className="h-4 w-4 text-orange-500 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

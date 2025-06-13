"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Flame, TrendingUp, Star } from "lucide-react"

interface ExpandableTopicsProps {
  selectedSector: string
  initiallyExpanded?: boolean
}

export function ExpandableTopics({ selectedSector, initiallyExpanded = false }: ExpandableTopicsProps) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded)
  const [isMobile, setIsMobile] = useState(false)

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Mock data for top questions - in production this would come from analytics
  const getTopQuestions = (sector: string): string[] => {
    const topQuestionsByCategory = {
      trucking: [
        "What truck parts do you have in stock?",
        "How much does an oil change cost?",
        "Do you offer roadside assistance?",
        "What are your service hours?",
        "Do you have Freightliner parts?",
      ],
      "credit-unions": [
        "What are your current loan rates?",
        "How do I open a savings account?",
        "Do you offer online banking?",
        "What are the benefits of membership?",
        "What are your checking account options?",
      ],
      "physician-offices": [
        "How do I schedule an appointment?",
        "What insurance do you accept?",
        "Do you offer same-day appointments?",
        "Can I get my test results online?",
        "What services do you provide?",
      ],
      interpreter: [
        "What languages do you support?",
        "How do I book an interpreter?",
        "Do you have ASL interpreters?",
        "How much does interpretation cost?",
        "What are your availability hours?",
      ],
      pharmacy: [
        "Is my prescription ready?",
        "Do you accept my insurance?",
        "Do you provide vaccinations?",
        "Can you transfer my prescription?",
        "Do you offer automatic refills?",
      ],
      bpo: [
        "What services do you offer?",
        "How can you help reduce our costs?",
        "How do you ensure quality?",
        "How long does implementation take?",
        "What's your pricing model?",
      ],
      "appointment-setting": [
        "What appointment times are available?",
        "How do I reschedule my appointment?",
        "Can I schedule for next week?",
        "What services can I book?",
        "Do you have same-day appointments?",
      ],
      contextualize: [
        "Can you remember what we discussed earlier?",
        "Based on our conversation, what would you recommend?",
        "Can you customize your responses for my industry?",
        "Can we continue where we left off?",
        "How do you understand complex scenarios?",
      ],
      "consumer-packaged-goods": [
        "Where can I buy your products?",
        "What are the ingredients in this product?",
        "Do you offer coupons or discounts?",
        "How do I use this product?",
        "Is this product environmentally friendly?",
      ],
      insurance: [
        "How do I file a claim?",
        "What does my policy cover?",
        "How much is a quote for auto insurance?",
        "Can I add another person to my policy?",
        "What discounts are available?",
      ],
    }

    return topQuestionsByCategory[sector as keyof typeof topQuestionsByCategory] || []
  }

  const getTopicsByCategory = () => {
    switch (selectedSector) {
      case "trucking":
        return {
          "Parts & Inventory": [
            "What truck parts do you have in stock?",
            "Do you have Freightliner parts?",
            "What's the price for a new air filter?",
            "Do you carry aftermarket parts?",
            "How long to get a special order part?",
          ],
          "Service & Maintenance": [
            "How much does an oil change cost?",
            "Can you do a brake inspection?",
            "What's your labor rate?",
            "Do you offer mobile service?",
            "How long for a complete engine overhaul?",
          ],
          "Roadside Assistance": [
            "Do you offer roadside assistance?",
            "How quickly can you get to a breakdown?",
            "What's the cost for towing?",
            "Do you handle tire blowouts?",
            "Can you jump start my truck?",
          ],
          "Business Information": [
            "What are your service hours?",
            "Where are you located?",
            "Do you offer financing?",
            "What payment methods do you accept?",
            "Do you have overnight parking?",
          ],
        }
      case "credit-unions":
        return {
          "Accounts & Banking": [
            "What are your checking account options?",
            "How do I open a savings account?",
            "What are your current CD rates?",
            "Do you offer business accounts?",
            "What are your account fees?",
          ],
          "Loans & Mortgages": [
            "What are your current loan rates?",
            "How do I apply for a mortgage?",
            "Do you offer auto loans?",
            "What's your home equity line rate?",
            "Can I get pre-approved for a loan?",
          ],
          "Online Services": [
            "Do you offer online banking?",
            "How do I set up bill pay?",
            "Is mobile deposit available?",
            "How secure is your online banking?",
            "Can I apply for loans online?",
          ],
          "Member Services": [
            "What are the benefits of membership?",
            "How do I join your credit union?",
            "Do you have financial advisors?",
            "What insurance products do you offer?",
            "Do you have notary services?",
          ],
        }
      case "physician-offices":
        return {
          Appointments: [
            "How do I schedule an appointment?",
            "Do you offer same-day appointments?",
            "How do I cancel an appointment?",
            "What's your cancellation policy?",
            "Can I schedule online?",
          ],
          "Insurance & Billing": [
            "What insurance do you accept?",
            "Do you take Medicare?",
            "How much is a visit without insurance?",
            "Can I set up a payment plan?",
            "How do I submit an insurance claim?",
          ],
          Services: [
            "What services do you provide?",
            "Do you offer telehealth visits?",
            "Can I get lab work done here?",
            "Do you do X-rays on site?",
            "Do you offer preventative care?",
          ],
          "Medical Records": [
            "Can I get my test results online?",
            "How do I access my medical records?",
            "Can you send my records to another doctor?",
            "How long do you keep medical records?",
            "Is my health information secure?",
          ],
        }
      case "interpreter":
        return {
          "Language Services": [
            "What languages do you support?",
            "Do you have ASL interpreters?",
            "Can you handle rare languages?",
            "Do you offer simultaneous interpretation?",
            "Can you translate technical terminology?",
          ],
          "Booking & Availability": [
            "How do I book an interpreter?",
            "What are your availability hours?",
            "How much advance notice do you need?",
            "Can I request a specific interpreter?",
            "Do you have 24/7 emergency services?",
          ],
          "Services & Pricing": [
            "How much does interpretation cost?",
            "Do you offer video interpretation?",
            "What's the minimum booking time?",
            "Do you offer volume discounts?",
            "Can you handle conference interpretation?",
          ],
          "Document Services": [
            "Do you provide document translation?",
            "How quickly can you translate documents?",
            "Can you certify translations?",
            "What file formats do you accept?",
            "How much does document translation cost?",
          ],
        }
      case "pharmacy":
        return {
          Prescriptions: [
            "Is my prescription ready?",
            "Can you transfer my prescription?",
            "Do you offer automatic refills?",
            "How do I check prescription status?",
            "Can you deliver my medications?",
          ],
          "Insurance & Billing": [
            "Do you accept my insurance?",
            "What's my copay amount?",
            "Do you have a discount program?",
            "Can I use GoodRx coupons?",
            "Do you bill Medicare Part D?",
          ],
          Services: [
            "Do you provide vaccinations?",
            "Can I get a flu shot today?",
            "Do you offer medication reviews?",
            "Can you compound medications?",
            "Do you have a drive-through?",
          ],
          Products: [
            "What over-the-counter medications do you recommend?",
            "Do you carry medical supplies?",
            "Do you have diabetic supplies?",
            "What vitamins do you recommend?",
            "Do you sell mobility aids?",
          ],
        }
      case "bpo":
        return {
          Services: [
            "What services do you offer?",
            "Do you handle customer support?",
            "Can you manage our back office?",
            "Do you offer data entry services?",
            "Can you handle technical support?",
          ],
          "Cost & Efficiency": [
            "How can you help reduce our costs?",
            "What's your pricing model?",
            "How do you measure efficiency?",
            "What ROI can we expect?",
            "Do you offer volume discounts?",
          ],
          "Quality & Compliance": [
            "How do you ensure quality?",
            "What compliance standards do you follow?",
            "How do you handle data security?",
            "What's your quality assurance process?",
            "Do you have ISO certification?",
          ],
          Implementation: [
            "How long does implementation take?",
            "What's your onboarding process?",
            "How do you handle knowledge transfer?",
            "Can you integrate with our systems?",
            "What technology do you use?",
          ],
        }
      case "appointment-setting":
        return {
          "Scheduling Options": [
            "What appointment times are available?",
            "Can I schedule for next week?",
            "Do you have same-day appointments?",
            "What's your earliest available slot?",
            "Can I book recurring appointments?",
          ],
          "Appointment Management": [
            "How do I reschedule my appointment?",
            "Can I cancel my appointment?",
            "Will I get a reminder?",
            "How do I confirm my appointment?",
            "Can I change the appointment type?",
          ],
          "Service Information": [
            "What services can I book?",
            "How long will my appointment take?",
            "What should I bring to my appointment?",
            "Do you offer virtual appointments?",
            "What are your consultation fees?",
          ],
          "Contact & Support": [
            "How can I contact you directly?",
            "What if I'm running late?",
            "Do you have a cancellation policy?",
            "Can I speak to someone now?",
            "How do I update my contact information?",
          ],
        }
      case "contextualize":
        return {
          "Context Understanding": [
            "Can you remember what we discussed earlier?",
            "Based on our conversation, what would you recommend?",
            "How does this relate to my previous question?",
            "Can you provide more context about this topic?",
            "What additional information do you need?",
          ],
          Personalization: [
            "Can you customize your responses for my industry?",
            "How can you adapt to my communication style?",
            "Can you learn my preferences over time?",
            "How do you personalize recommendations?",
            "Can you remember my specific requirements?",
          ],
          "Intelligent Analysis": [
            "Can you analyze the context of my request?",
            "How do you determine the best response?",
            "Can you provide insights based on our discussion?",
            "How do you understand complex scenarios?",
            "Can you help me think through this problem?",
          ],
          "Conversation Flow": [
            "Can we continue where we left off?",
            "How do you maintain conversation continuity?",
            "Can you reference earlier parts of our chat?",
            "How do you handle topic transitions?",
            "Can you summarize our discussion so far?",
          ],
        }
      case "consumer-packaged-goods":
        return {
          "Product Information": [
            "What are the ingredients in this product?",
            "Is this product gluten-free?",
            "How do I use this product?",
            "What sizes does this product come in?",
            "Is this product environmentally friendly?",
          ],
          "Purchase & Availability": [
            "Where can I buy your products?",
            "Is this product in stock near me?",
            "Do you sell directly to consumers?",
            "Which retailers carry your products?",
            "Can I order online?",
          ],
          "Promotions & Pricing": [
            "Do you offer coupons or discounts?",
            "What's the price of this product?",
            "Are there any current promotions?",
            "Do you have a loyalty program?",
            "Are there bulk purchase discounts?",
          ],
          "Customer Support": [
            "How do I return a product?",
            "What's your satisfaction guarantee?",
            "How can I provide feedback?",
            "Can I speak to customer service?",
            "How do I report a product issue?",
          ],
        }
      case "insurance":
        return {
          "Policy Information": [
            "What does my policy cover?",
            "When does my coverage expire?",
            "How do I access my policy documents?",
            "Can I add another person to my policy?",
            "What are my coverage limits?",
          ],
          "Claims Process": [
            "How do I file a claim?",
            "What's the status of my claim?",
            "What documents do I need for a claim?",
            "How long does claims processing take?",
            "Can I track my claim online?",
          ],
          "Quotes & Pricing": [
            "How much is a quote for auto insurance?",
            "What discounts are available?",
            "How can I lower my premium?",
            "Do you offer multi-policy discounts?",
            "How is my premium calculated?",
          ],
          "Account Management": [
            "How do I make a payment?",
            "Can I change my coverage online?",
            "How do I update my personal information?",
            "Can I add a vehicle to my policy?",
            "How do I set up automatic payments?",
          ],
        }
      default:
        return {
          "General Questions": [
            "How can I help you today?",
            "What services do you offer?",
            "What are your hours?",
            "How can I contact you?",
            "Where are you located?",
          ],
        }
    }
  }

  const topics = getTopicsByCategory()
  const categories = Object.keys(topics)
  const topQuestions = getTopQuestions(selectedSector)

  // Show only first 2 categories when collapsed, or all on mobile when initially expanded
  const visibleCategories = isExpanded ? categories : categories.slice(0, isMobile ? 3 : 2)

  const isTopQuestion = (question: string): boolean => {
    return topQuestions.includes(question)
  }

  const getTopQuestionBadge = (question: string, index: number) => {
    if (!isTopQuestion(question)) return null

    const topIndex = topQuestions.indexOf(question)

    if (topIndex === 0) {
      return (
        <div className="flex items-center gap-1 ml-2">
          <Flame className="h-3 w-3 text-red-500" />
          <span className="text-xs font-bold text-red-500">#1</span>
        </div>
      )
    } else if (topIndex <= 2) {
      return (
        <div className="flex items-center gap-1 ml-2">
          <TrendingUp className="h-3 w-3 text-orange-500" />
          <span className="text-xs font-semibold text-orange-500">#{topIndex + 1}</span>
        </div>
      )
    } else if (topIndex <= 4) {
      return (
        <div className="flex items-center gap-1 ml-2">
          <Star className="h-3 w-3 text-yellow-500" />
          <span className="text-xs font-medium text-yellow-500">Top</span>
        </div>
      )
    }

    return null
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {visibleCategories.map((category) => (
        <div key={category} className="space-y-2">
          <h4 className="font-medium text-white text-sm sm:text-base">{category}</h4>
          <div className="space-y-1.5 sm:space-y-2">
            {topics[category].slice(0, isExpanded ? undefined : isMobile ? 4 : 3).map((question, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full text-left justify-start h-auto p-2.5 sm:p-3 text-xs sm:text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 border border-gray-700/50 hover:border-gray-600 leading-relaxed"
                onClick={() => {
                  // Try to find the chatbot input and populate it
                  const chatInputs = document.querySelectorAll('input[type="text"], textarea')
                  if (chatInputs.length > 0) {
                    const lastInput = chatInputs[chatInputs.length - 1] as HTMLInputElement
                    lastInput.value = question
                    lastInput.focus()

                    // Try to trigger the input event
                    const event = new Event("input", { bubbles: true })
                    lastInput.dispatchEvent(event)
                  }
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <span className="text-orange-400 mr-2 flex-shrink-0">•</span>
                    <span className="text-left break-words">{question}</span>
                  </div>
                  {getTopQuestionBadge(question, index)}
                </div>
              </Button>
            ))}
          </div>
        </div>
      ))}

      {!initiallyExpanded && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-3 sm:mt-4 bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white text-xs sm:text-sm min-h-[40px] sm:min-h-[36px]"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Show Less Topics</span>
              <span className="sm:hidden">Show Less</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Show More Topics</span>
              <span className="sm:hidden">Show More</span>
            </>
          )}
        </Button>
      )}
    </div>
  )
}

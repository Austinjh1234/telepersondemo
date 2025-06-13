"use client"

import type React from "react"
import { uniqueCountries } from "@/data/countries" // Import uniqueCountries from the appropriate file

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Loader2 } from "lucide-react"

interface WaitlistFormData {
  firstName: string
  lastName: string
  title: string
  company: string
  email: string
  phone: string
  countryCode: string
  companySize: string
  currentChallenges: string
  chatbotStatus: string
  timeline: string
}

interface WaitlistModalProps {
  children: React.ReactNode
  selectedSector?: string
}

export function WaitlistModal({ children, selectedSector = "trucking" }: WaitlistModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string>("")
  const [formData, setFormData] = useState<WaitlistFormData>({
    firstName: "",
    lastName: "",
    title: "",
    company: "",
    email: "",
    phone: "",
    countryCode: "+1",
    companySize: "",
    currentChallenges: "",
    chatbotStatus: "",
    timeline: "",
  })
  const [errors, setErrors] = useState<Partial<WaitlistFormData>>({})

  const formatPhoneNumber = (value: string, countryCode: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "")

    if (countryCode === "+1") {
      // US/Canada formatting: (XXX) XXX-XXXX
      if (digits.length <= 3) {
        return digits
      } else if (digits.length <= 6) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
      } else {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
      }
    } else {
      // For other countries, just return the digits with spaces every 3-4 digits
      if (digits.length <= 4) {
        return digits
      } else if (digits.length <= 8) {
        return `${digits.slice(0, 4)} ${digits.slice(4)}`
      } else {
        return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`
      }
    }
  }

  const getSelectedCountry = () => {
    return uniqueCountries.find((country) => country.code === formData.countryCode) || uniqueCountries[0]
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<WaitlistFormData> = {}

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.title.trim()) newErrors.title = "Title is required"
    if (!formData.company.trim()) newErrors.company = "Company is required"
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    if (!formData.companySize) newErrors.companySize = "Please select company size"
    if (!formData.timeline) newErrors.timeline = "Please select implementation timeline"
    if (!formData.chatbotStatus) newErrors.chatbotStatus = "Please select your current chatbot status"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof WaitlistFormData, value: string) => {
    if (field === "phone") {
      const formattedPhone = formatPhoneNumber(value, formData.countryCode)
      setFormData((prev) => ({ ...prev, [field]: formattedPhone }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleCountryCodeChange = (newCountryCode: string) => {
    setFormData((prev) => ({
      ...prev,
      countryCode: newCountryCode,
      phone: formatPhoneNumber(prev.phone, newCountryCode),
    }))
  }

  const submitToHubSpot = async (data: WaitlistFormData) => {
    try {
      const hubspotData = {
        properties: {
          firstname: data.firstName,
          lastname: data.lastName,
          jobtitle: data.title,
          company: data.company,
          email: data.email,
          phone: `${data.countryCode} ${data.phone}`, // Include country code with phone
          employee_range: data.companySize,
          current_customer_service_challenges: data.currentChallenges,
          implementation_timeline: data.timeline,
          chatbot_status: data.chatbotStatus,
        },
      }

      const response = await fetch("/api/hubspot-submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(hubspotData),
      })

      // Check if response is ok first
      if (!response.ok) {
        const errorText = await response.text()
        console.error("HTTP Error:", response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text()
        console.error("Non-JSON response:", responseText)
        throw new Error("Server returned non-JSON response")
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Submission failed")
      }

      console.log("Submission successful:", result.message)
      return result
    } catch (error) {
      console.error("Submission error:", error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setError("") // Clear any previous errors

    try {
      // Submit to HubSpot
      await submitToHubSpot(formData)

      setIsSubmitted(true)

      // Reset form after successful submission
      setTimeout(() => {
        setIsOpen(false)
        setIsSubmitted(false)
        setFormData({
          firstName: "",
          lastName: "",
          title: "",
          company: "",
          email: "",
          phone: "",
          countryCode: "+1",
          companySize: "",
          currentChallenges: "",
          chatbotStatus: "",
          timeline: "",
        })
      }, 2000)
    } catch (error) {
      console.error("Submission error:", error)
      setError(error instanceof Error ? error.message : "Failed to submit. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const chatbotOptions = [
    { value: "none", label: "I don't currently have a chatbot on my site" },
    { value: "simple", label: "I have a simple chatbot on my site" },
    { value: "sophisticated", label: "I have a sophisticated chatbot on my site" },
  ]

  const selectedCountry = getSelectedCountry()

  const getSectorDescription = () => {
    switch (selectedSector) {
      case "trucking":
        return "Be the first to experience AI-powered voice assistance for your trucking operations. Get early access to features that help with parts inventory, service scheduling, and roadside support."
      case "credit-unions":
        return "Transform your member experience with AI-powered financial assistance. Get early access to features that help with loan inquiries, account management, and financial guidance."
      case "physician-offices":
        return "Enhance your patient care with intelligent medical assistance. Get early access to features that streamline appointment booking, insurance verification, and patient support."
      case "interpreter":
        return "Bridge language barriers with AI-powered interpretation services. Get early access to multi-language support, instant availability, and seamless booking features."
      case "pharmacy":
        return "Streamline your pharmacy services with intelligent customer support. Get early access to features that help with prescription status checks, insurance verification, and delivery coordination."
      case "bpo":
        return "Optimize your business processes with AI-driven automation. Get early access to cost reduction tools, quality assurance features, and scalable solutions."
      case "consumer-packaged-goods":
        return "Elevate your consumer products with AI-powered customer engagement. Get early access to features that enhance product information, customer support, and promotional strategies."
      case "insurance":
        return "Modernize your insurance services with intelligent policy assistance. Get early access to features that streamline claims processing, policy management, and customer support."
      default:
        return "Be the first to know about new AI features and solutions for your industry. Fill out the form below to get early access."
    }
  }

  const getSectorTitle = () => {
    switch (selectedSector) {
      case "trucking":
        return "Join Our Trucking Waitlist"
      case "credit-unions":
        return "Join Our Credit Union Waitlist"
      case "physician-offices":
        return "Join Our Healthcare Waitlist"
      case "interpreter":
        return "Join Our Interpreter Services Waitlist"
      case "pharmacy":
        return "Join Our Pharmacy Waitlist"
      case "bpo":
        return "Join Our BPO Solutions Waitlist"
      case "consumer-packaged-goods":
        return "Join Our CPG Waitlist"
      case "insurance":
        return "Join Our Insurance Waitlist"
      default:
        return "Join Our Waitlist"
    }
  }

  const getCompanyPlaceholder = () => {
    switch (selectedSector) {
      case "trucking":
        return "ABC Trucking Co."
      case "credit-unions":
        return "Community Credit Union"
      case "physician-offices":
        return "Family Medical Center"
      case "interpreter":
        return "Global Language Services"
      case "pharmacy":
        return "Main Street Pharmacy"
      case "bpo":
        return "Business Solutions Inc."
      case "consumer-packaged-goods":
        return "Quality Products Inc."
      case "insurance":
        return "Reliable Insurance Co."
      default:
        return "Your Company"
    }
  }

  const getTitlePlaceholder = () => {
    switch (selectedSector) {
      case "trucking":
        return "Fleet Manager"
      case "credit-unions":
        return "Member Services Manager"
      case "physician-offices":
        return "Practice Manager"
      case "interpreter":
        return "Language Services Coordinator"
      case "pharmacy":
        return "Pharmacy Manager"
      case "bpo":
        return "Operations Manager"
      case "consumer-packaged-goods":
        return "Brand Manager"
      case "insurance":
        return "Claims Manager"
      default:
        return "Your Title"
    }
  }

  const getChallengesPlaceholder = () => {
    switch (selectedSector) {
      case "trucking":
        return "What trucking operations or customer service challenges are you currently facing?"
      case "credit-unions":
        return "What member service or financial assistance challenges are you currently facing?"
      case "physician-offices":
        return "What patient care or appointment scheduling challenges are you currently facing?"
      case "interpreter":
        return "What language service or interpretation challenges are you currently facing?"
      case "pharmacy":
        return "What pharmacy service or customer support challenges are you currently facing?"
      case "bpo":
        return "What business process or operational challenges are you currently facing?"
      case "consumer-packaged-goods":
        return "What product information or customer engagement challenges are you currently facing?"
      case "insurance":
        return "What policy management or claims processing challenges are you currently facing?"
      default:
        return "What customer service challenges are you currently facing?"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[550px] bg-gray-900 border-gray-800 max-h-[85vh] w-[95vw] sm:w-full mx-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-2xl font-bold text-white">{getSectorTitle()}</DialogTitle>
          <DialogDescription className="text-gray-400">{getSectorDescription()}</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto pr-1 sm:pr-2" style={{ maxHeight: "calc(85vh - 120px)" }}>
          {isSubmitted ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Successfully Added to Waitlist!</h3>
              <p className="text-gray-400">Your information has been saved.</p>
              <p className="text-gray-400 text-sm mt-2">
                We'll be in touch soon with updates and early access opportunities.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-white text-sm">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-orange-500 text-sm"
                    placeholder="John"
                  />
                  {errors.firstName && <p className="text-red-400 text-sm">{errors.firstName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-white text-sm">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-orange-500 text-sm"
                    placeholder="Doe"
                  />
                  {errors.lastName && <p className="text-red-400 text-sm">{errors.lastName}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-white text-sm">
                  Title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-orange-500 text-sm"
                  placeholder={getTitlePlaceholder()}
                />
                {errors.title && <p className="text-red-400 text-sm">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-white text-sm">
                  Company *
                </Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-orange-500 text-sm"
                  placeholder={getCompanyPlaceholder()}
                />
                {errors.company && <p className="text-red-400 text-sm">{errors.company}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white text-sm">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-orange-500 text-sm"
                  placeholder="john@company.com"
                />
                {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white text-sm">
                  Phone Number
                </Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={formData.countryCode} onValueChange={handleCountryCodeChange}>
                    <SelectTrigger className="w-full sm:w-[120px] bg-gray-800 border-gray-700 text-white focus:border-orange-500 text-sm">
                      <SelectValue>
                        <span className="flex items-center gap-2">
                          <span>{selectedCountry.flag}</span>
                          <span>{selectedCountry.code}</span>
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 max-h-[200px]">
                      {uniqueCountries.map((country) => (
                        <SelectItem
                          key={country.code}
                          value={country.code}
                          className="text-white hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white data-[highlighted]:bg-gray-700 data-[highlighted]:text-white"
                        >
                          <span className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{country.code}</span>
                            <span className="text-gray-400 text-sm">{country.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-orange-500 text-sm"
                    placeholder={formData.countryCode === "+1" ? "(555) 123-4567" : "Phone number"}
                  />
                </div>
                {errors.phone && <p className="text-red-400 text-sm">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySize" className="text-white text-sm">
                  Employee Range *
                </Label>
                <Select value={formData.companySize} onValueChange={(value) => handleInputChange("companySize", value)}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-orange-500 text-sm">
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="1-10 employees" className="text-white hover:bg-gray-700">
                      1-10 employees
                    </SelectItem>
                    <SelectItem value="11-50 employees" className="text-white hover:bg-gray-700">
                      11-50 employees
                    </SelectItem>
                    <SelectItem value="51-200 employees" className="text-white hover:bg-gray-700">
                      51-200 employees
                    </SelectItem>
                    <SelectItem value="201-1000 employees" className="text-white hover:bg-gray-700">
                      201-1000 employees
                    </SelectItem>
                    <SelectItem value="1000+ employees" className="text-white hover:bg-gray-700">
                      1000+ employees
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.companySize && <p className="text-red-400 text-sm">{errors.companySize}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeline" className="text-white text-sm">
                  Implementation Timeline *
                </Label>
                <Select value={formData.timeline} onValueChange={(value) => handleInputChange("timeline", value)}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-orange-500 text-sm">
                    <SelectValue placeholder="When are you looking to implement?" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="Immediately" className="text-white hover:bg-gray-700">
                      Immediately
                    </SelectItem>
                    <SelectItem value="1-3 months" className="text-white hover:bg-gray-700">
                      1-3 months
                    </SelectItem>
                    <SelectItem value="3-6 months" className="text-white hover:bg-gray-700">
                      3-6 months
                    </SelectItem>
                    <SelectItem value="6-12 months" className="text-white hover:bg-gray-700">
                      6-12 months
                    </SelectItem>
                    <SelectItem value="Just exploring" className="text-white hover:bg-gray-700">
                      Just exploring
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.timeline && <p className="text-red-400 text-sm">{errors.timeline}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentChallenges" className="text-white text-sm">
                  Current Customer Service Challenges
                </Label>
                <textarea
                  id="currentChallenges"
                  value={formData.currentChallenges}
                  onChange={(e) => handleInputChange("currentChallenges", e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-orange-500 min-h-[60px] w-full rounded-md px-3 py-2 text-sm"
                  placeholder={getChallengesPlaceholder()}
                  rows={2}
                />
                {errors.currentChallenges && <p className="text-red-400 text-sm">{errors.currentChallenges}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="chatbotStatus" className="text-white text-sm">
                  Current Chatbot Status *
                </Label>
                <Select
                  value={formData.chatbotStatus}
                  onValueChange={(value) => handleInputChange("chatbotStatus", value)}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-orange-500 text-sm">
                    <SelectValue placeholder="Select your current chatbot status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {chatbotOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-white hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white data-[highlighted]:bg-gray-700 data-[highlighted]:text-white"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.chatbotStatus && <p className="text-red-400 text-sm">{errors.chatbotStatus}</p>}
              </div>
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white mt-4 sm:mt-6 text-sm sm:text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining Waitlist...
                  </>
                ) : (
                  "Join Waitlist"
                )}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

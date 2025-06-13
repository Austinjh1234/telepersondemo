import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("=== HUBSPOT SUBMIT API CALLED ===")
  console.log("Environment check:")
  console.log("HUBSPOT_API_KEY exists:", !!process.env.HUBSPOT_API_KEY)
  console.log("HUBSPOT_API_KEY format:", process.env.HUBSPOT_API_KEY?.substring(0, 10) + "...")

  let body

  try {
    body = await request.json()
    console.log("Received form data:", {
      email: body.properties?.email,
      name: `${body.properties?.firstname} ${body.properties?.lastname}`,
      company: body.properties?.company,
      phone: body.properties?.phone,
      employeeRange: body.properties?.employee_range,
      challenges: body.properties?.current_customer_service_challenges,
      timeline: body.properties?.implementation_timeline,
      chatbotStatus: body.properties?.chatbot_status,
    })
  } catch (parseError) {
    console.error("Failed to parse request body:", parseError)
    return NextResponse.json(
      {
        success: false,
        error: "Invalid request format",
      },
      { status: 400 },
    )
  }

  try {
    const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY

    // If HubSpot is not configured, still accept the submission but log it
    if (!HUBSPOT_API_KEY) {
      console.log("HubSpot API key not configured. Logging submission:", {
        email: body.properties.email,
        name: `${body.properties.firstname} ${body.properties.lastname}`,
        company: body.properties.company,
        title: body.properties.jobtitle,
        phone: body.properties.phone,
        employeeRange: body.properties.employee_range,
        challenges: body.properties.current_customer_service_challenges,
        timeline: body.properties.implementation_timeline,
        chatbotStatus: body.properties.chatbot_status,
        timestamp: new Date().toISOString(),
      })

      return NextResponse.json({
        success: true,
        message: "Thank you for joining our waitlist! We'll be in touch soon.",
        fallback: true,
      })
    }

    // Map chatbot status to readable text
    const getChatbotStatusText = (status: string) => {
      switch (status) {
        case "none":
          return "No chatbot"
        case "simple":
          return "Simple chatbot"
        case "sophisticated":
          return "Sophisticated chatbot"
        default:
          return status || "Not specified"
      }
    }

    // STEP 1: Create custom properties if they don't exist
    console.log("STEP 1: Creating custom properties...")

    // First check if properties exist using v1 API
    const checkPropertyResponse = await fetch("https://api.hubapi.com/properties/v1/contacts/properties", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${HUBSPOT_API_KEY}`,
      },
    })

    if (!checkPropertyResponse.ok) {
      console.error("Failed to check properties:", await checkPropertyResponse.text())
      throw new Error("Failed to check if properties exist")
    }

    const allProperties = await checkPropertyResponse.json()
    const chatbotPropertyExists = allProperties.some((prop) => prop.name === "current_chatbot_status")
    const waitlistTagPropertyExists = allProperties.some((prop) => prop.name === "waitlist_tag")
    const employeeRangeExists = allProperties.some((prop) => prop.name === "employee_range")
    const challengesExists = allProperties.some((prop) => prop.name === "current_customer_service_challenges")
    const timelineExists = allProperties.some((prop) => prop.name === "implementation_timeline")

    console.log("Chatbot property exists:", chatbotPropertyExists)
    console.log("Waitlist tag property exists:", waitlistTagPropertyExists)
    console.log("Employee range property exists:", employeeRangeExists)
    console.log("Challenges property exists:", challengesExists)
    console.log("Timeline property exists:", timelineExists)

    // Create Current Chatbot Status property if it doesn't exist
    if (!chatbotPropertyExists) {
      const createChatbotPropertyResponse = await fetch("https://api.hubapi.com/properties/v1/contacts/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          name: "current_chatbot_status",
          label: "Current Chatbot Status",
          description: "The current chatbot status of the contact's website",
          groupName: "contactinformation",
          type: "string",
          fieldType: "text",
          formField: true,
          displayOrder: 6,
          options: [],
        }),
      })

      if (!createChatbotPropertyResponse.ok) {
        console.error("Failed to create chatbot property:", await createChatbotPropertyResponse.text())
        throw new Error("Failed to create chatbot status property")
      }

      console.log("Chatbot status property created successfully")
    } else {
      console.log("Chatbot status property already exists")
    }

    // Create Waitlist Tag property if it doesn't exist
    if (!waitlistTagPropertyExists) {
      const createWaitlistTagPropertyResponse = await fetch(
        "https://api.hubapi.com/properties/v1/contacts/properties",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${HUBSPOT_API_KEY}`,
          },
          body: JSON.stringify({
            name: "waitlist_tag",
            label: "Waitlist Tag",
            description: "Tag indicating which waitlist the contact joined",
            groupName: "contactinformation",
            type: "string",
            fieldType: "text",
            formField: true,
            displayOrder: 7,
            options: [],
          }),
        },
      )

      if (!createWaitlistTagPropertyResponse.ok) {
        console.error("Failed to create waitlist tag property:", await createWaitlistTagPropertyResponse.text())
        throw new Error("Failed to create waitlist tag property")
      }

      console.log("Waitlist tag property created successfully")
    } else {
      console.log("Waitlist tag property already exists")
    }

    // Create Employee Range property if it doesn't exist
    if (!employeeRangeExists) {
      const createEmployeeRangeResponse = await fetch("https://api.hubapi.com/properties/v1/contacts/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          name: "employee_range",
          label: "Employee Range",
          description: "The range of employees at the contact's company",
          groupName: "contactinformation",
          type: "string",
          fieldType: "text",
          formField: true,
          displayOrder: 8,
          options: [],
        }),
      })

      if (!createEmployeeRangeResponse.ok) {
        console.error("Failed to create employee range property:", await createEmployeeRangeResponse.text())
        throw new Error("Failed to create employee range property")
      }

      console.log("Employee range property created successfully")
    } else {
      console.log("Employee range property already exists")
    }

    // Create Current Customer Service Challenges property if it doesn't exist
    if (!challengesExists) {
      const createChallengesResponse = await fetch("https://api.hubapi.com/properties/v1/contacts/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          name: "current_customer_service_challenges",
          label: "Current Customer Service Challenges",
          description: "The customer service challenges the contact is facing",
          groupName: "contactinformation",
          type: "string",
          fieldType: "textarea",
          formField: true,
          displayOrder: 9,
          options: [],
        }),
      })

      if (!createChallengesResponse.ok) {
        console.error("Failed to create challenges property:", await createChallengesResponse.text())
        throw new Error("Failed to create challenges property")
      }

      console.log("Challenges property created successfully")
    } else {
      console.log("Challenges property already exists")
    }

    // Create Implementation Timeline property if it doesn't exist
    if (!timelineExists) {
      const createTimelineResponse = await fetch("https://api.hubapi.com/properties/v1/contacts/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          name: "implementation_timeline",
          label: "Implementation Timeline",
          description: "When the contact is looking to implement",
          groupName: "contactinformation",
          type: "string",
          fieldType: "text",
          formField: true,
          displayOrder: 10,
          options: [],
        }),
      })

      if (!createTimelineResponse.ok) {
        console.error("Failed to create timeline property:", await createTimelineResponse.text())
        throw new Error("Failed to create timeline property")
      }

      console.log("Timeline property created successfully")
    } else {
      console.log("Timeline property already exists")
    }

    // STEP 2: Create or update contact
    console.log("STEP 2: Creating or updating contact...")

    // First check if contact exists
    const contactEmail = encodeURIComponent(body.properties.email)
    const checkContactResponse = await fetch(
      `https://api.hubapi.com/contacts/v1/contact/email/${contactEmail}/profile`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
      },
    )

    let contactId
    let isUpdate = false

    if (checkContactResponse.ok) {
      const contactData = await checkContactResponse.json()
      contactId = contactData.vid
      isUpdate = true
      console.log("Found existing contact with ID:", contactId)
    }

    // Prepare contact properties (including all custom properties)
    const contactProperties = [
      { property: "firstname", value: body.properties.firstname },
      { property: "lastname", value: body.properties.lastname },
      { property: "email", value: body.properties.email },
      { property: "jobtitle", value: body.properties.jobtitle },
      { property: "company", value: body.properties.company },
      { property: "phone", value: body.properties.phone },
      { property: "lifecyclestage", value: "lead" },
      { property: "hs_lead_status", value: "NEW" },
      { property: "industry", value: "Transportation/Trucking/Railroad" },
      { property: "current_chatbot_status", value: getChatbotStatusText(body.properties.chatbot_status) },
      { property: "waitlist_tag", value: "Trucking" },
      { property: "employee_range", value: body.properties.employee_range },
      { property: "current_customer_service_challenges", value: body.properties.current_customer_service_challenges },
      { property: "implementation_timeline", value: body.properties.implementation_timeline },
    ]

    if (isUpdate) {
      // Update existing contact
      const updateContactResponse = await fetch(`https://api.hubapi.com/contacts/v1/contact/vid/${contactId}/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({ properties: contactProperties }),
      })

      if (!updateContactResponse.ok) {
        console.error("Failed to update contact:", await updateContactResponse.text())
        throw new Error("Failed to update contact")
      }

      console.log("Contact updated successfully")
    } else {
      // Create new contact
      const createContactResponse = await fetch("https://api.hubapi.com/contacts/v1/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({ properties: contactProperties }),
      })

      if (!createContactResponse.ok) {
        console.error("Failed to create contact:", await createContactResponse.text())
        throw new Error("Failed to create contact")
      }

      const result = await createContactResponse.json()
      contactId = result.vid
      console.log("Contact created successfully with ID:", contactId)
    }

    // STEP 3: Verify properties were set correctly
    console.log("STEP 3: Verifying properties were set...")

    const verifyContactResponse = await fetch(`https://api.hubapi.com/contacts/v1/contact/vid/${contactId}/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${HUBSPOT_API_KEY}`,
      },
    })

    if (!verifyContactResponse.ok) {
      console.error("Failed to verify contact:", await verifyContactResponse.text())
      throw new Error("Failed to verify contact")
    }

    const contactDetails = await verifyContactResponse.json()
    console.log("Contact properties:", contactDetails.properties)

    const chatbotStatusSet = contactDetails.properties.current_chatbot_status?.value
    const waitlistTagSet = contactDetails.properties.waitlist_tag?.value
    const employeeRangeSet = contactDetails.properties.employee_range?.value
    const challengesSet = contactDetails.properties.current_customer_service_challenges?.value
    const timelineSet = contactDetails.properties.implementation_timeline?.value

    console.log("Current chatbot status value:", chatbotStatusSet)
    console.log("Waitlist tag value:", waitlistTagSet)
    console.log("Employee range value:", employeeRangeSet)
    console.log("Challenges value:", challengesSet)
    console.log("Timeline value:", timelineSet)

    // STEP 4: If properties weren't set, try direct update
    if (!chatbotStatusSet || !waitlistTagSet || !employeeRangeSet || !challengesSet || !timelineSet) {
      console.log("STEP 4: Some properties not set, trying direct update...")

      const directUpdateResponse = await fetch(`https://api.hubapi.com/contacts/v1/contact/vid/${contactId}/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          properties: [
            { property: "current_chatbot_status", value: getChatbotStatusText(body.properties.chatbot_status) },
            { property: "waitlist_tag", value: "Trucking" },
            { property: "employee_range", value: body.properties.employee_range },
            {
              property: "current_customer_service_challenges",
              value: body.properties.current_customer_service_challenges,
            },
            { property: "implementation_timeline", value: body.properties.implementation_timeline },
          ],
        }),
      })

      if (!directUpdateResponse.ok) {
        console.error("Failed direct update:", await directUpdateResponse.text())
        throw new Error("Failed direct property update")
      }

      console.log("Direct property update successful")
    }

    // STEP 5: Create a note with all details
    console.log("STEP 5: Creating note...")

    const createNoteResponse = await fetch("https://api.hubapi.com/engagements/v1/engagements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HUBSPOT_API_KEY}`,
      },
      body: JSON.stringify({
        engagement: {
          type: "NOTE",
        },
        associations: {
          contactIds: [contactId],
        },
        metadata: {
          body: `Teleperson Waitlist Signup
Date: ${new Date().toISOString()}
Source: Voice Assistant Waitlist
Industry: Trucking
Current Chatbot Status: ${getChatbotStatusText(body.properties.chatbot_status)}
Company: ${body.properties.company}
Title: ${body.properties.jobtitle}
Phone: ${body.properties.phone || "Not provided"}
Employee Range: ${body.properties.employee_range || "Not provided"}
Implementation Timeline: ${body.properties.implementation_timeline || "Not provided"}
Current Customer Service Challenges: ${body.properties.current_customer_service_challenges || "Not provided"}
Waitlist Tag: Trucking
Lead Source: Teleperson Voice Assistant Waitlist`,
        },
      }),
    })

    if (!createNoteResponse.ok) {
      console.error("Failed to create note:", await createNoteResponse.text())
      throw new Error("Failed to create note")
    }

    console.log("Note created successfully")

    return NextResponse.json({
      success: true,
      message: "Thank you for joining our waitlist! We'll be in touch soon.",
      details: {
        contactId,
        action: isUpdate ? "updated" : "created",
        chatbotStatusSet: !!chatbotStatusSet,
        waitlistTagSet: !!waitlistTagSet,
        employeeRangeSet: !!employeeRangeSet,
        challengesSet: !!challengesSet,
        timelineSet: !!timelineSet,
      },
    })
  } catch (error) {
    console.error("Waitlist submission error:", error)

    // Always log the submission even if HubSpot fails
    if (body) {
      console.log("Fallback logging submission due to error:", {
        email: body.properties?.email,
        name: `${body.properties?.firstname || ""} ${body.properties?.lastname || ""}`,
        company: body.properties?.company,
        title: body.properties?.jobtitle,
        phone: body.properties?.phone,
        employeeRange: body.properties?.employee_range,
        challenges: body.properties?.current_customer_service_challenges,
        timeline: body.properties?.implementation_timeline,
        chatbotStatus: body.properties?.chatbot_status,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Return success to user even if HubSpot fails
    return NextResponse.json({
      success: true,
      message: "Thank you for joining our waitlist! We'll be in touch soon.",
      fallback: true,
    })
  }
}

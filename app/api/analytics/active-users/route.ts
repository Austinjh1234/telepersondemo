import { type NextRequest, NextResponse } from "next/server"

// This would be replaced with a real database or analytics service in production
const ACTIVE_USERS_MOCK = {
  trucking: 127,
  "credit-unions": 89,
  "physician-offices": 156,
  interpreter: 43,
  pharmacy: 78,
  bpo: 34,
  "consumer-packaged-goods": 62,
  insurance: 105,
}

export async function GET(request: NextRequest) {
  try {
    // Get sector from query params
    const { searchParams } = new URL(request.url)
    const sector = searchParams.get("sector") || "trucking"

    // In a real implementation, you would:
    // 1. Connect to your analytics database/service
    // 2. Query for active users in the specified sector
    // 3. Return the real-time data

    // For now, we'll use our mock data
    const activeUsers = ACTIVE_USERS_MOCK[sector as keyof typeof ACTIVE_USERS_MOCK] || 0

    // Simulate a small delay as a real API would have
    await new Promise((resolve) => setTimeout(resolve, 300))

    return NextResponse.json({
      activeUsers,
      sector,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching active users:", error)
    return NextResponse.json({ error: "Failed to fetch active users" }, { status: 500 })
  }
}

"use client"

export function ChatbotSkeleton() {
  return (
    <div className="w-full h-full p-4 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-gray-700/50 rounded w-32"></div>
        <div className="h-8 w-8 bg-gray-700/50 rounded-full"></div>
      </div>

      {/* Chat messages skeleton */}
      <div className="space-y-4 mb-6">
        {/* AI message */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-gray-700/50 rounded-full flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-700/50 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700/50 rounded w-1/2"></div>
          </div>
        </div>

        {/* User message */}
        <div className="flex items-start gap-3 justify-end">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-600/50 rounded w-2/3 ml-auto"></div>
          </div>
          <div className="w-8 h-8 bg-gray-600/50 rounded-full flex-shrink-0"></div>
        </div>

        {/* AI message */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-gray-700/50 rounded-full flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-700/50 rounded w-5/6"></div>
            <div className="h-4 bg-gray-700/50 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700/50 rounded w-1/3"></div>
          </div>
        </div>
      </div>

      {/* Input area skeleton */}
      <div className="border-t border-gray-700/50 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-10 bg-gray-700/50 rounded-lg"></div>
          <div className="h-10 w-10 bg-orange-600/50 rounded-lg"></div>
          <div className="h-10 w-10 bg-blue-600/50 rounded-lg"></div>
        </div>
      </div>

      {/* Loading indicator */}
      <div className="absolute inset-0 flex items-center justify-center bg-gray-950/20">
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-300 text-sm">Loading AI Assistant...</span>
        </div>
      </div>
    </div>
  )
}

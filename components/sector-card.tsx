"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

interface SectorCardProps {
  sector: {
    value: string
    label: string
    path: string
  }
  icon: React.ReactNode
  isSelected: boolean
  onClick: () => void
  benefits: Array<{ title: string; description: string }>
}

export function SectorCard({ sector, icon, isSelected, onClick, benefits }: SectorCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card
      className={`
        cursor-pointer transition-all duration-300 ease-out transform
        ${
          isSelected
            ? "bg-gradient-to-br from-orange-600/20 to-red-600/20 border-orange-500/50 scale-105 shadow-lg shadow-orange-500/20"
            : "bg-gray-900/50 border-gray-800/50 hover:border-gray-700/70"
        }
        ${isHovered && !isSelected ? "scale-102 shadow-md hover:bg-gray-800/60" : ""}
        backdrop-blur-sm
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`
            transition-all duration-300
            ${isSelected ? "scale-110" : isHovered ? "scale-105" : "scale-100"}
          `}
          >
            {icon}
          </div>
          <h3
            className={`
            font-semibold transition-colors duration-300
            ${isSelected ? "text-orange-300" : "text-white"}
          `}
          >
            {sector.label}
          </h3>
        </div>

        {(isSelected || isHovered) && (
          <div
            className={`
            space-y-2 transition-all duration-300 ease-out
            ${isSelected || isHovered ? "opacity-100 max-h-96" : "opacity-0 max-h-0"}
          `}
          >
            {benefits.slice(0, 2).map((benefit, index) => (
              <div
                key={index}
                className={`
                  p-2 rounded-md transition-all duration-300 ease-out
                  ${isSelected ? "bg-orange-600/10 border border-orange-600/20" : "bg-gray-800/40"}
                `}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: isSelected || isHovered ? "slideInUp 0.3s ease-out forwards" : "none",
                }}
              >
                <h4 className="text-xs font-medium text-white mb-1">{benefit.title}</h4>
                <p className="text-xs text-gray-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Card>
  )
}

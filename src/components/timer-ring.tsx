'use client'

import type { ReactNode } from 'react'

interface TimerRingProps {
  /** Fração concluída do ciclo, de 0 a 1 */
  progress: number
  size?: number
  strokeWidth?: number
  children?: ReactNode
  active?: boolean
}

export function TimerRing({
  progress,
  size = 260,
  strokeWidth = 12,
  children,
  active = false,
}: TimerRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(1, Math.max(0, progress))
  const offset = circumference * (1 - clamped)

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Progresso do ciclo: ${Math.round(clamped * 100)}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Trilha de fundo */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        {/* Arco de progresso */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`transition-[stroke-dashoffset] duration-500 ease-linear ${
            active ? 'stroke-primary' : 'stroke-primary/40'
          }`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  )
}

'use client'

import { CheckCircle2, RefreshCw, SkipForward } from 'lucide-react'
import { useEffect, useState } from 'react'
import { TimerRing } from '@/components/timer-ring'
import { Button } from '@/components/ui/button'
import type { Challenge } from '@/lib/challenges'

interface BreakOverlayProps {
  challenge: Challenge
  /** duração da pausa em segundos */
  duration?: number
  onComplete: () => void
  onSkip: () => void
  onShuffle: () => void
}

export function BreakOverlay(props: BreakOverlayProps) {
  // key força remontagem ao trocar de desafio, reiniciando a contagem
  return <BreakCountdown key={props.challenge.id} {...props} />
}

function BreakCountdown({
  challenge,
  duration = 20,
  onComplete,
  onSkip,
  onShuffle,
}: BreakOverlayProps) {
  const [secondsLeft, setSecondsLeft] = useState(duration)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const id = window.setTimeout(() => {
      setSecondsLeft((s) => s - 1)
    }, 1000)
    return () => window.clearTimeout(id)
  }, [secondsLeft])

  const done = secondsLeft <= 0
  const progress = 1 - secondsLeft / duration

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Pausa para descanso dos olhos"
    >
      <div className="animate-breathe w-full max-w-md">
        <div className="rounded-2xl border bg-card p-6 shadow-2xl sm:p-8">
          {done ? (
            /* ---------- Estado de conclusão ---------- */
            <div className="flex flex-col items-center gap-5 text-center">
              <CheckCircle2
                className="h-16 w-16 text-primary"
                aria-hidden="true"
              />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Muito bem! 🎉</h2>
                <p className="text-muted-foreground">
                  Quer descansar mais um pouco? Fique à vontade — o próximo
                  ciclo só recomeça quando você voltar ao foco.
                </p>
              </div>
              <Button size="lg" className="w-full" onClick={onComplete}>
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                Voltar ao foco
              </Button>
            </div>
          ) : (
            /* ---------- Desafio em andamento ---------- */
            <div className="flex flex-col items-center gap-5 text-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                Hora da pausa 👁️
              </span>

              <TimerRing progress={progress} size={180} strokeWidth={10} active>
                <span
                  className="text-5xl font-bold tabular-nums"
                  aria-live="polite"
                >
                  {secondsLeft}
                </span>
                <span className="text-xs text-muted-foreground">
                  segundos · no mínimo
                </span>
              </TimerRing>

              <div className="space-y-1.5">
                <div className="text-4xl" aria-hidden="true">
                  {challenge.emoji}
                </div>
                <h2 className="text-xl font-bold">{challenge.title}</h2>
                <p className="text-balance text-sm text-muted-foreground">
                  {challenge.tip}
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onShuffle}
                >
                  <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                  Trocar desafio
                </Button>
                <Button variant="ghost" className="flex-1" onClick={onSkip}>
                  <SkipForward className="mr-2 h-4 w-4" aria-hidden="true" />
                  Pular pausa
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

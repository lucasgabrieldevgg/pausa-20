'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  Armchair,
  Coffee,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Timer,
} from 'lucide-react'
import { useCallback } from 'react'
import { BreakOverlay } from '@/components/break-overlay'
import { SettingsPanel } from '@/components/settings-panel'
import { ThemeToggle } from '@/components/theme-toggle'
import { TimerRing } from '@/components/timer-ring'
import { Button } from '@/components/ui/button'
import { useEyeBreak } from '@/hooks/use-eye-break'
import { primeAudio } from '@/lib/sound'

function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0')
  const ss = String(totalSec % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export default function Home() {
  const eb = useEyeBreak()

  const intervalMs = eb.settings.intervalMinutes * 60_000
  const progress =
    eb.status === 'running' || eb.status === 'paused'
      ? 1 - eb.remainingMs / intervalMs
      : 0

  const handleStart = useCallback(() => {
    primeAudio()
    eb.start()
  }, [eb])

  const handleTestAlert = useCallback(() => {
    eb.testAlert()
  }, [eb])

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-primary/5 via-background to-background">
      {/* ---------- Cabeçalho ---------- */}
      <header className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Armchair className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <h1 className="text-lg font-bold">Pausa 20</h1>
            <p className="text-xs text-muted-foreground">
              lembrete para olhar para outras coisas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <SettingsPanel
            settings={eb.settings}
            onChange={eb.changeSettings}
            onRequestNotifications={eb.requestNotifications}
            onTestAlert={handleTestAlert}
          />
        </div>
      </header>

      {/* ---------- Conteúdo principal ---------- */}
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-8">
        <TimerRing
          progress={progress}
          active={eb.status === 'running'}
          size={264}
          strokeWidth={12}
        >
          {eb.status === 'idle' ? (
            <>
              <span className="text-5xl font-bold tabular-nums">
                {eb.settings.intervalMinutes}
              </span>
              <span className="text-xs text-muted-foreground">minutos</span>
            </>
          ) : (
            <>
              <span
                className="text-5xl font-bold tabular-nums"
                aria-live="polite"
              >
                {formatTime(eb.remainingMs)}
              </span>
              <span className="text-xs text-muted-foreground">
                {eb.status === 'paused' ? 'pausado' : 'para a pausa'}
              </span>
            </>
          )}
        </TimerRing>

        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-balance text-sm text-muted-foreground" aria-live="polite">
            {eb.status === 'idle' &&
              'Deixe esta aba aberta — eu te aviso na hora de descansar os olhos.'}
            {eb.status === 'running' &&
              'Siga seus afazeres. Avisarei você no momento certo.'}
            {eb.status === 'paused' &&
              'Timer pausado. Retome quando quiser continuar.'}
            {eb.status === 'alert' && 'Chegou a hora! Que tal uma pausa rápida?'}
            {eb.status === 'breaking' && 'Pausa em andamento...'}
          </p>

          {/* ---------- Controles ---------- */}
          <div className="flex items-center gap-2">
            {eb.status === 'idle' && (
              <Button size="lg" onClick={handleStart} className="px-8">
                <Play className="mr-2 h-5 w-5" aria-hidden="true" />
                Iniciar
              </Button>
            )}
            {eb.status === 'running' && (
              <>
                <Button size="lg" variant="outline" onClick={eb.pause}>
                  <Pause className="mr-2 h-5 w-5" aria-hidden="true" />
                  Pausar
                </Button>
                <Button size="lg" variant="ghost" onClick={eb.reset}>
                  <RotateCcw className="mr-2 h-5 w-5" aria-hidden="true" />
                  Zerar
                </Button>
              </>
            )}
            {eb.status === 'paused' && (
              <>
                <Button size="lg" onClick={eb.resume} className="px-8">
                  <Play className="mr-2 h-5 w-5" aria-hidden="true" />
                  Retomar
                </Button>
                <Button size="lg" variant="ghost" onClick={eb.reset}>
                  <RotateCcw className="mr-2 h-5 w-5" aria-hidden="true" />
                  Zerar
                </Button>
              </>
            )}
            {eb.status === 'alert' && (
              <Button size="lg" onClick={eb.startBreak} className="px-8">
                <Coffee className="mr-2 h-5 w-5" aria-hidden="true" />
                Fazer pausa de 20s
              </Button>
            )}
          </div>
        </div>

        {/* ---------- Cartão da regra 20-20-20 ---------- */}
        <section
          aria-labelledby="regra-202020"
          className="w-full max-w-md rounded-xl border bg-card/60 p-5"
        >
          <h2 id="regra-202020" className="flex items-center gap-2 font-semibold">
            <Timer className="h-4 w-4 text-primary" aria-hidden="true" />
            O que é a regra 20-20-20?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            A cada 20 minutos — ou menos, olhe para algo a cerca de 20 pés
            (≈ 6 metros) de distância por pelo menos 20 segundos. Ou seja:
            nunca fique mais de 20 minutos sem dar uma escapada aos olhos.
            Esse pequeno hábito reduz a fadiga ocular causada por telas,
            ajuda a manter os olhos hidratados e pode melhorar sua
            concentração ao longo do dia.
          </p>
        </section>
      </main>

      {/* ---------- Rodapé fixo ---------- */}
      <footer className="mt-auto border-t px-4 py-3 text-center text-xs text-muted-foreground">
        <p>
          Pausas concluídas hoje:{' '}
          <span className="font-semibold text-foreground">
            {eb.breaksToday}
          </span>{' '}
          · Ciclo atual: {eb.settings.intervalMinutes} min · Modo:{' '}
          {eb.settings.mode === 'challenge' ? 'desafio guiado' : 'só avisar'}
        </p>
      </footer>

      {/* ---------- Banner de aviso (modo "só avisar") ---------- */}
      <AnimatePresence>
        {eb.status === 'alert' && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed inset-x-4 bottom-4 z-40 sm:left-auto sm:right-6 sm:w-96"
            role="alert"
          >
            <div className="rounded-xl border bg-card p-4 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">👁️ Hora de descansar os olhos!</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Olhe para algo longe por pelo menos 20 segundos.
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="flex-1" onClick={eb.startBreak}>
                  Pausa guiada (20s)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => eb.snooze(5)}
                >
                  Adiar 5 min
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Overlay de desafio (modo desafio / pausa guiada) ---------- */}
      {eb.status === 'breaking' && eb.challenge && (
        <BreakOverlay
          challenge={eb.challenge}
          duration={20}
          onComplete={eb.completeBreak}
          onSkip={eb.skipBreak}
          onShuffle={eb.shuffleChallenge}
        />
      )}
    </div>
  )
}

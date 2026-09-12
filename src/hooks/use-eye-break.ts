'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getRandomChallenge, type Challenge } from '@/lib/challenges'
import {
  isAlarmSoundId,
  playAlarm,
  playSuccess,
  stopAlarm,
  type AlarmSoundId,
} from '@/lib/sound'

export type BreakMode = 'challenge' | 'simple'

export type TimerStatus =
  | 'idle' // parado, nunca iniciado
  | 'running' // contando para a próxima pausa
  | 'paused' // pausado pelo usuário
  | 'alert' // disparou o aviso (modo simples) — aguardando ação
  | 'breaking' // pausa de 20s em andamento

export interface EyeBreakSettings {
  intervalMinutes: number
  mode: BreakMode
  sound: boolean
  /** qual alarme tocar quando o ciclo terminar */
  alarmSound: AlarmSoundId
  notifications: boolean
  /** ids de desafios desativados pelo usuário (os demais participam do sorteio) */
  disabledChallenges: number[]
}

const DEFAULT_SETTINGS: EyeBreakSettings = {
  intervalMinutes: 20,
  mode: 'challenge',
  sound: true,
  alarmSound: 'classico',
  notifications: false,
  disabledChallenges: [],
}

const SETTINGS_KEY = 'pausa20:settings:v1'
const STATS_KEY = 'pausa20:stats:v1'

function todayKey(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function loadSettings(): EyeBreakSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<EyeBreakSettings>
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      intervalMinutes:
        typeof parsed.intervalMinutes === 'number'
          ? Math.min(60, Math.max(1, parsed.intervalMinutes))
          : DEFAULT_SETTINGS.intervalMinutes,
      alarmSound: isAlarmSoundId(parsed.alarmSound)
        ? parsed.alarmSound
        : DEFAULT_SETTINGS.alarmSound,
      disabledChallenges: Array.isArray(parsed.disabledChallenges)
        ? parsed.disabledChallenges.filter(
            (n): n is number => typeof n === 'number'
          )
        : DEFAULT_SETTINGS.disabledChallenges,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function loadBreaksToday(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = window.localStorage.getItem(STATS_KEY)
    if (!raw) return 0
    const parsed = JSON.parse(raw) as { date: string; count: number }
    if (parsed.date !== todayKey()) return 0
    return parsed.count
  } catch {
    return 0
  }
}

function saveBreaksToday(count: number) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      STATS_KEY,
      JSON.stringify({ date: todayKey(), count })
    )
  } catch {
    /* ignora falha de storage (modo privado etc.) */
  }
}

export function useEyeBreak() {
  const [hydrated, setHydrated] = useState(false)
  const [settings, setSettings] = useState<EyeBreakSettings>(DEFAULT_SETTINGS)
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [remainingMs, setRemainingMs] = useState(
    DEFAULT_SETTINGS.intervalMinutes * 60_000
  )
  const [endsAt, setEndsAt] = useState<number | null>(null)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [breaksToday, setBreaksToday] = useState(0)

  const settingsRef = useRef(settings)
  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  // Carrega preferências e estatísticas após a montagem (evita mismatch SSR).
  // setState aqui é intencional: sincronização com sistema externo (localStorage)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const loaded = loadSettings()
    setSettings(loaded)
    setRemainingMs(loaded.intervalMinutes * 60_000)
    setBreaksToday(loadBreaksToday())
    setHydrated(true)
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Persiste contagem de pausas do dia
  useEffect(() => {
    if (hydrated) saveBreaksToday(breaksToday)
  }, [breaksToday, hydrated])

  // Persiste configurações
  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch {
      /* ignora */
    }
  }, [settings, hydrated])

  const startCycle = useCallback((minutes?: number) => {
    const mins = minutes ?? settingsRef.current.intervalMinutes
    setEndsAt(Date.now() + mins * 60_000)
    setRemainingMs(mins * 60_000)
    setStatus('running')
  }, [])

  const triggerAlert = useCallback(() => {
    const s = settingsRef.current
    if (s.sound) playAlarm(s.alarmSound)
    if (
      s.notifications &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      const c = getRandomChallenge(undefined, s.disabledChallenges)
      try {
        new Notification('Hora da pausa 👁️', {
          body: c.tip,
          tag: 'pausa20',
        })
      } catch {
        /* alguns navegadores exigem service worker; segue com o aviso na tela */
      }
    }
    if (s.mode === 'challenge') {
      setChallenge(getRandomChallenge(undefined, s.disabledChallenges))
      setStatus('breaking')
    } else {
      setStatus('alert')
    }
  }, [])

  // Tick do timer — baseado em timestamp, então continua preciso mesmo se
  // o navegador limitar o setInterval em aba em segundo plano.
  useEffect(() => {
    if (status !== 'running' || endsAt === null) return
    const tick = () => {
      const remaining = endsAt - Date.now()
      if (remaining <= 0) {
        setRemainingMs(0)
        triggerAlert()
      } else {
        setRemainingMs(remaining)
      }
    }
    tick()
    const id = window.setInterval(tick, 500)
    // Reavalia imediatamente ao voltar para a aba (catch-up rápido)
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [status, endsAt, triggerAlert])

  // Título da aba reflete o tempo restante
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (status === 'running') {
      const totalSec = Math.ceil(remainingMs / 1000)
      const mm = String(Math.floor(totalSec / 60)).padStart(2, '0')
      const ss = String(totalSec % 60).padStart(2, '0')
      document.title = `${mm}:${ss} · Pausa 20`
    } else if (status === 'breaking') {
      document.title = 'Pausa ativa 👁️ · Pausa 20'
    } else {
      document.title = 'Pausa 20 — Lembrete para descansar os olhos'
    }
  }, [status, remainingMs])

  // Ações
  const start = useCallback(() => startCycle(), [startCycle])

  const pause = useCallback(() => {
    setStatus('paused')
    setEndsAt(null)
  }, [])

  const resume = useCallback(() => {
    setEndsAt(Date.now() + remainingMs)
    setStatus('running')
  }, [remainingMs])

  const reset = useCallback(() => {
    setStatus('idle')
    setEndsAt(null)
    setRemainingMs(settingsRef.current.intervalMinutes * 60_000)
  }, [])

  const snooze = useCallback(
    (minutes: number) => {
      stopAlarm()
      startCycle(minutes)
    },
    [startCycle]
  )

  const startBreak = useCallback(() => {
    stopAlarm()
    setChallenge(
      getRandomChallenge(challenge?.id, settingsRef.current.disabledChallenges)
    )
    setStatus('breaking')
  }, [challenge?.id])

  const completeBreak = useCallback(() => {
    stopAlarm()
    if (settingsRef.current.sound) playSuccess()
    setBreaksToday((prev) => prev + 1)
    setChallenge(null)
    startCycle() // inicia automaticamente o próximo ciclo
  }, [startCycle])

  const skipBreak = useCallback(() => {
    stopAlarm()
    setChallenge(null)
    startCycle() // segue para o próximo ciclo mesmo pulando
  }, [startCycle])

  const shuffleChallenge = useCallback(() => {
    setChallenge((prev) =>
      getRandomChallenge(prev?.id, settingsRef.current.disabledChallenges)
    )
  }, [])

  const changeSettings = useCallback(
    (patch: Partial<EyeBreakSettings>) => {
      setSettings((prev) => ({ ...prev, ...patch }))
      // Se o intervalo muda enquanto ocioso, atualiza o mostrador na mesma ação
      if (status === 'idle' && patch.intervalMinutes !== undefined) {
        setRemainingMs(patch.intervalMinutes * 60_000)
      }
    },
    [status]
  )

  const requestNotifications = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported' as const
    }
    try {
      const permission = await Notification.requestPermission()
      return permission
    } catch {
      return 'denied' as const
    }
  }, [])

  return {
    hydrated,
    settings,
    status,
    remainingMs,
    challenge,
    breaksToday,
    start,
    pause,
    resume,
    reset,
    snooze,
    startBreak,
    completeBreak,
    skipBreak,
    shuffleChallenge,
    changeSettings,
    requestNotifications,
    testAlert: triggerAlert,
  }
}

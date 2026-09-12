/**
 * Sons sintetizados com Web Audio API — sem necessidade de arquivos de áudio.
 * O AudioContext precisa ser criado após um gesto do usuário (política de
 * autoplay dos navegadores), então chamamos `primeAudio()` nos cliques.
 *
 * O alarme é alto e REPETE por vários segundos (ou até qualquer interação),
 * para garantir que a pessoa ouça mesmo concentrada em outra janela.
 */

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!AudioContextClass) return null
  if (!audioCtx) {
    try {
      audioCtx = new AudioContextClass()
    } catch {
      return null
    }
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume()
  }
  return audioCtx
}

/** Chame em interações do usuário para "destravar" o áudio do navegador. */
export function primeAudio() {
  getCtx()
}

/* ------------------------------------------------------------------ */
/* Alarmes configuráveis                                              */
/* ------------------------------------------------------------------ */

export type AlarmSoundId = 'classico' | 'suave' | 'sino' | 'melodia'

export const ALARM_SOUNDS: ReadonlyArray<{
  id: AlarmSoundId
  name: string
  emoji: string
}> = [
  { id: 'classico', name: 'Alarme clássico', emoji: '⏰' },
  { id: 'suave', name: 'Campainha suave', emoji: '🔔' },
  { id: 'sino', name: 'Sino duplo', emoji: '🛎️' },
  { id: 'melodia', name: 'Melodia alegre', emoji: '🎵' },
]

export function isAlarmSoundId(value: unknown): value is AlarmSoundId {
  return ALARM_SOUNDS.some((s) => s.id === value)
}

/** Nós de áudio ativos — permitem interromper o alarme a qualquer momento. */
let activeNodes: AudioScheduledSourceNode[] = []
/** setTimeout pendentes das repetições do alarme. */
let alarmTimeouts: number[] = []
/** Listener global que interrompe o alarme na primeira interação. */
let interactionStop: (() => void) | null = null

/** Toca uma nota com envelope; volume/ataque ajustáveis por som. */
function playTone(
  ctx: AudioContext,
  freq: number,
  startDelay: number,
  duration: number,
  volume = 0.3,
  type: OscillatorType = 'sine',
  attack = 0.01
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const t0 = ctx.currentTime + startDelay

  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  gain.gain.setValueAtTime(0, t0)
  gain.gain.linearRampToValueAtTime(volume, t0 + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.05)

  // rastreia para permitir stopAlarm(); remove sozinho quando termina
  osc.onended = () => {
    const i = activeNodes.indexOf(osc)
    if (i >= 0) activeNodes.splice(i, 1)
  }
  activeNodes.push(osc)
}

/** Um "ciclo" de cada alarme — duração em PATTERN_DURATION. */
const PATTERNS: Record<AlarmSoundId, (ctx: AudioContext) => void> = {
  // bip-bip agudo estilo despertador
  classico: (ctx) => {
    playTone(ctx, 880, 0, 0.16, 0.24, 'square', 0.004)
    playTone(ctx, 880, 0.24, 0.16, 0.24, 'square', 0.004)
  },
  // a campainha original, só que num volume que se ouve
  suave: (ctx) => {
    playTone(ctx, 659.25, 0, 0.4, 0.32)
    playTone(ctx, 659.25, 0.45, 0.4, 0.32)
    playTone(ctx, 880, 0.9, 0.6, 0.32)
  },
  // duas batidas de sino (fundamental + parcial inarmônico)
  sino: (ctx) => {
    playTone(ctx, 784, 0, 0.9, 0.3)
    playTone(ctx, 784 * 2.4, 0, 0.5, 0.1)
    playTone(ctx, 988, 0.8, 1.0, 0.3)
    playTone(ctx, 988 * 2.4, 0.8, 0.5, 0.1)
  },
  // arpejo saltitante C5-E5-G5-C6
  melodia: (ctx) => {
    const seq = [523.25, 659.25, 783.99, 1046.5]
    seq.forEach((f, i) => playTone(ctx, f, i * 0.16, 0.22, 0.3, 'triangle'))
  },
}

/** Duração (s) de cada padrão — usada para espaçar as repetições. */
const PATTERN_DURATION: Record<AlarmSoundId, number> = {
  classico: 0.45,
  suave: 1.55,
  sino: 1.85,
  melodia: 0.9,
}

/** Pausa (s) entre uma repetição e outra. */
const PATTERN_GAP = 0.7
/** O alarme se auto-interrompe depois dessas repetições (~11–13 s). */
const MAX_REPS = 5

function disarmInteractionStop() {
  if (typeof window === 'undefined' || !interactionStop) return
  window.removeEventListener('pointerdown', interactionStop)
  window.removeEventListener('keydown', interactionStop)
  interactionStop = null
}

function armInteractionStop() {
  if (typeof window === 'undefined' || interactionStop) return
  interactionStop = () => stopAlarm()
  window.addEventListener('pointerdown', interactionStop)
  window.addEventListener('keydown', interactionStop)
}

/**
 * Interrompe o alarme imediatamente: cancela repetições pendentes e
 * silencia qualquer nota ainda soando.
 */
export function stopAlarm() {
  if (typeof window !== 'undefined') {
    for (const t of alarmTimeouts) window.clearTimeout(t)
  }
  alarmTimeouts = []
  for (const node of activeNodes) {
    try {
      node.stop()
    } catch {
      /* já parado */
    }
    try {
      node.disconnect()
    } catch {
      /* já desconectado */
    }
  }
  activeNodes = []
  disarmInteractionStop()
}

/**
 * Alarme de fim de ciclo: toca o padrão escolhido várias vezes, em volume
 * alto, até a pessoa interagir (clique/tecla) ou esgotar as repetições.
 */
export function playAlarm(id: AlarmSoundId = 'classico', reps = MAX_REPS) {
  stopAlarm()
  const ctx = getCtx()
  if (!ctx) return
  const pattern = PATTERNS[id] ?? PATTERNS.classico
  const step = (PATTERN_DURATION[id] ?? 1.5) + PATTERN_GAP

  for (let i = 0; i < reps; i++) {
    if (i === 0) {
      pattern(ctx)
    } else {
      alarmTimeouts.push(
        window.setTimeout(() => pattern(ctx), Math.round(i * step * 1000))
      )
    }
  }
  // qualquer clique/tecla interrompe — a pessoa já percebeu o aviso
  armInteractionStop()
}

/**
 * Prévia do alarme na configuração: toca um ciclo do padrão escolhido,
 * no mesmo volume do alarme real.
 */
export function previewAlarm(id: AlarmSoundId) {
  stopAlarm()
  const ctx = getCtx()
  if (!ctx) return
  ;(PATTERNS[id] ?? PATTERNS.classico)(ctx)
}

/** Sonzinho curto e positivo de conclusão da pausa (arpejo A-C#-E). */
export function playSuccess() {
  const ctx = getCtx()
  if (!ctx) return
  playTone(ctx, 880, 0, 0.18, 0.14)
  playTone(ctx, 1108.73, 0.12, 0.18, 0.14)
  playTone(ctx, 1318.51, 0.24, 0.35, 0.14)
}

/**
 * Sons sintetizados com Web Audio API — sem necessidade de arquivos de áudio.
 * O AudioContext precisa ser criado após um gesto do usuário (política de
 * autoplay dos navegadores), então chamamos `primeAudio()` nos cliques.
 *
 * O alarme é alto e REPETE pelo tempo configurado — inclusive SEM PARAR, até
 * a pessoa interagir — para garantir que ela ouça mesmo concentrada em outra
 * janela. As repetições são agendadas com antecedência no relógio do
 * AudioContext (agendador de horizonte), então o toque continua firme mesmo
 * que o navegador limite os timers de JavaScript em aba em segundo plano.
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
/** Listener global que interrompe o alarme na primeira interação. */
let interactionStop: (() => void) | null = null

/** Toca uma nota com envelope; começa em tempo ABSOLUTO do AudioContext. */
function playTone(
  ctx: AudioContext,
  freq: number,
  startAt: number,
  duration: number,
  volume = 0.3,
  type: OscillatorType = 'sine',
  attack = 0.01
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(freq, startAt)
  gain.gain.setValueAtTime(0, startAt)
  gain.gain.linearRampToValueAtTime(volume, startAt + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(startAt)
  osc.stop(startAt + duration + 0.05)

  // rastreia para permitir stopAlarm(); remove sozinho quando termina
  osc.onended = () => {
    const i = activeNodes.indexOf(osc)
    if (i >= 0) activeNodes.splice(i, 1)
  }
  activeNodes.push(osc)
}

/** Um "ciclo" de cada alarme — começa em t0 (tempo absoluto do ctx). */
const PATTERNS: Record<AlarmSoundId, (ctx: AudioContext, t0: number) => void> = {
  // bip-bip agudo estilo despertador
  classico: (ctx, t0) => {
    playTone(ctx, 880, t0, 0.16, 0.24, 'square', 0.004)
    playTone(ctx, 880, t0 + 0.24, 0.16, 0.24, 'square', 0.004)
  },
  // a campainha original, só que num volume que se ouve
  suave: (ctx, t0) => {
    playTone(ctx, 659.25, t0, 0.4, 0.32)
    playTone(ctx, 659.25, t0 + 0.45, 0.4, 0.32)
    playTone(ctx, 880, t0 + 0.9, 0.6, 0.32)
  },
  // duas batidas de sino (fundamental + parcial inarmônico)
  sino: (ctx, t0) => {
    playTone(ctx, 784, t0, 0.9, 0.3)
    playTone(ctx, 784 * 2.4, t0, 0.5, 0.1)
    playTone(ctx, 988, t0 + 0.8, 1.0, 0.3)
    playTone(ctx, 988 * 2.4, t0 + 0.8, 0.5, 0.1)
  },
  // arpejo saltitante C5-E5-G5-C6
  melodia: (ctx, t0) => {
    const seq = [523.25, 659.25, 783.99, 1046.5]
    seq.forEach((f, i) =>
      playTone(ctx, f, t0 + i * 0.16, 0.22, 0.3, 'triangle')
    )
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

/* ------------------------------------------------------------------ */
/* Agendador de horizonte                                             */
/* ------------------------------------------------------------------ */

// Agenda ~20s de áudio por vez no relógio do AudioContext e reabastece a
// cada 2s. Áudio já agendado NÃO é afetado pela limitação de timers de aba
// em segundo plano — e navegadores (Chrome/Edge) sequer aplicam a limitação
// "intensiva" a páginas tocando som. Resultado: o alarme repete firme.
const SCHED_TICK_MS = 2000
const LOOKAHEAD_MS = 20000

let schedulerId: number | null = null
let alarmPattern: ((ctx: AudioContext, t0: number) => void) | null = null
let patternStepMs = 0
let nextPatternAt = 0 // tempo do AudioContext da próxima repetição
let alarmEndsAt: number | null = null // wall clock; null = só parando à mão
let alarmPlaying = false

function schedulerTick() {
  if (!audioCtx || !alarmPattern) return

  const now = Date.now()
  if (alarmEndsAt !== null && now >= alarmEndsAt) {
    stopAlarm()
    return
  }

  const horizonWall =
    alarmEndsAt !== null
      ? Math.min(LOOKAHEAD_MS, alarmEndsAt - now)
      : LOOKAHEAD_MS
  if (horizonWall <= 0) return

  const horizonCtx = audioCtx.currentTime + horizonWall / 1000
  while (nextPatternAt < horizonCtx) {
    alarmPattern(audioCtx, nextPatternAt)
    nextPatternAt += patternStepMs / 1000
  }
}

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
 * Interrompe o alarme imediatamente: cancela o agendador e silencia
 * qualquer nota ainda soando (ou já agendada).
 */
export function stopAlarm() {
  if (typeof window !== 'undefined' && schedulerId !== null) {
    window.clearInterval(schedulerId)
  }
  schedulerId = null
  alarmPattern = null
  alarmPlaying = false
  alarmEndsAt = null
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

/** O alarme está tocando agora? (útil para UI de "silenciar") */
export function isAlarmPlaying() {
  return alarmPlaying
}

/**
 * Alarme de fim de ciclo: repete o padrão escolhido em volume alto.
 * - `durationMs` definido: repete por esse tempo (qualquer interação para antes).
 * - `durationMs` omitido: repete SEM PARAR até a pessoa interagir
 *   (clique/tecla em qualquer lugar da página) ou chamar stopAlarm().
 */
export function playAlarm(id: AlarmSoundId = 'classico', durationMs?: number) {
  stopAlarm()
  const ctx = getCtx()
  if (!ctx) return

  alarmPattern = PATTERNS[id] ?? PATTERNS.classico
  patternStepMs = ((PATTERN_DURATION[id] ?? 1.5) + PATTERN_GAP) * 1000
  nextPatternAt = ctx.currentTime + 0.06
  alarmEndsAt =
    durationMs === undefined
      ? null
      : Date.now() + Math.max(1000, durationMs)
  alarmPlaying = true

  schedulerTick()
  if (typeof window !== 'undefined') {
    schedulerId = window.setInterval(schedulerTick, SCHED_TICK_MS)
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
  ;(PATTERNS[id] ?? PATTERNS.classico)(ctx, ctx.currentTime)
}

/** Sonzinho curto e positivo de conclusão da pausa (arpejo A-C#-E). */
export function playSuccess() {
  const ctx = getCtx()
  if (!ctx) return
  const t = ctx.currentTime
  playTone(ctx, 880, t, 0.18, 0.14)
  playTone(ctx, 1108.73, t + 0.12, 0.18, 0.14)
  playTone(ctx, 1318.51, t + 0.24, 0.35, 0.14)
}

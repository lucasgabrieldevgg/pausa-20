/**
 * Sons sintetizados com Web Audio API — sem necessidade de arquivos de áudio.
 * O AudioContext precisa ser criado após um gesto do usuário (política de
 * autoplay dos navegadores), então chamamos `primeAudio()` nos cliques.
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

/** Toca uma nota com envelope suave. */
function playTone(
  ctx: AudioContext,
  freq: number,
  startDelay: number,
  duration: number,
  volume = 0.18,
  type: OscillatorType = 'sine'
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const t0 = ctx.currentTime + startDelay

  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  gain.gain.setValueAtTime(0, t0)
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.05)
}

/**
 * Campainha suave de "hora da pausa" — duas notas ascendentes calorosas
 * (E5 -> A5) repetidas uma vez.
 */
export function playChime() {
  const ctx = getCtx()
  if (!ctx) return
  // Nota 1
  playTone(ctx, 659.25, 0, 0.45)
  playTone(ctx, 659.25, 0.5, 0.45)
  // Nota 2 (mais aguda, resolutiva)
  playTone(ctx, 880, 1.0, 0.7)
}

/** Sonzinho curto e positivo de conclusão da pausa (arpejo A-C#-E). */
export function playSuccess() {
  const ctx = getCtx()
  if (!ctx) return
  playTone(ctx, 880, 0, 0.18, 0.14)
  playTone(ctx, 1108.73, 0.12, 0.18, 0.14)
  playTone(ctx, 1318.51, 0.24, 0.35, 0.14)
}

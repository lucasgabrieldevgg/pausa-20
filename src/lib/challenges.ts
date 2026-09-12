export interface Challenge {
  id: number
  emoji: string
  title: string
  tip: string
}

/**
 * Desafios rápidos que podem ser feitos na hora, sem sair do ambiente
 * de trabalho. Baseados na regra 20-20-20 e micro-pausas saudáveis.
 */
export const CHALLENGES: Challenge[] = [
  {
    id: 1,
    emoji: '👀',
    title: 'Regra 20-20-20',
    tip: 'Olhe para algo a uns 6 metros de distância e mantenha o foco por 20 segundos.',
  },
  {
    id: 2,
    emoji: '🪟',
    title: 'Olhe pela janela',
    tip: 'Encontre o ponto mais distante que você consegue ver e relaxe o olhar nele.',
  },
  {
    id: 3,
    emoji: '😌',
    title: 'Feche os olhos',
    tip: 'Feche os olhos devagar e faça 3 respirações profundas e lentas.',
  },
  {
    id: 4,
    emoji: '👁️',
    title: 'Pisque devagar',
    tip: 'Faça 10 piscadas bem lentas para hidratar e relaxar os olhos.',
  },
  {
    id: 5,
    emoji: '🧘',
    title: 'Alongue o pescoço',
    tip: 'Incline a cabeça para cada lado e para frente, segurando alguns segundos.',
  },
  {
    id: 6,
    emoji: '🚶',
    title: 'Levante-se',
    tip: 'Fique de pé e dê uma pequena caminhada pelo ambiente, mesmo curta.',
  },
  {
    id: 7,
    emoji: '💧',
    title: 'Beba água',
    tip: 'Levante-se e beba alguns goles de água. Hidratação também é para os olhos!',
  },
  {
    id: 8,
    emoji: '👐',
    title: 'Alongue braços e ombros',
    tip: 'Estique os braços para cima e gire os ombros para trás bem devagar.',
  },
  {
    id: 9,
    emoji: '🔍',
    title: 'Detalhes ao longe',
    tip: 'Escolha um objeto distante e note mentalmente 3 detalhes dele.',
  },
  {
    id: 10,
    emoji: '🌿',
    title: 'Olhe algo natural',
    tip: 'Se houver uma planta ou algo verde por perto, contemple por 20 segundos.',
  },
  {
    id: 11,
    emoji: '🌞',
    title: 'Luz natural',
    tip: 'Se possível, aproxime-se de uma janela e deixe a luz natural tocar seu rosto.',
  },
  {
    id: 12,
    emoji: '🙌',
    title: 'Sacuda o corpo',
    tip: 'Mexa os dedos, os punhos e os ombros por alguns segundos para soltar a tensão.',
  },
]

/**
 * Retorna um desafio aleatório entre os desafios habilitados, evitando
 * repetir o imediatamente anterior (quando possível) para dar variedade.
 * Se todos estiverem desabilitados, usa a lista completa como fallback.
 */
export function getRandomChallenge(
  excludeId?: number,
  disabledIds: number[] = []
): Challenge {
  const disabled = new Set(disabledIds)
  let pool = CHALLENGES.filter((c) => !disabled.has(c.id))
  if (pool.length === 0) pool = CHALLENGES
  if (excludeId !== undefined && pool.length > 1) {
    const filtered = pool.filter((c) => c.id !== excludeId)
    if (filtered.length > 0) pool = filtered
  }
  return pool[Math.floor(Math.random() * pool.length)]
}

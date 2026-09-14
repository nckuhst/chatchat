import { TIER_ORDER } from './types'
import type { Question, Rng, Tier } from './types'

/** Fisher-Yates。不修改輸入。 */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * 建立牌堆：層級之間固定由淺入深，層級之內隨機洗牌。
 * 回傳題目 id 的陣列。
 */
export function buildDeck(
  questions: readonly Question[],
  selectedTiers: readonly Tier[],
  rng: Rng,
): string[] {
  const selected = new Set<Tier>(selectedTiers)
  const deck: string[] = []

  for (const tier of TIER_ORDER) {
    if (!selected.has(tier)) continue
    const idsInTier = questions.filter((q) => q.tier === tier).map((q) => q.id)
    deck.push(...shuffle(idsInTier, rng))
  }

  return deck
}

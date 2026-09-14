export type Tier = 'warmup' | 'star1' | 'star2' | 'star3'

export const TIER_ORDER: readonly Tier[] = ['warmup', 'star1', 'star2', 'star3']

export const TIER_LABEL: Record<Tier, string> = {
  warmup: '暖身破冰',
  star1: '一星',
  star2: '二星',
  star3: '三星',
}

export interface Question {
  id: string
  tier: Tier
  text: string
}

export interface GameState {
  selectedTiers: Tier[]
  deck: string[]
  position: number
  skipped: string[]
  startedAt: number
}

/** 回傳 [0, 1) 的亂數。注入以便測試可重現。 */
export type Rng = () => number

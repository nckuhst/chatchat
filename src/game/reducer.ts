import { buildDeck } from './deck'
import type { GameState, Question, Rng, Tier } from './types'

export type GameAction =
  | { type: 'next' }
  | { type: 'swap' }
  | { type: 'next-tier'; byId: Readonly<Record<string, Question>> }

export function indexQuestions(questions: readonly Question[]): Record<string, Question> {
  return Object.fromEntries(questions.map((q) => [q.id, q]))
}

export function createGame(
  questions: readonly Question[],
  selectedTiers: readonly Tier[],
  rng: Rng,
  now: number,
): GameState {
  return {
    selectedTiers: [...selectedTiers],
    deck: buildDeck(questions, selectedTiers, rng),
    position: 0,
    skipped: [],
    startedAt: now,
  }
}

export function currentQuestionId(state: GameState): string | null {
  return state.deck[state.position] ?? null
}

export function isFinished(state: GameState): boolean {
  return state.position >= state.deck.length
}

export function isTierBoundary(
  state: GameState,
  byId: Readonly<Record<string, Question>>,
): boolean {
  if (state.position === 0 || isFinished(state)) return false
  const current = byId[state.deck[state.position]]
  const previous = byId[state.deck[state.position - 1]]
  // 牌堆裡的 id 可能已不存在於目前的題庫（例如載入了題庫更新前的舊存檔）；
  // 這裡防止對 undefined 取 .tier 而炸掉整個畫面。
  if (!current || !previous) return false
  return current.tier !== previous.tier
}

/**
 * 判斷一份存檔是否值得提供「繼續上一場」：
 * 尚未完成，且牌堆中每個題目 id 都存在於目前的題庫。
 * 後者防止題庫改版後，舊存檔指向已不存在的題目 id，
 * 讓遊戲畫面在解參考時炸掉（見 isTierBoundary 的防護註解）。
 */
export function isResumable(
  state: GameState,
  byId: Readonly<Record<string, Question>>,
): boolean {
  return !isFinished(state) && state.deck.every((id) => id in byId)
}

/** 下一個已選階段的第一張卡；最後階段或已結束時回傳 null。 */
export function nextTierPosition(
  state: GameState,
  byId: Readonly<Record<string, Question>>,
): number | null {
  const current = byId[state.deck[state.position]]
  if (!current || isFinished(state)) return null
  const position = state.deck.findIndex((id, index) =>
    index > state.position && byId[id] !== undefined && byId[id].tier !== current.tier,
  )
  return position === -1 ? null : position
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (isFinished(state)) return state

  switch (action.type) {
    case 'next-tier': {
      const position = nextTierPosition(state, action.byId)
      if (position === null) return state
      return {
        ...state,
        position,
        skipped: [...state.skipped, ...state.deck.slice(state.position, position)],
      }
    }
    case 'next':
      return { ...state, position: state.position + 1 }
    case 'swap':
      return {
        ...state,
        position: state.position + 1,
        skipped: [...state.skipped, state.deck[state.position]],
      }
  }
}

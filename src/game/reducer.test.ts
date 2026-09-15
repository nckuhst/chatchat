import { describe, expect, it } from 'vitest'
import {
  createGame,
  currentQuestionId,
  gameReducer,
  indexQuestions,
  isFinished,
  isResumable,
  isTierBoundary,
  nextTierPosition,
} from './reducer'
import type { GameState, Question, Rng } from './types'

const rng: Rng = () => 0

const questions: Question[] = [
  { id: 'w-01', tier: 'warmup', text: '暖身一' },
  { id: 'w-02', tier: 'warmup', text: '暖身二' },
  { id: 's1-01', tier: 'star1', text: '一星一' },
]

const byId = indexQuestions(questions)

/** 固定牌堆，避免測試依賴洗牌結果。 */
function stateWithDeck(deck: string[], position = 0): GameState {
  return { selectedTiers: ['warmup', 'star1'], deck, position, skipped: [], startedAt: 0 }
}

describe('createGame', () => {
  it('從 0 開始，且記錄起始時間與選中的層級', () => {
    const state = createGame(questions, ['warmup'], rng, 1234)
    expect(state.position).toBe(0)
    expect(state.skipped).toEqual([])
    expect(state.startedAt).toBe(1234)
    expect(state.selectedTiers).toEqual(['warmup'])
  })

  it('牌堆只含選中層級的題目', () => {
    const state = createGame(questions, ['star1'], rng, 0)
    expect(state.deck).toEqual(['s1-01'])
  })
})

describe('currentQuestionId', () => {
  it('回傳目前位置的題目 id', () => {
    expect(currentQuestionId(stateWithDeck(['w-01', 'w-02'], 1))).toBe('w-02')
  })

  it('牌堆耗盡時回傳 null', () => {
    expect(currentQuestionId(stateWithDeck(['w-01'], 1))).toBeNull()
  })
})

describe('gameReducer', () => {
  it('next 使位置前進，且不記錄 skipped', () => {
    const next = gameReducer(stateWithDeck(['w-01', 'w-02']), { type: 'next' })
    expect(next.position).toBe(1)
    expect(next.skipped).toEqual([])
  })

  it('swap 記錄目前題目並前進', () => {
    const next = gameReducer(stateWithDeck(['w-01', 'w-02']), { type: 'swap' })
    expect(next.position).toBe(1)
    expect(next.skipped).toEqual(['w-01'])
  })

  it('不修改原本的 state', () => {
    const state = stateWithDeck(['w-01', 'w-02'])
    gameReducer(state, { type: 'swap' })
    expect(state.position).toBe(0)
    expect(state.skipped).toEqual([])
  })

  it('位置不會超過牌堆長度', () => {
    const state = gameReducer(stateWithDeck(['w-01'], 1), { type: 'next' })
    expect(state.position).toBe(1)
  })

  it('牌堆耗盡時 swap 不記錄任何東西', () => {
    const state = gameReducer(stateWithDeck(['w-01'], 1), { type: 'swap' })
    expect(state.skipped).toEqual([])
  })
})

describe('isFinished', () => {
  it('位置到達牌堆長度時為 true', () => {
    expect(isFinished(stateWithDeck(['w-01'], 1))).toBe(true)
  })

  it('還有卡可抽時為 false', () => {
    expect(isFinished(stateWithDeck(['w-01', 'w-02'], 1))).toBe(false)
  })

  it('空牌堆視為已結束', () => {
    expect(isFinished(stateWithDeck([], 0))).toBe(true)
  })
})

describe('isTierBoundary', () => {
  it('第一張卡不算跨層', () => {
    expect(isTierBoundary(stateWithDeck(['w-01', 's1-01'], 0), byId)).toBe(false)
  })

  it('層級改變時為 true', () => {
    expect(isTierBoundary(stateWithDeck(['w-01', 's1-01'], 1), byId)).toBe(true)
  })

  it('同層級之內為 false', () => {
    expect(isTierBoundary(stateWithDeck(['w-01', 'w-02'], 1), byId)).toBe(false)
  })

  it('牌堆耗盡時為 false', () => {
    expect(isTierBoundary(stateWithDeck(['w-01'], 1), byId)).toBe(false)
  })
})

describe('isResumable', () => {
  it('尚未結束、且牌堆 id 都存在於題庫時為 true', () => {
    expect(isResumable(stateWithDeck(['w-01', 'w-02'], 1), byId)).toBe(true)
  })

  it('已結束的存檔為 false', () => {
    expect(isResumable(stateWithDeck(['w-01'], 1), byId)).toBe(false)
  })

  it('牌堆含有題庫裡已不存在的 id 時為 false', () => {
    expect(isResumable(stateWithDeck(['w-01', 'gone'], 1), byId)).toBe(false)
  })

  it('空牌堆（視為已結束）為 false', () => {
    expect(isResumable(stateWithDeck([], 0), byId)).toBe(false)
  })
})


describe('跳到下一階段', () => {
  const expandedById = indexQuestions([
    ...questions,
    { id: 's3-01', tier: 'star3', text: '心裡話' },
  ])

  it('略過當前階段剩餘題目，停在下一階段第一題並觸發過場', () => {
    const state = stateWithDeck(['w-01', 'w-02', 's1-01'])
    const next = gameReducer(state, { type: 'next-tier', byId })
    expect(next.position).toBe(2)
    expect(currentQuestionId(next)).toBe('s1-01')
    expect(next.skipped).toEqual(['w-01', 'w-02'])
    expect(isTierBoundary(next, byId)).toBe(true)
    expect(state.position).toBe(0)
    expect(state.skipped).toEqual([])
    expect(next.deck).toEqual(state.deck)
  })

  it('只前往有選取的下一階段', () => {
    const state = stateWithDeck(['w-01', 'w-02', 's3-01'])
    state.selectedTiers = ['warmup', 'star3']
    const next = gameReducer(state, { type: 'next-tier', byId: expandedById })
    expect(currentQuestionId(next)).toBe('s3-01')
    expect(isTierBoundary(next, expandedById)).toBe(true)
  })

  it('保留先前換掉的卡，不把已聊過的卡計入略過張數', () => {
    const state = gameReducer(stateWithDeck(['w-01', 'w-02', 's1-01']), { type: 'swap' })
    const next = gameReducer(state, { type: 'next-tier', byId })
    expect(next.skipped).toEqual(['w-01', 'w-02'])
    const chatted = gameReducer(stateWithDeck(['w-01', 'w-02', 's1-01']), { type: 'next' })
    expect(gameReducer(chatted, { type: 'next-tier', byId }).skipped).toEqual(['w-02'])
  })

  it('最後階段不提供跳階段，也不結束遊戲', () => {
    const state = stateWithDeck(['w-01', 'w-02'])
    expect(nextTierPosition(state, byId)).toBeNull()
    expect(gameReducer(state, { type: 'next-tier', byId })).toBe(state)
  })

  it('已完成或題目不存在時不跳轉', () => {
    const finished = stateWithDeck(['w-01', 's1-01'], 2)
    expect(nextTierPosition(finished, byId)).toBeNull()
    expect(gameReducer(finished, { type: 'next-tier', byId })).toBe(finished)
    const missing = stateWithDeck(['missing', 's1-01'])
    expect(nextTierPosition(missing, byId)).toBeNull()
    expect(gameReducer(missing, { type: 'next-tier', byId })).toBe(missing)
  })
})

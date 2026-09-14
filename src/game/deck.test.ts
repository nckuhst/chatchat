import { describe, expect, it } from 'vitest'
import { buildDeck, shuffle } from './deck'
import type { Question, Rng } from './types'

/** 固定序列的假亂數，讓洗牌結果可預測。 */
function seededRng(values: number[]): Rng {
  let i = 0
  return () => values[i++ % values.length]
}

const questions: Question[] = [
  { id: 'w-01', tier: 'warmup', text: '暖身一' },
  { id: 'w-02', tier: 'warmup', text: '暖身二' },
  { id: 's1-01', tier: 'star1', text: '一星一' },
  { id: 's1-02', tier: 'star1', text: '一星二' },
  { id: 's2-01', tier: 'star2', text: '二星一' },
  { id: 's3-01', tier: 'star3', text: '三星一' },
]

describe('shuffle', () => {
  it('不修改原陣列', () => {
    const input = [1, 2, 3, 4]
    shuffle(input, seededRng([0]))
    expect(input).toEqual([1, 2, 3, 4])
  })

  it('保留所有元素', () => {
    const result = shuffle([1, 2, 3, 4], seededRng([0.9, 0.1, 0.5]))
    expect([...result].sort()).toEqual([1, 2, 3, 4])
  })

  it('相同的 rng 序列產生相同結果', () => {
    const a = shuffle([1, 2, 3, 4, 5], seededRng([0.2, 0.7, 0.4, 0.9]))
    const b = shuffle([1, 2, 3, 4, 5], seededRng([0.2, 0.7, 0.4, 0.9]))
    expect(a).toEqual(b)
  })
})

describe('buildDeck', () => {
  it('只包含選中層級的題目', () => {
    const deck = buildDeck(questions, ['warmup', 'star2'], seededRng([0]))
    expect([...deck].sort()).toEqual(['s2-01', 'w-01', 'w-02'])
  })

  it('未選的層級完全不出現', () => {
    const deck = buildDeck(questions, ['star3'], seededRng([0]))
    expect(deck).toEqual(['s3-01'])
  })

  it('層級順序恆為由淺入深，與傳入順序無關', () => {
    const deck = buildDeck(questions, ['star3', 'warmup', 'star1'], seededRng([0]))
    const tierOf = (id: string) => questions.find((q) => q.id === id)!.tier
    expect(deck.map(tierOf)).toEqual(['warmup', 'warmup', 'star1', 'star1', 'star3'])
  })

  it('沒有選任何層級時回傳空牌堆', () => {
    expect(buildDeck(questions, [], seededRng([0]))).toEqual([])
  })

  it('牌堆內沒有重複的題目', () => {
    const deck = buildDeck(questions, ['warmup', 'star1', 'star2', 'star3'], seededRng([0.3, 0.8]))
    expect(new Set(deck).size).toBe(deck.length)
  })
})

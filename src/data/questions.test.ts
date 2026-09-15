import { describe, expect, it } from 'vitest'
import { QUESTIONS } from './questions'
import { TIER_ORDER } from '../game/types'
import type { Tier } from '../game/types'

const PREFIX: Record<Tier, string> = {
  warmup: 'w-',
  star1: 's1-',
  star2: 's2-',
  star3: 's3-',
}

describe('題庫', () => {
  it.each(TIER_ORDER)('%s 階段至少有一題', (tier) => {
    expect(QUESTIONS.filter((q) => q.tier === tier).length).toBeGreaterThan(0)
  })

  it('id 全部唯一', () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length)
  })

  it('id 前綴符合所屬層級', () => {
    for (const q of QUESTIONS) {
      expect(q.id.startsWith(PREFIX[q.tier])).toBe(true)
    }
  })

  it('題目文字非空', () => {
    for (const q of QUESTIONS) {
      expect(q.text.trim().length).toBeGreaterThan(0)
    }
  })

  it('題目文字不重複', () => {
    expect(new Set(QUESTIONS.map((q) => q.text)).size).toBe(QUESTIONS.length)
  })
})

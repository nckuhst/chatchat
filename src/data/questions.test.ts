import { describe, expect, it } from 'vitest'
import { QUESTIONS } from './questions'
import { TIER_ORDER } from '../game/types'
import type { Tier } from '../game/types'

const EXPECTED_COUNTS: Record<Tier, number> = {
  warmup: 20,
  star1: 20,
  star2: 20,
  star3: 15,
}

const PREFIX: Record<Tier, string> = {
  warmup: 'w-',
  star1: 's1-',
  star2: 's2-',
  star3: 's3-',
}

describe('題庫', () => {
  it('總共 75 題', () => {
    expect(QUESTIONS).toHaveLength(75)
  })

  it.each(TIER_ORDER)('%s 層級的張數正確', (tier) => {
    expect(QUESTIONS.filter((q) => q.tier === tier)).toHaveLength(EXPECTED_COUNTS[tier])
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

  it('每題都是問句', () => {
    for (const q of QUESTIONS) {
      expect(q.text.trim().endsWith('？')).toBe(true)
    }
  })
})

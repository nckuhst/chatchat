import { beforeEach, describe, expect, it } from 'vitest'
import { SCHEMA_VERSION, STORAGE_KEY, clearGame, loadGame, saveGame } from './storage'
import type { StorageLike } from './storage'
import type { GameState } from './types'

function fakeStorage(): StorageLike & { raw: Map<string, string> } {
  const raw = new Map<string, string>()
  return {
    raw,
    getItem: (key) => raw.get(key) ?? null,
    setItem: (key, value) => void raw.set(key, value),
    removeItem: (key) => void raw.delete(key),
  }
}

const state: GameState = {
  selectedTiers: ['warmup', 'star1'],
  deck: ['w-01', 's1-01'],
  position: 1,
  skipped: ['w-02'],
  startedAt: 1700000000000,
}

let storage: ReturnType<typeof fakeStorage>

beforeEach(() => {
  storage = fakeStorage()
})

describe('saveGame / loadGame', () => {
  it('存檔後讀回得到相同的狀態', () => {
    saveGame(state, storage)
    expect(loadGame(storage)).toEqual(state)
  })

  it('沒有存檔時回傳 null', () => {
    expect(loadGame(storage)).toBeNull()
  })

  it('存檔內含 schema 版本號', () => {
    saveGame(state, storage)
    expect(JSON.parse(storage.raw.get(STORAGE_KEY)!).version).toBe(SCHEMA_VERSION)
  })
})

describe('loadGame 的防禦', () => {
  it('版本不符時回傳 null', () => {
    storage.raw.set(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION + 1, state }))
    expect(loadGame(storage)).toBeNull()
  })

  it('JSON 損毀時回傳 null 而不拋錯', () => {
    storage.raw.set(STORAGE_KEY, '{ this is not json')
    expect(() => loadGame(storage)).not.toThrow()
    expect(loadGame(storage)).toBeNull()
  })

  it('狀態結構不完整時回傳 null', () => {
    storage.raw.set(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, state: { deck: 'nope' } }))
    expect(loadGame(storage)).toBeNull()
  })

  it('缺少 state 欄位時回傳 null', () => {
    storage.raw.set(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION }))
    expect(loadGame(storage)).toBeNull()
  })
})

describe('clearGame', () => {
  it('清除後讀不到存檔', () => {
    saveGame(state, storage)
    clearGame(storage)
    expect(loadGame(storage)).toBeNull()
  })
})

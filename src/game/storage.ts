import type { GameState } from './types'

export const STORAGE_KEY = 'deep-talk-cards'
export const SCHEMA_VERSION = 1

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

function isGameState(value: unknown): value is GameState {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Record<string, unknown>
  return (
    isStringArray(s.selectedTiers) &&
    isStringArray(s.deck) &&
    isStringArray(s.skipped) &&
    typeof s.position === 'number' &&
    typeof s.startedAt === 'number'
  )
}

export function saveGame(state: GameState, storage: StorageLike): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, state }))
  } catch {
    // 私密瀏覽或空間不足時靜默失敗：進度遺失不該讓遊戲中斷。
  }
}

export function loadGame(storage: StorageLike): GameState | null {
  let raw: string | null
  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
  if (raw === null) return null

  try {
    const parsed = JSON.parse(raw) as { version?: unknown; state?: unknown }
    if (parsed.version !== SCHEMA_VERSION) return null
    if (!isGameState(parsed.state)) return null
    return parsed.state
  } catch {
    return null
  }
}

export function clearGame(storage: StorageLike): void {
  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    // 同上，靜默失敗。
  }
}

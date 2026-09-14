import { buildDeck } from './deck'
import type { GameState, Question, Rng, Tier } from './types'

export type GameAction = { type: 'next' } | { type: 'swap' }

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
  if (!current || !previous) return false
  return current.tier !== previous.tier
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (isFinished(state)) return state

  switch (action.type) {
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

import { useEffect, useMemo, useState } from 'react'
import Setup from './screens/Setup'
import Play from './screens/Play'
import { QUESTIONS } from './data/questions'
import { createGame, currentQuestionId, gameReducer, indexQuestions, isFinished } from './game/reducer'
import type { GameAction } from './game/reducer'
import { clearGame, loadGame, saveGame } from './game/storage'
import type { GameState, Tier } from './game/types'

export default function App() {
  const byId = useMemo(() => indexQuestions(QUESTIONS), [])
  const [game, setGame] = useState<GameState | null>(null)
  const [saved, setSaved] = useState<GameState | null>(() => loadGame(localStorage))

  useEffect(() => {
    if (game) saveGame(game, localStorage)
  }, [game])

  function start(tiers: Tier[]) {
    setSaved(null)
    clearGame(localStorage)
    setGame(createGame(QUESTIONS, tiers, Math.random, Date.now()))
  }

  function resume() {
    setGame(saved)
    setSaved(null)
  }

  if (!game) {
    return <Setup savedExists={saved !== null} onStart={start} onResume={resume} />
  }

  function dispatch(action: GameAction) {
    setGame((current) => (current ? gameReducer(current, action) : current))
  }

  if (isFinished(game)) {
    return <main className="screen">（牌堆已用完）</main>
  }

  const questionId = currentQuestionId(game)!
  return (
    <Play
      question={byId[questionId]}
      index={game.position}
      total={game.deck.length}
      onNext={() => dispatch({ type: 'next' })}
      onSwap={() => dispatch({ type: 'swap' })}
    />
  )
}

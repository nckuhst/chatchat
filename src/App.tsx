import { useEffect, useMemo, useState } from 'react'
import Setup from './screens/Setup'
import Play from './screens/Play'
import Finished from './screens/Finished'
import Interstitial from './screens/Interstitial'
import { QUESTIONS } from './data/questions'
import {
  createGame,
  currentQuestionId,
  gameReducer,
  indexQuestions,
  isFinished,
  isResumable,
  isTierBoundary,
} from './game/reducer'
import type { GameAction } from './game/reducer'
import { clearGame, loadGame, saveGame } from './game/storage'
import type { GameState, Tier } from './game/types'

export default function App() {
  const byId = useMemo(() => indexQuestions(QUESTIONS), [])
  const [game, setGame] = useState<GameState | null>(null)
  const [saved, setSaved] = useState<GameState | null>(() => {
    const s = loadGame(localStorage)
    return s && isResumable(s, byId) ? s : null
  })
  const [ackPosition, setAckPosition] = useState<number | null>(null)

  useEffect(() => {
    if (game) saveGame(game, localStorage)
  }, [game])

  // useState 的惰性初始化式不該有副作用，所以「丟棄不可繼續的舊存檔」
  // 放到這個掛載後才跑一次的 effect 裡，而不是塞進上面的初始化式。
  useEffect(() => {
    const s = loadGame(localStorage)
    if (s && !isResumable(s, byId)) clearGame(localStorage)
  }, [])

  function start(tiers: Tier[]) {
    setSaved(null)
    clearGame(localStorage)
    setAckPosition(null)
    setGame(createGame(QUESTIONS, tiers, Math.random, Date.now()))
  }

  function resume() {
    setGame(saved)
    setSaved(null)
  }

  function restart() {
    clearGame(localStorage)
    setGame(null)
    setAckPosition(null)
  }

  if (!game) {
    return <Setup savedExists={saved !== null} onStart={start} onResume={resume} />
  }

  function dispatch(action: GameAction) {
    setGame((current) => (current ? gameReducer(current, action) : current))
  }

  if (isFinished(game)) {
    return <Finished total={game.deck.length} skipped={game.skipped.length} onRestart={restart} />
  }

  const questionId = currentQuestionId(game)!

  if (isTierBoundary(game, byId) && ackPosition !== game.position) {
    return (
      <Interstitial
        tier={byId[questionId].tier}
        onContinue={() => setAckPosition(game.position)}
      />
    )
  }

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

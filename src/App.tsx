import { useEffect, useMemo, useState } from 'react'
import Setup from './screens/Setup'
import { QUESTIONS } from './data/questions'
import { createGame, indexQuestions } from './game/reducer'
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

  const id = game.deck[game.position]
  return <main className="screen">{id ? byId[id].text : '（牌堆已用完）'}</main>
}

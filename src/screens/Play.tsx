import Card from '../components/Card'
import HomeHeader from '../components/HomeHeader'
import { TIER_LABEL } from '../game/types'
import type { Question, Tier } from '../game/types'

interface PlayProps {
  question: Question
  index: number
  total: number
  onNext: () => void
  onSwap: () => void
  onHome: () => void
  nextTier: Tier | null
  onNextTier: () => void
}

export default function Play({ question, index, total, onNext, onSwap, onHome, nextTier, onNextTier }: PlayProps) {
  return (
    <main className="screen screen--play">
      <HomeHeader onHome={onHome} />
      <p className="progress">
        第 {index + 1} / {total} 張
      </p>

      <Card question={question} />

      <div className="actions">
        <button type="button" className="button" onClick={onSwap}>
          換一張
        </button>
        <button type="button" className="button button--primary" onClick={onNext}>
          下一張
        </button>
      </div>
      {nextTier !== null ? (
        <button type="button" className="button next-tier" onClick={onNextTier}>
          跳到下一階段：{TIER_LABEL[nextTier]} <span aria-hidden="true">→</span>
        </button>
      ) : (
        <p className="gentle-note">來到最後一疊了，慢慢切，不用趕。</p>
      )}
    </main>
  )
}

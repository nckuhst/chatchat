import Card from '../components/Card'
import type { Question } from '../game/types'

interface PlayProps {
  question: Question
  index: number
  total: number
  onNext: () => void
  onSwap: () => void
}

export default function Play({ question, index, total, onNext, onSwap }: PlayProps) {
  return (
    <main className="screen screen--play">
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
    </main>
  )
}

import { TIER_LABEL } from '../game/types'
import type { Question } from '../game/types'

export default function Card({ question }: { question: Question }) {
  return (
    <article className="card" data-tier={question.tier}>
      <span className="card__tier">{TIER_LABEL[question.tier]}</span>
      <p className="card__text">{question.text}</p>
    </article>
  )
}

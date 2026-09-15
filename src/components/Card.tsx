import Bloom from './Bloom'
import { TIER_LABEL } from '../game/types'
import type { Question } from '../game/types'

export default function Card({ question }: { question: Question }) {
  return (
    <article className="card" data-tier={question.tier}>
      <span className="card__tier">{TIER_LABEL[question.tier]}</span>
      <Bloom className="card__flower" />
      <h1 className="card__text">{question.text}</h1>
      <p className="card__footer">慢慢想，說一點點也可以。</p>
    </article>
  )
}

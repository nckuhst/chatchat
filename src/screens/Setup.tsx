import { useState } from 'react'
import Bloom from '../components/Bloom'
import { TIER_LABEL, TIER_ORDER } from '../game/types'
import type { Tier } from '../game/types'

const TIER_DESCRIPTION: Record<Tier, string> = {
  warmup: '聊吃的、玩的，還有生活小事',
  star1: '交換小故事，發現彼此的小小共鳴',
  star2: '開心的、在意的，都能慢慢說',
  star3: '留點時間，給平常沒說的心裡話',
}

interface SetupProps {
  savedExists: boolean
  onStart: (tiers: Tier[]) => void
  onResume: () => void
}

export default function Setup({ savedExists, onStart, onResume }: SetupProps) {
  const [selected, setSelected] = useState<Tier[]>(['warmup'])

  function toggle(tier: Tier) {
    setSelected((current) =>
      current.includes(tier) ? current.filter((t) => t !== tier) : [...current, tier],
    )
  }

  return (
    <main className="screen screen--setup">
      <header className="welcome">
        <p className="eyebrow">隨便聊聊，慢慢熟</p>
        <div className="welcome__cards" aria-hidden="true">
          <div className="mini-card mini-card--back" />
          <div className="mini-card mini-card--middle" />
          <div className="mini-card mini-card--front"><Bloom /><span>chat chat</span></div>
          <span className="welcome__spark">✦</span>
        </div>
        <h1>切切<span className="brand-english">CHAT CHAT</span></h1>
        <p className="welcome__subtitle">聊點日常，也聊點心裡的事。</p>
        <p className="lede">新朋友、老朋友，坐下來切切。<br />從一張卡開始，聊到哪裡都可以。</p>
      </header>

      <fieldset className="tier-picker">
        <legend>今天，想切點什麼？<span>可複選・由淺入深出牌</span></legend>
        {TIER_ORDER.map((tier) => (
          <label key={tier} className="tier-option" data-tier={tier}>
            <span className="tier-option__flower" aria-hidden="true"><Bloom /></span>
            <input
              type="checkbox"
              checked={selected.includes(tier)}
              onChange={() => toggle(tier)}
            />
            <span className="tier-option__copy"><strong>{TIER_LABEL[tier]}</strong><small>{TIER_DESCRIPTION[tier]}</small></span>
          </label>
        ))}
      </fieldset>

      <p className="gentle-note">想到什麼就說什麼，不想聊就換一張。</p>

      <button
        type="button"
        className="button button--primary"
        disabled={selected.length === 0}
        onClick={() => onStart(selected)}
      >
        抽張卡，切切吧
      </button>

      {savedExists && (
        <button type="button" className="button" onClick={onResume}>
          上次切到哪？繼續切
        </button>
      )}
    </main>
  )
}

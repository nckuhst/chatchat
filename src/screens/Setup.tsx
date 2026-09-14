import { useState } from 'react'
import { TIER_LABEL, TIER_ORDER } from '../game/types'
import type { Tier } from '../game/types'

interface SetupProps {
  savedExists: boolean
  onStart: (tiers: Tier[]) => void
  onResume: () => void
}

export default function Setup({ savedExists, onStart, onResume }: SetupProps) {
  const [selected, setSelected] = useState<Tier[]>([...TIER_ORDER])

  function toggle(tier: Tier) {
    setSelected((current) =>
      current.includes(tier) ? current.filter((t) => t !== tier) : [...current, tier],
    )
  }

  return (
    <main className="screen screen--setup">
      <h1>深度對話卡牌</h1>
      <p className="lede">選擇這一場要玩的層級。題目會由淺入深依序出現。</p>

      <fieldset className="tier-picker">
        <legend>層級</legend>
        {TIER_ORDER.map((tier) => (
          <label key={tier} className="tier-option">
            <input
              type="checkbox"
              checked={selected.includes(tier)}
              onChange={() => toggle(tier)}
            />
            <span>{TIER_LABEL[tier]}</span>
          </label>
        ))}
      </fieldset>

      <button
        type="button"
        className="button button--primary"
        disabled={selected.length === 0}
        onClick={() => onStart(selected)}
      >
        開始新的一場
      </button>

      {savedExists && (
        <button type="button" className="button" onClick={onResume}>
          繼續上一場
        </button>
      )}
    </main>
  )
}

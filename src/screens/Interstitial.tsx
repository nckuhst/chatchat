import { TIER_LABEL } from '../game/types'
import type { Tier } from '../game/types'

// `Record<Tier, string>` 要求四個層級都有值。實務上 warmup 恆為第一層，
// 而第一張卡不觸發過場，因此 warmup 這則永遠不會顯示——保留是為了型別完整性，
// 改用 Partial<Record<...>> 只會換來一個沒有價值的 null 檢查。
const BLURB: Record<Tier, string> = {
  warmup: '先從輕鬆的開始，讓大家熱起來。',
  star1: '接下來的題目會多一點你自己。慢慢來，沒有標準答案。',
  star2: '再往內走一點。可以只說你願意說的部分。',
  star3: '最後這些題目會問得比較深。任何人都可以隨時喊停或跳過。',
}

interface InterstitialProps {
  tier: Tier
  onContinue: () => void
}

export default function Interstitial({ tier, onContinue }: InterstitialProps) {
  return (
    <main className="screen screen--interstitial" data-tier={tier}>
      <p className="interstitial__label">接下來是</p>
      <h2 className="interstitial__tier">{TIER_LABEL[tier]}</h2>
      <p className="interstitial__blurb">{BLURB[tier]}</p>
      <button type="button" className="button button--primary" onClick={onContinue}>
        繼續
      </button>
    </main>
  )
}

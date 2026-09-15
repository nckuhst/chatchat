import HomeHeader from '../components/HomeHeader'
import Bloom from '../components/Bloom'
import { TIER_LABEL } from '../game/types'
import type { Tier } from '../game/types'

// `Record<Tier, string>` 要求四個層級都有值。實務上 warmup 恆為第一層，
// 而第一張卡不觸發過場，因此 warmup 這則永遠不會顯示——保留是為了型別完整性，
// 改用 Partial<Record<...>> 只會換來一個沒有價值的 null 檢查。
const BLURB: Record<Tier, string> = {
  warmup: '從生活裡的小事開始，看看有沒有「我也是！」的時刻。',
  star1: '你的小故事，我也想聽聽。想到哪裡，就從哪裡說起。',
  star2: '最近心裡是晴天，還是有點多雲？想分享多少，都剛剛好。',
  star3: '這一疊，聊聊心裡比較深的事。只說想說的，想跳過或休息也可以。',
}

interface InterstitialProps {
  onHome: () => void
  tier: Tier
  onContinue: () => void
}

export default function Interstitial({ tier, onContinue, onHome }: InterstitialProps) {
  return (
    <main className="screen screen--interstitial" data-tier={tier}>
      <HomeHeader onHome={onHome} />
      <Bloom className="interstitial__flower" />
      <p className="interstitial__label">下一疊，切點別的</p>
      <h1 className="interstitial__tier">{TIER_LABEL[tier]}</h1>
      <p className="interstitial__blurb">{BLURB[tier]}</p>
      <button type="button" className="button button--primary" onClick={onContinue}>
        好呀，繼續切
      </button>
    </main>
  )
}

import HomeHeader from '../components/HomeHeader'
import Bloom from '../components/Bloom'

interface FinishedProps {
  onHome: () => void
  total: number
  skipped: number
  onRestart: () => void
}

export default function Finished({ total, skipped, onRestart, onHome }: FinishedProps) {
  return (
    <main className="screen screen--finished">
      <HomeHeader onHome={onHome} />
      <Bloom className="finished__flower" />
      <h1>今天先切到這裡</h1>
      <p className="lede">
        這一回聊了 {total - skipped} 張卡{skipped > 0 && `，略過了 ${skipped} 張`}。
      </p>
      <p className="lede">謝謝你，分了一點日常、一點自己給我。</p>
      <button type="button" className="button button--primary" onClick={onRestart}>
        再切一回
      </button>
    </main>
  )
}

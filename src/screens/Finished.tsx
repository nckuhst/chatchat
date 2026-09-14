interface FinishedProps {
  total: number
  skipped: number
  onRestart: () => void
}

export default function Finished({ total, skipped, onRestart }: FinishedProps) {
  return (
    <main className="screen screen--finished">
      <h2>今天就到這裡</h2>
      <p className="lede">
        你們一起翻完了 {total} 張卡{skipped > 0 && `，換掉了 ${skipped} 張`}。
      </p>
      <p className="lede">謝謝每個人願意說出口的部分。</p>
      <button type="button" className="button button--primary" onClick={onRestart}>
        重新開始
      </button>
    </main>
  )
}

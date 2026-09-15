interface HomeHeaderProps {
  onHome: () => void
}

export default function HomeHeader({ onHome }: HomeHeaderProps) {
  return (
    <header className="play-brand">
      <button type="button" className="home-link" onClick={onHome} aria-label="切切，返回主畫面">
        切切<span className="home-link__english">CHAT CHAT</span>
      </button>
      <span>一張卡，聊一下</span>
    </header>
  )
}

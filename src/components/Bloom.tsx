/** Small, decorative paper flower shared by the cards and welcome screen. */
export default function Bloom({ className = '' }: { className?: string }) {
  return (
    <svg className={`bloom ${className}`} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <g fill="currentColor">
        <ellipse cx="50" cy="29" rx="14" ry="23" />
        <ellipse cx="50" cy="29" rx="14" ry="23" transform="rotate(60 50 50)" />
        <ellipse cx="50" cy="29" rx="14" ry="23" transform="rotate(120 50 50)" />
        <ellipse cx="50" cy="29" rx="14" ry="23" transform="rotate(180 50 50)" />
        <ellipse cx="50" cy="29" rx="14" ry="23" transform="rotate(240 50 50)" />
        <ellipse cx="50" cy="29" rx="14" ry="23" transform="rotate(300 50 50)" />
      </g>
      <circle cx="50" cy="50" r="14" fill="#fff8e8" />
      <path d="M44 51c2 5 10 5 12 0" stroke="#78634d" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

type Props = {
  size?: number
}

export default function Logo({ size = 22 }: Props) {
  const s = size
  const bx = s * 0.19
  const by = s * 0.32
  const bw = s * 0.62
  const bh = s * 0.50
  const clapH = s * 0.12
  const sw = s * 0.04

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} aria-hidden="true">
      <rect x={bx} y={by} width={bw} height={bh} rx={s * 0.03} fill="var(--accent)" />
      <rect x={bx} y={by - clapH} width={bw} height={clapH + s * 0.03} rx={s * 0.02} fill="var(--accent)" opacity="0.75" />
      <polyline
        points={`${bx + bw * 0.3},${by + bh * 0.45} ${bx + bw * 0.3 + bh * 0.3 * 0.35},${by + bh * 0.45 + bh * 0.3 * 0.35} ${bx + bw * 0.3 + bh * 0.3},${by + bh * 0.45 - bh * 0.3 * 0.3}`}
        fill="none"
        stroke="var(--bg)"
        strokeWidth={sw * 1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

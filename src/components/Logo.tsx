type Props = {
  size?: number
}

export default function Logo({ size = 22 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
      <circle cx="256" cy="256" r="200" fill="none" stroke="var(--accent)" strokeWidth="28" />
      <polygon points="210,160 350,256 210,352" fill="var(--accent)" />
    </svg>
  )
}

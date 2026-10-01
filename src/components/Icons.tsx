type Props = { size?: number; className?: string; color?: string }

const d = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export function IconList({ size = 18, className, color }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...d} className={className} style={{ color }}>
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  )
}

export function IconUsers({ size = 18, className, color }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...d} className={className} style={{ color }}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

export function IconBell({ size = 18, className, color }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...d} className={className} style={{ color }}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

export function IconSettings({ size = 18, className, color }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...d} className={className} style={{ color }}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function IconFilm({ size = 18, className, color }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...d} className={className} style={{ color }}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M7 3v18" />
      <path d="M3 7.5h4" />
      <path d="M3 12h18" />
      <path d="M3 16.5h4" />
      <path d="M17 3v18" />
      <path d="M17 7.5h4" />
      <path d="M17 16.5h4" />
    </svg>
  )
}

export function IconUser({ size = 18, className, color }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...d} className={className} style={{ color }}>
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  )
}

export function IconHandshake({ size = 18, className, color }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...d} className={className} style={{ color }}>
      <path d="m11 17 2 2a1 1 0 1 0 3-3" />
      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88" />
      <path d="m16 16 3.5 3.5a1 1 0 1 0 3-3L19 13" />
      <path d="M2 12h5" />
      <path d="M17 12h5" />
    </svg>
  )
}

export function IconEye({ size = 18, className, color }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...d} className={className} style={{ color }}>
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function IconEyeOff({ size = 18, className, color }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...d} className={className} style={{ color }}>
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  )
}

export function IconLogout({ size = 18, className, color }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...d} className={className} style={{ color }}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  )
}

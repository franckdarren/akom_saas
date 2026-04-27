import type { SVGProps } from 'react'

type IconProps = { size?: number } & SVGProps<SVGSVGElement>

const Icon = ({ size = 20, children, ...props }: { size?: number; children: React.ReactNode } & SVGProps<SVGSVGElement>) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
)

export const IconArrowRight = ({ size = 16 }: IconProps) => (
  <Icon size={size}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></Icon>
)
export const IconCheck = ({ size = 16 }: IconProps) => (
  <Icon size={size}><polyline points="20 6 9 17 4 12"/></Icon>
)
export const IconChevDown = ({ size = 18 }: IconProps) => (
  <Icon size={size}><polyline points="6 9 12 15 18 9"/></Icon>
)
export const IconQr = ({ size = 20 }: IconProps) => (
  <Icon size={size}>
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <path d="M14 14h3v3h-3z"/>
    <path d="M20 14v3"/><path d="M14 20h3"/><path d="M20 20h1"/>
  </Icon>
)
export const IconBook = ({ size = 20 }: IconProps) => (
  <Icon size={size}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </Icon>
)
export const IconChef = ({ size = 20 }: IconProps) => (
  <Icon size={size}>
    <path d="M6 13.87A4 4 0 0 1 7.41 6 5.11 5.11 0 0 1 17 6a4 4 0 0 1 1.4 7.87"/>
    <path d="M6 17h12v3a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z"/>
  </Icon>
)
export const IconLock = ({ size = 20 }: IconProps) => (
  <Icon size={size}>
    <rect x="3" y="11" width="18" height="10" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </Icon>
)
export const IconChart = ({ size = 20 }: IconProps) => (
  <Icon size={size}>
    <path d="M3 3v18h18"/><path d="M7 14l3-3 4 4 5-6"/>
  </Icon>
)
export const IconBox = ({ size = 20 }: IconProps) => (
  <Icon size={size}>
    <path d="M21 8 12 3 3 8v8l9 5 9-5z"/>
    <path d="m3 8 9 5 9-5"/><path d="M12 13v8"/>
  </Icon>
)
export const IconBell = ({ size = 20 }: IconProps) => (
  <Icon size={size}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
    <path d="M10 21a2 2 0 0 0 4 0"/>
  </Icon>
)
export const IconCard = ({ size = 20 }: IconProps) => (
  <Icon size={size}>
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <path d="M2 10h20"/>
  </Icon>
)
export const IconWifi = ({ size = 20 }: IconProps) => (
  <Icon size={size}>
    <path d="M5 12.55a11 11 0 0 1 14 0"/>
    <path d="M2 8.5a16 16 0 0 1 20 0"/>
    <path d="M8.5 16.4a6 6 0 0 1 7 0"/>
    <path d="M12 20h.01"/>
  </Icon>
)
export const IconUsers = ({ size = 20 }: IconProps) => (
  <Icon size={size}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="8.5" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </Icon>
)
export const IconStar = ({ size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
    <polygon points="12 2 15 9 22 9.5 17 14.5 18.5 21.5 12 18 5.5 21.5 7 14.5 2 9.5 9 9 12 2"/>
  </svg>
)
export const IconPlay = ({ size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
    <polygon points="6 4 20 12 6 20 6 4"/>
  </svg>
)
export const IconPause = ({ size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
    <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
  </svg>
)
export const IconReset = ({ size = 14 }: IconProps) => (
  <Icon size={size}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8"/>
    <polyline points="3 3 3 8 8 8"/>
  </Icon>
)
export const IconVolume = ({ size = 14 }: IconProps) => (
  <Icon size={size}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M15.5 8.5a4 4 0 0 1 0 7"/>
  </Icon>
)
export const IconCheckCircle = ({ size = 32 }: IconProps) => (
  <Icon size={size}>
    <circle cx="12" cy="12" r="10"/>
    <polyline points="8 12 11 15 16 9"/>
  </Icon>
)

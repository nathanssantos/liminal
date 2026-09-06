import type { ReactElement } from 'react'

type IconProps = { className?: string }

function icon(path: ReactElement): (props: IconProps) => ReactElement {
  return ({ className }: IconProps) => (
    <svg
      className={['lm-icon', className].filter(Boolean).join(' ')}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {path}
    </svg>
  )
}

export const PlayIcon = icon(<path d="M5 3.4 12.4 8 5 12.6Z" fill="currentColor" stroke="none" />)

export const PauseIcon = icon(
  <g fill="currentColor" stroke="none">
    <rect x="4" y="3.5" width="2.6" height="9" rx="0.8" />
    <rect x="9.4" y="3.5" width="2.6" height="9" rx="0.8" />
  </g>,
)

export const StopIcon = icon(
  <rect x="4" y="4" width="8" height="8" rx="1.2" fill="currentColor" stroke="none" />,
)

export const ChevronDownIcon = icon(<path d="m4 6.2 4 4 4-4" />)

export const CheckIcon = icon(<path d="m3.6 8.4 3 3 5.8-6.8" />)

export const CloseIcon = icon(<path d="m4 4 8 8M12 4l-8 8" />)

export const AlertIcon = icon(
  <g>
    <circle cx="8" cy="8" r="6.2" />
    <path d="M8 5v3.6M8 11h.01" />
  </g>,
)

export const SpinnerIcon = icon(
  <g>
    <circle cx="8" cy="8" r="6" opacity="0.3" />
    <path d="M14 8a6 6 0 0 0-6-6" />
  </g>,
)

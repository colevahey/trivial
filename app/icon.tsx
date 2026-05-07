import { ImageResponse } from 'next/og'

export function generateImageMetadata() {
  return [
    { id: 'sm', contentType: 'image/png', size: { width: 32,  height: 32  } },
    { id: 'md', contentType: 'image/png', size: { width: 192, height: 192 } },
    { id: 'lg', contentType: 'image/png', size: { width: 512, height: 512 } },
  ]
}

const SIZES = {
  sm: { width: 32,  height: 32  },
  md: { width: 192, height: 192 },
  lg: { width: 512, height: 512 },
} as const

export default function Icon({ id }: { id: string }) {
  const { width, height } = SIZES[id as keyof typeof SIZES] ?? SIZES.md
  const iconSize = Math.round(width * 0.56)

  return new ImageResponse(
    (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f59e0b',
        }}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#18181b"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
      </div>
    ),
    { width, height }
  )
}

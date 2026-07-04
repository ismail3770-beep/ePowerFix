export default function ArrowRightIcon({ className = '', size = 24, color }: { className?: string; size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  )
}

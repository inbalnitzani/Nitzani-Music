// The "C" ring from the logo, open on the right like the mark itself.
// Decorative only: size and position it with className.
export default function BrandArc({ className = '', strokeWidth = 3 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" className={className}>
      <path
        d="M85.24 79.57 A46 46 0 1 1 85.24 20.43"
        stroke="var(--color-primary)"
        strokeWidth={strokeWidth}
        strokeLinecap="butt"
      />
    </svg>
  );
}

export function Mark({ className = "h-9 w-9" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#c2703d" />
      <circle cx="32" cy="32" r="30" fill="url(#mark-sheen)" />
      <circle cx="32" cy="32" r="24" fill="none" stroke="#0e2620" strokeWidth="1.6" strokeDasharray="1.5 3" opacity=".7" />
      <path d="M32 47c-9-6-11-16-4-27 2 9 9 12 12 19-1 4-4 7-8 8z" fill="#0e2620" />
      <path d="M32 47c0-8 1.5-14 5.5-20" stroke="#e8a87c" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <defs>
        <linearGradient id="mark-sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".35" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Logo({ light = false, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Mark />
      <span className={`font-display text-[1.7rem] leading-none ${light ? "text-paper" : "text-forest-900"}`}>
        Copperleaf
      </span>
    </span>
  );
}

export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0">
      <rect x="2" y="2" width="60" height="60" rx="18" fill="var(--color-brand)" />
      <path d="M20 18v17a12 12 0 0 0 24 0V18" fill="none" stroke="var(--color-brand-ink)" strokeWidth="6" strokeLinecap="round" />
      <path d="M32 44V27m-7 7 7-7 7 7" fill="none" stroke="var(--color-accent)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={compact ? 30 : 36} />
      <div className="leading-none">
        <div className={`font-display font-semibold tracking-tight text-ink ${compact ? "text-lg" : "text-xl"}`}>Upper Hand</div>
        {!compact && <div className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ink-3">SSAT Upper Level</div>}
      </div>
    </div>
  );
}

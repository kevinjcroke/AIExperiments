export interface FlagIconProps {
  /** ISO 3166-1 alpha-2, lowercase (e.g. "ba"). */
  code: string;
  className?: string;
  /** Accessible label; omit when the flag is decorative next to the country name. */
  title?: string;
}

/** DOM flag via flag-icons CSS classes (4x3). Never use flag emoji. */
export function FlagIcon({ code, className = "", title }: FlagIconProps) {
  return (
    <span
      className={`fi fi-${code} rounded-[2px] shadow-sm ${className}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    />
  );
}

import { flagUrl } from "../utils/flagUrls";

export interface FlagIconProps {
  /** ISO 3166-1 alpha-2, lowercase (e.g. "ba"). */
  code: string;
  className?: string;
  /** Accessible label; omit when the flag is decorative next to the country name. */
  title?: string;
}

/**
 * DOM flag using flag-icons' `fi fi-xx` classes. The base `.fi` rules live in index.css and the
 * SVG comes from the shared URL map, so we don't ship flag-icons' stylesheet for all 270 flags.
 * Never use flag emoji.
 */
export function FlagIcon({ code, className = "", title }: FlagIconProps) {
  const url = flagUrl(code);
  return (
    <span
      className={`fi fi-${code} rounded-[2px] shadow-sm ${className}`}
      style={url ? { backgroundImage: `url("${url}")` } : undefined}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    />
  );
}

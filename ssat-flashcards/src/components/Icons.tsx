import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...rest }: P) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...rest,
  };
}

export const Check = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 12.5l4.2 4.2L19 7" />
  </svg>
);
export const Cross = (p: P) => (
  <svg {...base(p)}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </svg>
);
export const ArrowRight = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const ArrowLeft = (p: P) => (
  <svg {...base(p)}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);
export const Flame = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21c3.9 0 6.5-2.6 6.5-6.2 0-3.2-2-5.6-3.6-7.3-.3 1.9-1.2 3.1-2.4 3.7.3-3.3-1.2-6.2-3.8-8.2.2 3-1.3 5-2.9 6.9C4.6 11.3 5.5 13 5.5 15c0 3.5 2.6 6 6.5 6z" />
  </svg>
);
export const Book = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5c-.8 0-1.5.7-1.5 1.5V5.5zM20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5.7 1.5 1.5V5.5z" />
  </svg>
);
export const Sigma = (p: P) => (
  <svg {...base(p)}>
    <path d="M17 5H7l6 7-6 7h10" />
  </svg>
);
export const Shuffle = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h3.5c2 0 3.1 1 4.2 2.6l1.6 2.4c1.1 1.7 2.2 2.6 4.2 2.6H20M17 11.5l3 3-3 3M4 17h3.5c1.5 0 2.4-.5 3.2-1.4M13.3 8.4c.8-.9 1.7-1.4 3.2-1.4H20M17 4l3 3-3 3" />
  </svg>
);
export const Clock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);
export const Info = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5M12 7.6v.2" />
  </svg>
);
export const Eye = (p: P) => (
  <svg {...base(p)}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);
export const Rotate = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v3.7h3.7" />
  </svg>
);
export const Star = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.8l2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8z" />
  </svg>
);
export const Keyboard = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="6" width="18" height="12" rx="2.5" />
    <path d="M7 10h.01M10.5 10h.01M14 10h.01M17.5 10h.01M8 14h8" />
  </svg>
);
export const Target = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="0.8" fill="currentColor" />
  </svg>
);

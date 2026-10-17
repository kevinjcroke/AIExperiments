import type { CountryNode } from "../types/wheel";

export interface RestaurantDrawerProps {
  country: CountryNode;
  /** Close the drawer (HudOverlay calls select(null)). */
  onClose: () => void;
  /** Eliminate the country; HudOverlay closes the drawer and shows the Undo toast. */
  onMarkVisited: (countryId: string) => void;
}

/** Drawer *content* (Agent 3). HudOverlay owns the container (sidebar or bottom sheet). */
export function RestaurantDrawer({ country }: RestaurantDrawerProps) {
  return <section className="p-4 text-slate-100">{country.countryName}</section>;
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Narzędzie do łączenia klas CSS, które rozwiązuje konflikty Tailwind CSS.
 * Używane przez komponenty Shadcn/ui.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

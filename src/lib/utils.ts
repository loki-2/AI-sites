import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const BADGE_EMOJIS: Record<string, string> = {
  "Frontend": "🎨",
  "Web UI": "✨",
  "Mobile UI": "📱",
  "Security": "🔒",
  "Backend": "⚙️",
  "Mobile Dev": "📲",
  "Fullstack Dev": "🥞",
};

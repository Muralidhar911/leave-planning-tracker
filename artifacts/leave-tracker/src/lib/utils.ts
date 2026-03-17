import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate consistent colors for users based on their ID
export function getUserColor(userId: string): string {
  const colors = [
    "bg-cyan-500", "bg-purple-500", "bg-pink-500", 
    "bg-emerald-500", "bg-orange-500", "bg-blue-500", 
    "bg-indigo-500", "bg-rose-500", "bg-amber-500"
  ];
  
  // Simple hash of the ID
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

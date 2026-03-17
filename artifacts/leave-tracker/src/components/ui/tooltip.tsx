import * as React from "react";

// Minimal tooltip provider to satisfy the App.tsx import
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// In a real complex app we'd use @radix-ui/react-tooltip here, 
// but for this sleek MVP we use title attributes or custom hover states.

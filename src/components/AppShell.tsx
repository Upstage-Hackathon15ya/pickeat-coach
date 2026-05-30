import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  className?: string;
  withBottomNav?: boolean;
}

export function AppShell({ children, className, withBottomNav }: AppShellProps) {
  return (
    <div id="app-frame">
      <div
        className={cn(
          "flex flex-col min-h-screen",
          withBottomNav && "pb-28",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

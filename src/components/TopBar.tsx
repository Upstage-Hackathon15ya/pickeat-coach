import { useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { ReactNode } from "react";

interface TopBarProps {
  title?: string;
  back?: boolean;
  right?: ReactNode;
  onBack?: () => void;
}

export function TopBar({ title, back = true, right, onBack }: TopBarProps) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 h-14 px-2 flex items-center justify-between bg-background/85 backdrop-blur">
      <div className="w-12 flex items-center">
        {back && (
          <button
            aria-label="뒤로"
            onClick={() => (onBack ? onBack() : router.history.back())}
            className="size-10 grid place-items-center -ml-1 rounded-full active:bg-muted"
          >
            <ChevronLeft className="size-6" />
          </button>
        )}
      </div>
      <h1 className="text-[15px] font-semibold tracking-tight">{title}</h1>
      <div className="w-12 flex items-center justify-end">{right}</div>
    </header>
  );
}


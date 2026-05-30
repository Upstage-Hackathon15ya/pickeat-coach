import { cn } from "@/lib/utils";

export function Logo({ className, showKorean = true }: { className?: string; showKorean?: boolean }) {
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className="text-3xl font-black tracking-tight text-foreground">
        Pick<span style={{ color: "#7CCBB6" }}>Eat</span>
      </span>
      {showKorean && <span className="text-sm font-semibold text-muted-foreground">픽잇</span>}
    </div>
  );
}

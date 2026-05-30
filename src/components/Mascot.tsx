import mascotSrc from "@/assets/mascot.png";
import { cn } from "@/lib/utils";

interface MascotProps {
  size?: number;
  className?: string;
  priority?: boolean;
}

export function Mascot({ size = 64, className, priority = false }: MascotProps) {
  return (
    <img
      src={mascotSrc}
      alt="픽잇 AI 코치"
      width={size}
      height={size}
      loading="eager"
      decoding="sync"
      className={cn("object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}

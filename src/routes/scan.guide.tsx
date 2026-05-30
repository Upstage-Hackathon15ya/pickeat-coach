import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/scan/guide")({
  component: ScanGuide,
});

const tips = [
  "밝은 곳에서 찍어주세요.",
  "글자가 흐리지 않게 가까이서 찍어주세요.",
  "원재료표와 영양성분표가 화면 안에 모두 들어오도록 \n촬영해주세요.",
];

function ScanGuide() {
  return (
    <AppShell>
      <TopBar title="촬영 가이드" />
      <div className="flex-1 px-5 pb-10 space-y-6">
        <h2 className="text-[20px] font-extrabold tracking-tight">
          더 정확한 분석을 위한<br />촬영 팁이에요
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <Example good label="좋은 예시" />
          <Example label="나쁜 예시" />
        </div>

        <ul className="space-y-2.5">
          {tips.map((t, i) => (
            <li key={i} className="flex gap-3 p-4 rounded-2xl bg-surface border border-border">
              <div className="size-6 rounded-full bg-primary text-primary-foreground grid place-items-center text-[11px] font-bold shrink-0 py-0">
                {i + 1}
              </div>
              <p className="text-[13.5px] leading-relaxed">{t}</p>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}

function Example({ good, label }: { good?: boolean; label: string }) {
  return (
    <div className="space-y-2">
      <div className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-zinc-200 to-zinc-300 relative overflow-hidden">
        <div className={`absolute inset-2 ${good ? "" : "blur-[2px] opacity-70"} bg-white/80 rounded-xl p-2`}>
          <div className="space-y-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-1.5 bg-zinc-400/60 rounded" style={{ width: `${40 + ((i * 13) % 50)}%` }} />
            ))}
          </div>
        </div>
        <span className={`absolute top-2 right-2 size-7 grid place-items-center rounded-full ${good ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}`}>
          {good ? <Check className="size-4" /> : <X className="size-4" />}
        </span>
      </div>
      <div className={`text-center text-[12.5px] font-semibold ${good ? "text-success" : "text-destructive"}`}>{label}</div>
    </div>
  );
}

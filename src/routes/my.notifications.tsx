import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/my/notifications")({
  component: Notifs,
});

const opts = [
  { key: "scan", label: "스캔 리마인더", desc: "식사 시간에 스캔을 안내해 드려요" },
  { key: "daily", label: "오늘의 요약", desc: "저녁 9시에 하루 영양 요약을 보내요" },
  { key: "tips", label: "AI 코치 팁", desc: "맞춤 영양 팁을 받아보세요" },
];

function Notifs() {
  const [on, setOn] = useState<Record<string, boolean>>({ scan: true, daily: true, tips: false });

  return (
    <AppShell>
      <TopBar title="알림 설정" />
      <ul className="px-5 mt-2 space-y-2">
        {opts.map((o) => (
          <li key={o.key} className="flex items-center gap-4 p-4 rounded-2xl bg-surface border border-border">
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold">{o.label}</div>
              <div className="text-[11.5px] text-muted-foreground mt-0.5">{o.desc}</div>
            </div>
            <button
              role="switch"
              aria-checked={on[o.key]}
              onClick={() => setOn((p) => ({ ...p, [o.key]: !p[o.key] }))}
              className={cn(
                "w-12 h-7 rounded-full transition-colors relative shrink-0",
                on[o.key] ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-6 rounded-full bg-white shadow transition-all",
                  on[o.key] ? "left-[22px]" : "left-0.5"
                )}
              />
            </button>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}

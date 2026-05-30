import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  component: Notifications,
});

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  defaultRead: boolean;
}

export const NOTIFICATIONS: NotificationItem[] = [
  {
    id: "today-summary",
    title: "오늘의 요약",
    message: "저녁 9시 기준 하루 영양 요약이 도착했어요.",
    time: "오후 9:00",
    defaultRead: false,
  },
  {
    id: "ai-coach-tip",
    title: "AI 코치 팁",
    message: "오늘은 나트륨 섭취량이 높은 편이에요.",
    time: "오후 3:24",
    defaultRead: false,
  },
  {
    id: "scan-reminder",
    title: "스캔 리마인더",
    message: "식사 전 성분표를 스캔해보세요.",
    time: "오전 11:50",
    defaultRead: true,
  },
];

export const STORAGE_KEY = "notifications.read";

function loadRead(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveRead(state: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function Notifications() {
  const navigate = useNavigate();
  const [read, setRead] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const stored = loadRead();
    // Seed defaults for items not yet tracked, then mark all as read on open.
    const next: Record<string, boolean> = {};
    for (const n of NOTIFICATIONS) {
      next[n.id] = true;
    }
    saveRead(next);
    setRead(next);
  }, []);

  const markRead = (id: string) => {
    if (read[id]) return;
    const next = { ...read, [id]: true };
    setRead(next);
    saveRead(next);
  };

  return (
    <AppShell>
      <TopBar title="알림" onBack={() => navigate({ to: "/home" })} />
      <main className="flex-1 px-5 pb-8">
        {NOTIFICATIONS.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center pt-24 text-center">
            <div className="size-16 rounded-full bg-muted grid place-items-center">
              <Bell className="size-7 text-muted-foreground" />
            </div>
            <p className="mt-4 text-[13px] text-muted-foreground">새로운 알림이 없어요</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {NOTIFICATIONS.map((n) => {
              const isRead = !!read[n.id];
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    className={cn(
                      "w-full text-left rounded-2xl p-4 border transition-colors flex gap-3",
                      isRead
                        ? "bg-surface border-border"
                        : "bg-primary-soft border-primary/30"
                    )}
                  >
                    <div
                      className={cn(
                        "size-9 rounded-xl grid place-items-center shrink-0",
                        isRead ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"
                      )}
                    >
                      <Bell className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[14px] truncate", isRead ? "font-semibold" : "font-bold")}>
                          {n.title}
                        </span>
                        {!isRead && (
                          <span className="size-1.5 rounded-full bg-primary shrink-0" aria-label="읽지 않음" />
                        )}
                        <span className="ml-auto text-[11px] text-muted-foreground shrink-0">{n.time}</span>
                      </div>
                      <p className={cn("mt-1 text-[12.5px] leading-relaxed", isRead ? "text-muted-foreground" : "text-foreground/85")}>
                        {n.message}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </AppShell>
  );
}

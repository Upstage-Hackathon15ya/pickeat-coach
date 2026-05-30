import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";
import { inquireHistory } from "@/lib/n8n";

export const Route = createFileRoute("/history/")({
  component: History,
});

const tabs = ["오늘", "전체"] as const;
type Tab = (typeof tabs)[number];


// Anchor dates relative to "today" so the demo data stays meaningful.
const NOW = new Date();
const today = (h: number, m: number) => {
  const d = new Date(NOW);
  d.setHours(h, m, 0, 0);
  return d;
};
const daysAgo = (n: number, h: number, m: number) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  d.setHours(h, m, 0, 0);
  return d;
};

type Item = {
  id: string;
  name: string;
  foodType: string;
  status: "ok" | "warn" | "bad";
  date: Date;
};

const data: Item[] = ([
  { id: "1", name: "제로콜라 500ml", foodType: "탄산음료", status: "warn", date: today(13, 20) },
  { id: "2", name: "닭가슴살 샐러드", foodType: "즉석조리식품", status: "ok", date: today(12, 30) },
  { id: "3", name: "초코칩 쿠키", foodType: "과자", status: "bad", date: today(10, 15) },
  { id: "4", name: "단백질 쉐이크", foodType: "단백질 가공식품", status: "ok", date: daysAgo(1, 19, 40) },
  { id: "5", name: "신라면", foodType: "유탕면", status: "bad", date: daysAgo(1, 21, 10) },
  { id: "6", name: "그릭요거트", foodType: "발효유", status: "ok", date: daysAgo(3, 9, 0) },
  { id: "7", name: "아메리카노", foodType: "커피", status: "warn", date: daysAgo(10, 8, 30) },
  { id: "8", name: "삼각김밥 참치마요", foodType: "즉석섭취식품", status: "warn", date: daysAgo(25, 12, 0) },
  { id: "9", name: "초콜릿바", foodType: "초콜릿류", status: "bad", date: daysAgo(40, 15, 45) },
] as Item[]).sort((a, b) => b.date.getTime() - a.date.getTime());

const badge: Record<string, { l: string; c: string }> = {
  ok: { l: "안전", c: "bg-success/15 text-success" },
  warn: { l: "주의", c: "bg-warning/15 text-warning-foreground" },
  bad: { l: "위험", c: "bg-destructive/15 text-destructive" },
};

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function timeLabel(d: Date) {
  const now = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  if (isSameDay(d, now)) return `오늘 ${hh}:${mm}`;
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  if (isSameDay(d, y)) return `어제 ${hh}:${mm}`;
  return `${d.getMonth() + 1}.${d.getDate()} ${hh}:${mm}`;
}

function History() {
  const [tab, setTab] = useState<Tab>("오늘");
  const [showRange, setShowRange] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [remote, setRemote] = useState<Item[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await inquireHistory<unknown>({});
        const arr = Array.isArray(res)
          ? res
          : Array.isArray((res as { items?: unknown })?.items)
            ? ((res as { items: unknown[] }).items)
            : [];
        const items: Item[] = arr
          .map((r, i) => {
            const o = (r ?? {}) as Record<string, unknown>;
            const rawDate = o.date ?? o.createdAt ?? o.timestamp;
            const d = rawDate ? new Date(rawDate as string) : new Date();
            if (isNaN(d.getTime())) return null;
            const status = (o.status as Item["status"]) ?? "ok";
            return {
              id: String(o.id ?? `r-${i}`),
              name: String(o.name ?? "기록"),
              foodType: String(o.foodType ?? o.food_type ?? o.brand ?? ""),
              status,
              date: d,
            } satisfies Item;
          })
          .filter((x): x is Item => x !== null);
        if (!cancelled) setRemote(items);
      } catch {
        // ignore network errors, keep demo data
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    let list = [...data, ...remote].sort((a, b) => b.date.getTime() - a.date.getTime());

    if (tab === "오늘") {
      list = list.filter((d) => isSameDay(d.date, now));
    }

    if (showRange) {
      if (from) {
        const f = new Date(from);
        f.setHours(0, 0, 0, 0);
        list = list.filter((d) => d.date >= f);
      }
      if (to) {
        const t = new Date(to);
        t.setHours(23, 59, 59, 999);
        list = list.filter((d) => d.date <= t);
      }
    }

    return list;
  }, [tab, showRange, from, to, remote]);

  return (
    <AppShell withBottomNav>
      <header className="px-5 pt-5">
        <h1 className="text-[22px] font-extrabold tracking-tight">기록</h1>
        <p className="text-[13px] text-muted-foreground mt-1">스캔한 음식과 분석을 한눈에 봐요</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="inline-flex p-1 bg-muted rounded-full">
            {tabs.map((x) => (
              <button
                key={x}
                onClick={() => setTab(x)}
                className={cn(
                  "px-4 h-9 rounded-full text-[13px] font-medium transition-all",
                  tab === x ? "bg-surface text-foreground shadow-[var(--shadow-soft)]" : "text-muted-foreground"
                )}
              >
                {x}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowRange((v) => !v)}
            className={cn(
              "px-3 h-9 rounded-full text-[12px] font-medium border transition-all",
              showRange
                ? "bg-primary/10 text-primary border-primary"
                : "bg-surface text-muted-foreground border-border"
            )}
          >
            기간 지정
          </button>
        </div>

        {showRange && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-9 px-2 rounded-xl border border-border bg-surface text-[12px]"
            />
            <span className="text-[12px] text-muted-foreground">~</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-9 px-2 rounded-xl border border-border bg-surface text-[12px]"
            />
          </div>
        )}
      </header>

      <ul className="px-5 mt-4 space-y-2 pb-6">
        {filtered.map((d) => (
          <Row key={d.id} d={d} />
        ))}
        {filtered.length === 0 && <EmptyState />}
      </ul>
      <BottomNav />
    </AppShell>
  );
}

function Row({ d }: { d: Item }) {
  const b = badge[d.status];
  const isProteinShake = d.id === "4";
  const linkProps = isProteinShake
    ? ({ to: "/history/protein-shake" } as const)
    : ({ to: "/history/$id", params: { id: d.id } } as const);
  return (
    <li>
      <Link
        {...linkProps}
        onClick={() => {
          try {
            sessionStorage.setItem(
              "history.selected",
              JSON.stringify({ name: d.name, foodType: d.foodType, status: d.status }),
            );
          } catch {
            // ignore
          }
        }}
        className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface border border-border active:bg-muted/40"
      >
        <div className="flex-1 min-w-0">
          <div className="text-[14.5px] font-semibold truncate">{d.name}</div>
          <div className="text-[12px] text-muted-foreground mt-0.5">{d.foodType} · {timeLabel(d.date)}</div>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${b.c}`}>{b.l}</span>
      </Link>

    </li>
  );
}

function EmptyState() {
  return (
    <li className="text-center text-[13px] text-muted-foreground py-10 list-none">
      해당 기간의 기록이 없어요
    </li>
  );
}

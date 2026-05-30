import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BottomNav } from "@/components/BottomNav";
import { Mascot } from "@/components/Mascot";
import { Bell, ChevronRight, Sparkles } from "lucide-react";
import { NOTIFICATIONS, STORAGE_KEY } from "./notifications";

export const Route = createFileRoute("/home")({
  component: Home,
});

type NumericFocus = { kind: "numeric"; label: string; value: number; max: number; unit: string };
type DetectFocus = { kind: "detect"; label: string; detected: boolean };
type FocusItem = NumericFocus | DetectFocus;

const NUMERIC_DEFAULTS: Record<string, { max: number; unit: string; current: number }> = {
  당류: { max: 70, unit: "g", current: 28 },
  나트륨: { max: 1500, unit: "mg", current: 1200 },
  포화지방: { max: 10, unit: "g", current: 8 },
  탄수화물: { max: 300, unit: "g", current: 120 },
  단백질: { max: 70, unit: "g", current: 45 },
};

const DETECT_KEYS = new Set(["대체당", "첨가물"]);

const DEFAULT_FOCUS: FocusItem[] = [
  { kind: "numeric", label: "당류", value: 28, max: 70, unit: "g" },
  { kind: "numeric", label: "나트륨", value: 1200, max: 1500, unit: "mg" },
  { kind: "numeric", label: "포화지방", value: 8, max: 10, unit: "g" },
];


const eaten = [
  { name: "제로콜라 500ml", foodType: "탄산음료", status: "ok", time: "13:20" },
  { name: "닭가슴살 샐러드", foodType: "즉석조리식품", status: "ok", time: "12:30" },
  { name: "초코칩 쿠키", foodType: "과자", status: "warn", time: "10:15" },
];

const badge: Record<string, { label: string; cls: string }> = {
  ok: { label: "안전", cls: "bg-success/15 text-success" },
  warn: { label: "주의", cls: "bg-warning/15 text-warning-foreground" },
  bad: { label: "위험", cls: "bg-destructive/15 text-destructive" },
};

function Home() {
  const [focus, setFocus] = useState<FocusItem[]>(DEFAULT_FOCUS);
  const [chips, setChips] = useState<string[]>([]);
  const [userName, setUserName] = useState<string>("다임");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("eatfit.user");
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.name) setUserName(String(u.name));
      }
    } catch {}
  }, []);

  useEffect(() => {
    const computeUnread = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const read = raw ? JSON.parse(raw) : {};
        let count = 0;
        for (const n of NOTIFICATIONS) {
          if (read[n.id] !== true) count++;
        }
        setUnreadCount(count);
      } catch {
        setUnreadCount(0);
      }
    };
    computeUnread();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) computeUnread();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", computeUnread);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", computeUnread);
    };
  }, []);
  

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem("onboarding.focus");
        if (!raw) {
          setChips([]);
          setFocus(DEFAULT_FOCUS);
          return;
        }
        const saved = JSON.parse(raw);
        const sel: string[] = Array.isArray(saved.sel) ? saved.sel : [];
        const targets: Record<string, number> = saved.targets ?? {};
        setChips(sel);
        const numeric = sel
          .filter((label) => !DETECT_KEYS.has(label) && NUMERIC_DEFAULTS[label]);
        const next: FocusItem[] = sel.map((label) => {
          if (DETECT_KEYS.has(label)) {
            return { kind: "detect", label, detected: true };
          }
          const def = NUMERIC_DEFAULTS[label];
          if (!def) return { kind: "detect", label, detected: false };
          const max = typeof targets[label] === "number" ? targets[label] : def.max;
          return { kind: "numeric", label, value: def.current, max, unit: def.unit };
        });
        setFocus(numeric.length > 0 ? next : next);
      } catch {}
    };
    load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "onboarding.focus") load();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", load);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", load);
    };
  }, []);

  return (
    <AppShell withBottomNav>
      <header className="px-5 pt-4 pb-2 flex items-center justify-between">
        <div>
          <div className="text-[13px] text-muted-foreground">안녕하세요</div>
          <h1 className="text-[20px] font-extrabold tracking-tight mt-0.5">{userName}님 👋</h1>
        </div>
        <Link to="/notifications" className="relative size-10 rounded-full bg-surface border border-border grid place-items-center" aria-label="알림">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500" aria-hidden="true" />
          )}
        </Link>
      </header>

      <main className="px-5 pt-4 space-y-4">
        {/* Today nutrition status */}
        <section className="rounded-3xl p-5 bg-surface border border-border shadow-[var(--shadow-soft)]">
          {(() => {
            const numericItems = focus.filter((f) => f.kind === "numeric") as NumericFocus[];
            const detectItems = focus.filter((f) => f.kind === "detect") as DetectFocus[];
            const detectedCount = detectItems.filter((d) => d.detected).length;
            const hasNumeric = numericItems.length > 0;
            const hasDetect = detectItems.length > 0;

            let numericStatus: "safe" | "warning" | "danger" = "safe";
            for (const n of numericItems) {
              const remainRatio = Math.max(0, Math.min(1, 1 - n.value / n.max));
              if (n.value > n.max) { numericStatus = "danger"; break; }
              if (remainRatio <= 0.3) numericStatus = "warning";
            }

            let title = "오늘의 영양 상태";
            let message = "잘 지키고 있어요";
            if (!hasNumeric && hasDetect) {
              title = "오늘의 감지 결과";
              message = "확인이 필요해요";
            } else if (hasNumeric && hasDetect && detectedCount > 0) {
              message = "조금 확인이 필요해요";
            } else if (hasNumeric) {
              message = numericStatus === "danger"
                ? "오늘은 주의가 필요해요"
                : numericStatus === "warning"
                ? "조금 주의가 필요해요"
                : "잘 지키고 있어요";
            }

            return (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[12px] text-muted-foreground">{title}</div>
                  <div className="mt-1 text-[18px] font-extrabold">{message}</div>
                </div>
                {!hasNumeric && hasDetect && (
                  <div className="text-right">
                    <div className="text-[11px] text-muted-foreground">주의 성분</div>
                    <div className="text-[14px] font-extrabold text-warning-foreground mt-0.5">
                      {detectedCount}개 감지
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {focus.some((f) => f.kind === "numeric") && (
            <div className="mt-4">
              <div className="text-[12px] font-semibold text-muted-foreground mb-2">영양성분 기준</div>
              <div className="flex flex-nowrap justify-center items-start gap-3">
                {focus.filter((f) => f.kind === "numeric").slice(0, 3).map((f) => {
                  const n = f as NumericFocus;
                  const rawValue = Number(n.value);
                  const rawMax = Number(n.max);
                  const validValue = Number.isFinite(rawValue) ? rawValue : NaN;
                  const validMax = Number.isFinite(rawMax) && rawMax > 0 ? rawMax : NaN;
                  const isValid = Number.isFinite(validValue) && Number.isFinite(validMax);
                  const remaining = isValid ? validMax - validValue : 0;
                  const exceeded = isValid && remaining < 0;
                  const consumedRatio = isValid ? validValue / validMax : 0;
                  const fillPct = isValid ? Math.min(100, Math.max(0, Math.round(consumedRatio * 100))) : 0;
                  const color = !isValid
                    ? "#9CA3AF"
                    : consumedRatio > 1
                    ? "#FF6B6B"
                    : consumedRatio >= 0.7
                    ? "#FFB84D"
                    : "#39D3B4";
                  const textColor = !isValid
                    ? "text-muted-foreground"
                    : consumedRatio > 1
                    ? "text-destructive"
                    : consumedRatio >= 0.7
                    ? "text-warning-foreground"
                    : "text-success";
                  const R = 42;
                  const C = 2 * Math.PI * R;
                  const dash = isValid ? (fillPct / 100) * C : C;
                  return (
                    <div key={n.label} className="flex flex-col items-center">
                      <div className="relative w-[96px] h-[96px]">
                        <svg viewBox="0 0 100 100" className="w-[96px] h-[96px] -rotate-90 overflow-visible">
                          <circle cx="50" cy="50" r={R} fill="none" stroke="#E5E7EB" strokeWidth="8" />
                          <circle
                            cx="50" cy="50" r={R}
                            fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
                            strokeDasharray={`${dash} ${C}`}
                          />
                        </svg>
                        <div className="absolute inset-0 grid place-items-center text-center pointer-events-none">
                          <div>
                            <div className="text-[10px] text-muted-foreground leading-none">
                              {exceeded ? "초과" : "잔여량"}
                            </div>
                            <div className={`text-[13px] font-extrabold leading-tight mt-1 ${textColor}`}>
                              {isValid ? (exceeded ? `+${Math.abs(remaining)}${n.unit}` : `${remaining}${n.unit}`) : "-"}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-1.5 text-[11px] font-semibold leading-tight text-center">{n.label}</div>
                      <div className="text-[10px] text-muted-foreground leading-tight text-center">
                        {n.value} / {n.max}{n.unit}
                      </div>
                    </div>
                  );
                })}

              </div>

            </div>
          )}

          {focus.some((f) => f.kind === "detect") && (
            <div className="mt-4">
              <div className="text-[12px] font-semibold text-muted-foreground mb-2">원재료 기준</div>
              <div className="flex flex-wrap justify-center gap-2">
                {focus.filter((f) => f.kind === "detect").map((f) => {
                  const d = f as DetectFocus;
                  return (
                    <span
                      key={d.label}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                        d.detected ? "bg-warning/15 text-warning-foreground" : "bg-success/15 text-success"
                      }`}
                    >
                      {d.label} {d.detected ? "감지됨" : "없음"}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

        </section>


        {/* Focus chips */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-[14px] font-bold">집중 관리 성분</h2>
            <Link to="/my/focus" className="text-[12px] text-muted-foreground flex items-center">
              편집 <ChevronRight className="size-3.5" />
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
            {chips.map((t) => (
              <span key={t} className="shrink-0 h-9 px-4 rounded-full bg-surface border border-border text-[13px] font-medium grid place-items-center">
                {t}
              </span>
            ))}
          </div>
        </section>

        {/* AI coach card */}
        <section className="rounded-3xl p-5 bg-surface border border-border flex gap-4">
          <Mascot size={48} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-primary">
              <Sparkles className="size-3" /> AI 코치 한마디
            </div>
            <p className="mt-1 text-[14px] leading-relaxed text-foreground">
              오늘 나트륨이 평소보다 낮아요. 저녁엔 단백질을 챙겨보면 좋아요!
            </p>
          </div>
        </section>

        {/* Today eaten */}
        <section className="pb-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-[14px] font-bold">오늘 먹은 음식</h2>
          </div>
          <ul className="space-y-2">
            {eaten.map((e) => {
              const b = badge[e.status];
              const isZeroCola = e.name === "제로콜라 500ml";
              return (
                <li key={e.name}>
                  <Link
                    to={isZeroCola ? "/analyze/result" : "/history/$id"}
                    params={isZeroCola ? undefined : { id: "1" }}
                    search={isZeroCola ? { from: "home" } : undefined}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface border border-border active:bg-muted/40"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold truncate">{e.name}</div>
                      <div className="text-[11.5px] text-muted-foreground mt-0.5">{e.foodType} · {e.time}</div>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${b.cls}`}>{b.label}</span>
                  </Link>

                </li>
              );
            })}
          </ul>
        </section>
      </main>

      <BottomNav />
    </AppShell>
  );
}

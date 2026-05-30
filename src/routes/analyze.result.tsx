import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { Mascot } from "@/components/Mascot";
import { AlertTriangle, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analyze/result")({
  validateSearch: (search: Record<string, unknown>) => ({
    from: typeof search.from === "string" ? search.from : undefined,
  }),
  component: Result,
});

type Tone = "ok" | "warn" | "bad" | "check";
type VerdictStatus = "ok" | "warn" | "bad";

const verdictDisplay: Record<VerdictStatus, { title: string; bg: string; text: string }> = {
  ok: { title: "괜찮아요", bg: "from-success to-success/70", text: "text-white" },
  warn: { title: "조금만 드세요", bg: "from-warning to-warning/80", text: "text-warning-foreground" },
  bad: { title: "오늘은 패스", bg: "from-destructive to-destructive/70", text: "text-white" },
};

const MOCK = {
  product: {
    foodType: "코카콜라",
    name: "제로 콜라 500ml",
    tags: ["음료", "제로슈가"],
  },
  verdict: {
    status: "warn" as VerdictStatus,
    title: "조금만 드세요",
    sub: "당류는 낮지만, 카페인과 대체당이 포함되어 있어요.",
  },
  coach:
    "다임님의 혈당 관리 목표엔 큰 무리 없어요. 다만 카페인에 민감하면 오후엔 피해주세요.",
  nutrition: [
    { name: "당류", value: "0g", status: "낮음", tone: "ok" as Tone },
    { name: "나트륨", value: "45mg", status: "낮음", tone: "ok" as Tone },
    { name: "카페인", value: "34mg", status: "주의", tone: "warn" as Tone },
    { name: "대체당", value: "포함", status: "확인 필요", tone: "check" as Tone },
  ],
  risk: { ok: 2, warn: 3, bad: 0 },
  ingredientsText:
    "정제수, 이산화탄소, 카라멜색소, 인산, 카페인, 아세설팜칼륨, 수크랄로스",
  warningIngredients: [
    { name: "아세설팜칼륨", category: "대체당", info: "단맛을 내는 감미료예요" },
    { name: "수크랄로스", category: "대체당", info: "과다 섭취 시 장이 예민할 수 있어요" },
    { name: "카페인", category: "각성 성분", info: "민감하면 오후 섭취를 줄여요" },
    { name: "인산", category: "첨가물", info: "과다 섭취는 주의가 필요해요" },
  ],
  alternatives: [
    { name: "무가당 탄산수", tag: "당 0g · 카페인 0mg" },
    { name: "카페인 없는 보리차", tag: "디카페인 · 부드러운 곡물차" },
  ],
};

function Result() {
  const navigate = useNavigate();
  const { from } = Route.useSearch();
  const isFromHome = from === "home";
  const d = MOCK;
  const v = verdictDisplay[d.verdict.status];

  return (
    <AppShell>
      <TopBar title="분석 결과" onBack={() => navigate({ to: "/home" })} />

      <main className="px-5 pt-2 pb-6 space-y-3.5">
        {/* 1. Product summary */}
        <section className="rounded-3xl p-4 bg-surface border border-border flex gap-3 shadow-soft">
          <div className="size-14 rounded-2xl bg-gradient-to-br from-zinc-200 to-zinc-300 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[11.5px] text-muted-foreground">{d.product.foodType}</div>
            <div className="text-[15.5px] font-bold mt-0.5 truncate">{d.product.name}</div>
            <div className="mt-1.5 flex gap-1.5 flex-wrap">
              {d.product.tags.map((t) => (
                <span key={t} className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* 2. Main judgment */}
        <section className={cn("rounded-3xl p-5 bg-gradient-to-br relative overflow-hidden shadow-soft", v.bg, v.text)}>
          <AlertTriangle className="absolute right-4 top-4 size-10 opacity-70" strokeWidth={2.2} />
          <div className="text-[12px] font-medium opacity-80">픽잇의 판단</div>
          <h2 className="mt-0.5 text-[28px] font-black tracking-tight leading-tight">
            {v.title}
          </h2>
          <p className="mt-1.5 text-[13px] opacity-90 leading-relaxed pr-12">
            {d.verdict.sub}
          </p>
        </section>

        {/* 3. AI coach */}
        <section className="rounded-3xl p-4 bg-primary-soft border border-primary/30 flex gap-3 shadow-soft">
          <Mascot size={40} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-primary-foreground/80">
              <Sparkles className="size-3" /> AI 코치 한마디
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-foreground">{d.coach}</p>
          </div>
        </section>

        {/* 4. Scanned nutrition */}
        <section className="rounded-3xl p-5 bg-surface border border-border shadow-soft">
          <h3 className="text-[14px] font-bold">스캔한 영양성분표</h3>
          <p className="mt-1 text-[12px] text-muted-foreground">픽잇이 성분표를 이렇게 읽었어요</p>
          <div className="mt-3 rounded-2xl border border-border/70 overflow-hidden">
            <div className="grid grid-cols-[1.2fr_1fr_0.9fr] px-3.5 py-2 bg-muted/50 text-[11px] font-semibold text-muted-foreground">
              <span>성분</span>
              <span>함량</span>
              <span className="text-right">판정</span>
            </div>
            <ul className="divide-y divide-border/60">
              {d.nutrition.map((r) => (
                <li key={r.name} className="grid grid-cols-[1.2fr_1fr_0.9fr] items-center px-3.5 py-2.5">
                  <span className="text-[13px] font-semibold">{r.name}</span>
                  <span className="text-[13px] text-muted-foreground">{r.value}</span>
                  <span className="justify-self-end">
                    <StatusBadge tone={r.tone}>{r.status}</StatusBadge>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 5. Ingredient analysis */}
        <section className="rounded-3xl p-5 bg-surface border border-border shadow-soft">
          <h3 className="text-[14px] font-bold">원재료명 분석</h3>
          <p className="mt-1 text-[12px] text-muted-foreground">
            원재료명에서 주의할 성분만 골라 정리했어요.
          </p>

          <div className="mt-4">
            <div className="text-[11.5px] font-semibold text-foreground/80">성분 위험도</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <RiskChip tone="ok">안전 {d.risk.ok}개</RiskChip>
              <RiskChip tone="warn">주의 {d.risk.warn}개</RiskChip>
              <RiskChip tone="bad">위험 {d.risk.bad}개</RiskChip>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-[11.5px] font-semibold text-foreground/80">원재료명 원문</div>
            <div className="mt-2 rounded-2xl bg-muted/40 px-3.5 py-3">
              <div className="text-[10.5px] text-muted-foreground mb-1">원재료명</div>
              <p className="text-[12.5px] leading-relaxed text-foreground/80">{d.ingredientsText}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-border/70 overflow-hidden">
            <div className="grid grid-cols-[1.1fr_0.8fr_1.4fr] px-3.5 py-2 bg-muted/50 text-[11px] font-semibold text-muted-foreground">
              <span>성분</span>
              <span>분류</span>
              <span>픽잇 한마디</span>
            </div>
            <ul className="divide-y divide-border/60">
              {d.warningIngredients.map((r) => (
                <li key={r.name} className="grid grid-cols-[1.1fr_0.8fr_1.4fr] items-start gap-2 px-3.5 py-2.5">
                  <span className="text-[13px] font-semibold">{r.name}</span>
                  <span className="text-[12px] text-muted-foreground">{r.category}</span>
                  <span className="text-[12px] text-foreground/75 leading-snug">{r.info}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 6. Alternatives */}
        <section className="rounded-3xl p-5 bg-primary-soft border border-primary/20 shadow-soft">
          <h3 className="text-[14px] font-bold">대체 상품 추천</h3>
          <p className="mt-1 text-[12px] text-muted-foreground">
            카페인과 대체당 부담을 줄일 수 있어요.
          </p>
          <ul className="mt-3 space-y-2">
            {d.alternatives.map((p) => (
              <li key={p.name} className="flex items-center gap-3 p-3 rounded-2xl bg-surface">
                <div className="size-10 rounded-full bg-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold truncate">{p.name}</div>
                  <div className="text-[11.5px] text-muted-foreground">{p.tag}</div>
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </li>
            ))}
          </ul>
        </section>
      </main>

      <div className="sticky bottom-0 bg-background/95 backdrop-blur px-5 pt-3 pb-6 border-t border-border">
        {isFromHome ? (
          <button
            onClick={() => navigate({ to: "/home" })}
            className="h-14 w-full rounded-2xl bg-surface border border-border text-[14px] font-medium grid place-items-center"
          >
            이전으로
          </button>
        ) : (
          <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate({ to: "/analyze/saved" })}
            className="h-14 rounded-2xl bg-primary text-primary-foreground text-[15px] font-semibold grid place-items-center"
          >
            먹었어요
          </button>
          <button
            onClick={() => navigate({ to: "/home" })}
            className="h-14 rounded-2xl bg-surface border border-border text-[14px] font-medium grid place-items-center"
          >
            홈으로 가기
          </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function RiskChip({ children, tone }: { children: React.ReactNode; tone: "ok" | "warn" | "bad" }) {
  const styles =
    tone === "ok"
      ? "bg-success/15 text-success"
      : tone === "warn"
        ? "bg-warning/25 text-warning-foreground"
        : "bg-destructive/15 text-destructive";
  return (
    <span className={cn("text-[11.5px] font-semibold px-2.5 py-1 rounded-full", styles)}>
      {children}
    </span>
  );
}

function StatusBadge({ tone }: { children?: React.ReactNode; tone: Tone }) {
  const styles =
    tone === "ok"
      ? "bg-success/15 text-success"
      : tone === "bad"
        ? "bg-destructive/15 text-destructive"
        : "bg-warning/25 text-warning-foreground";
  const label = tone === "ok" ? "안전" : tone === "bad" ? "위험" : "주의";
  return (
    <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap", styles)}>
      {label}
    </span>
  );
}

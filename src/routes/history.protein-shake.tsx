import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { Mascot } from "@/components/Mascot";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history/protein-shake")({
  component: ProteinShakeDetail,
});

function ProteinShakeDetail() {
  const navigate = useNavigate();
  const goBack = () => navigate({ to: "/history" });

  return (
    <AppShell>
      <TopBar title="기록 상세" onBack={goBack} />

      <main className="px-5 pt-2 pb-6 space-y-3.5">
        {/* Product summary */}
        <section className="rounded-3xl p-4 bg-surface border border-border flex gap-3">
          <div className="size-14 rounded-2xl bg-gradient-to-br from-zinc-200 to-zinc-300 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[11.5px] text-muted-foreground">단백질 가공식품 · 어제 19:40</div>
            <div className="text-[15.5px] font-bold mt-0.5 truncate">단백질 쉐이크</div>
            <div className="mt-1.5 flex gap-1.5 items-center">
              <Tag>단백질</Tag>
              <Tag>쉐이크</Tag>
              <span className="text-[11px] text-muted-foreground ml-auto">어제 19:40</span>
            </div>
          </div>
        </section>

        {/* Main verdict */}
        <section className="rounded-3xl p-5 bg-gradient-to-br from-success to-success/70 text-white relative overflow-hidden">
          <div className="absolute -right-5 -top-5 text-[96px] opacity-20 leading-none select-none">🌿</div>
          <div className="text-[12px] font-medium opacity-90">픽잇의 판단</div>
          <h2 className="mt-0.5 text-[28px] font-black tracking-tight leading-tight">안전</h2>
          <p className="mt-1.5 text-[13.5px] opacity-95 leading-relaxed pr-10">
            단백질 보충에는 도움이 되지만, 당류와 대체당은 함께 확인해보세요.
          </p>
        </section>

        {/* AI coach */}
        <section className="rounded-3xl p-4 bg-primary-soft border border-primary/30 flex gap-3">
          <Mascot size={40} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-primary">
              <Sparkles className="size-3" /> AI 코치 한마디
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-foreground">
              단백질 섭취 목표에는 잘 맞아요. 다만 운동 후가 아니라면 1회 섭취량을 조절해보세요.
            </p>
          </div>
        </section>

        {/* Nutrition facts table */}
        <section className="rounded-3xl p-5 bg-surface border border-border">
          <h3 className="text-[14px] font-bold">스캔한 영양성분표</h3>
          <p className="mt-1 text-[12px] text-muted-foreground">픽잇이 성분표를 이렇게 읽었어요</p>

          <div className="mt-3 rounded-2xl border border-border/70 overflow-hidden">
            <div className="grid grid-cols-[1.2fr_1fr_0.9fr] px-3.5 py-2 bg-muted/50 text-[11px] font-semibold text-muted-foreground">
              <span>성분</span>
              <span>함량</span>
              <span className="text-right">판정</span>
            </div>
            <ul className="divide-y divide-border/60">
              {[
                { n: "단백질", v: "25g", s: "높음", t: "ok" as const },
                { n: "당류", v: "3g", s: "낮음", t: "ok" as const },
                { n: "나트륨", v: "180mg", s: "보통", t: "warn" as const },
                { n: "대체당", v: "포함", s: "확인 필요", t: "warn" as const },
              ].map((r) => (
                <li key={r.n} className="grid grid-cols-[1.2fr_1fr_0.9fr] items-center px-3.5 py-2.5">
                  <span className="text-[13px] font-semibold">{r.n}</span>
                  <span className="text-[13px] text-muted-foreground">{r.v}</span>
                  <span className="justify-self-end">
                    <StatusBadge tone={r.t}>{r.s}</StatusBadge>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Ingredient analysis */}
        <section className="rounded-3xl p-5 bg-surface border border-border">
          <h3 className="text-[14px] font-bold">원재료명 분석</h3>
          <p className="mt-1 text-[12px] text-muted-foreground">원재료명에서 주의할 성분만 골라 정리했어요</p>

          <div className="mt-4">
            <div className="text-[11.5px] font-semibold text-foreground/80">성분 위험도</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <RiskChip tone="ok">안전 3개</RiskChip>
              <RiskChip tone="warn">주의 2개</RiskChip>
              <RiskChip tone="bad">위험 0개</RiskChip>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-[11.5px] font-semibold text-foreground/80">원재료명 원문</div>
            <div className="mt-2 rounded-2xl bg-muted/40 px-3.5 py-3">
              <p className="text-[12.5px] leading-relaxed text-foreground/75">
                분리유청단백, 코코아분말, 수크랄로스, 레시틴, 향료
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-[11.5px] font-semibold text-foreground/80">주의 성분</div>
            <ul className="mt-2 rounded-2xl border border-border/70 bg-background divide-y divide-border/60 overflow-hidden">
              {[
                { n: "수크랄로스", c: "대체당", i: "단맛을 내는 감미료예요.", b: "주의", tone: "warn" as const },
                { n: "향료", c: "첨가물", i: "제품 맛을 내기 위해 사용돼요.", b: "확인 필요", tone: "warn" as const },
              ].map((r) => (
                <li key={r.n} className="px-3.5 py-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge tone={r.tone}>{r.b}</StatusBadge>
                    <span className="text-[13.5px] font-semibold">{r.n}</span>
                    <span className="text-[11px] text-muted-foreground ml-auto">{r.c}</span>
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-snug text-foreground/75">{r.i}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <div className="sticky bottom-0 bg-background/95 backdrop-blur px-5 pt-3 pb-6 border-t border-border">
        <button
          onClick={goBack}
          className="w-full h-14 rounded-2xl bg-surface border border-border text-[15px] font-medium"
        >
          이전으로
        </button>
      </div>
    </AppShell>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
      {children}
    </span>
  );
}

function RiskChip({ children, tone }: { children: React.ReactNode; tone: "ok" | "warn" | "bad" }) {
  const styles =
    tone === "ok"
      ? "bg-success/15 text-success"
      : tone === "warn"
        ? "bg-warning/20 text-warning-foreground"
        : "bg-destructive/15 text-destructive";
  return (
    <span className={cn("text-[11.5px] font-semibold px-2.5 py-1 rounded-full", styles)}>
      {children}
    </span>
  );
}

function StatusBadge({ tone }: { children?: React.ReactNode; tone: "ok" | "warn" | "bad" }) {
  return (
    <span
      className={cn(
        "text-[11px] font-semibold px-2 py-0.5 rounded-full",
        tone === "ok"
          ? "bg-success/15 text-success"
          : tone === "bad"
            ? "bg-destructive/15 text-destructive"
            : "bg-warning/20 text-warning-foreground"
      )}
    >
      {tone === "ok" ? "안전" : tone === "bad" ? "위험" : "주의"}
    </span>
  );
}

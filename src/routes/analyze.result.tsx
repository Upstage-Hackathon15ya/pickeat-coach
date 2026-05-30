import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { Mascot } from "@/components/Mascot";
import { AlertTriangle, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export const Route = createFileRoute("/analyze/result")({
  validateSearch: (search: Record<string, unknown>) => ({
    from: typeof search.from === "string" ? search.from : undefined,
  }),
  component: Result,
});

type Tone = "ok" | "warn" | "bad" | "check";

type MockResult = {
  product: { foodType: string; name: string; tags: string[] };
  verdict: { title: string; sub: string };
  coach: string;
  nutrition: { name: string; value: string; status: string; tone: Tone }[];
  risk: { ok: number; warn: number; bad: number };
  ingredientsText: string;
  warningIngredients: { name: string; category: string; info: string }[];
  alternatives: { name: string; tag: string }[];
};

const MOCK_LIST: MockResult[] = [
  {
    product: { foodType: "간편식", name: "참치마요 삼각김밥", tags: ["간편식", "삼각김밥"] },
    verdict: { title: "조금만 드세요", sub: "나트륨과 포화지방이 높은 편이에요." },
    coach:
      "식사 대용으로는 괜찮지만 나트륨 함량이 높은 편이에요. 오늘 다른 짠 음식과 함께 섭취하는 것은 피하는 것이 좋아요.",
    nutrition: [
      { name: "열량", value: "420kcal", status: "주의", tone: "warn" },
      { name: "탄수화물", value: "46g", status: "안전", tone: "ok" },
      { name: "지방", value: "18g", status: "주의", tone: "warn" },
      { name: "나트륨", value: "780mg", status: "위험", tone: "bad" },
      { name: "당류", value: "4g", status: "안전", tone: "ok" },
    ],
    risk: { ok: 2, warn: 2, bad: 1 },
    ingredientsText: "마요네즈, 참치, 정제소금, 혼합제제, 향미증진제",
    warningIngredients: [
      { name: "나트륨", category: "영양", info: "1일 권장량의 약 39%에 해당해요." },
      { name: "포화지방", category: "영양", info: "포화지방 함량이 높은 편이에요." },
      { name: "향미증진제", category: "첨가물", info: "맛을 강화하는 가공 첨가물이에요." },
    ],
    alternatives: [
      { name: "닭가슴살 주먹밥", tag: "나트륨 낮음 · 단백질 높음" },
      { name: "현미 참치 삼각김밥", tag: "식이섬유 높음 · 지방 낮음" },
    ],
  },
  {
    product: { foodType: "과자", name: "초코칩 쿠키", tags: ["과자", "쿠키"] },
    verdict: { title: "오늘은 피해주세요", sub: "당류와 포화지방이 모두 높은 편이에요." },
    coach:
      "당과 포화지방이 높아 자주 드시면 부담될 수 있어요. 가끔, 소량만 즐기는 것을 추천해요.",
    nutrition: [
      { name: "열량", value: "480kcal", status: "위험", tone: "bad" },
      { name: "탄수화물", value: "58g", status: "주의", tone: "warn" },
      { name: "지방", value: "24g", status: "위험", tone: "bad" },
      { name: "포화지방", value: "12g", status: "위험", tone: "bad" },
      { name: "당류", value: "28g", status: "위험", tone: "bad" },
    ],
    risk: { ok: 1, warn: 1, bad: 3 },
    ingredientsText: "밀가루, 설탕, 버터, 초코칩(코코아매스, 설탕, 식물성유지), 계란, 합성향료",
    warningIngredients: [
      { name: "당류", category: "영양", info: "한 봉지에 28g의 당이 들어 있어요." },
      { name: "포화지방", category: "영양", info: "버터·식물성유지로 비율이 높아요." },
      { name: "합성향료", category: "첨가물", info: "맛과 향을 강화하기 위해 사용돼요." },
    ],
    alternatives: [
      { name: "오트밀 쿠키", tag: "통곡물 · 당류 낮음" },
      { name: "다크초콜릿 한 조각", tag: "당 낮음 · 포만감" },
    ],
  },
  {
    product: { foodType: "탄산음료", name: "무가당 탄산수", tags: ["음료", "제로슈가"] },
    verdict: { title: "괜찮아요", sub: "당류와 나트륨 부담이 낮은 편이에요." },
    coach:
      "당과 칼로리 부담이 없어 갈증 해소에 좋아요. 식사 중에도 부담 없이 즐길 수 있어요.",
    nutrition: [
      { name: "열량", value: "0kcal", status: "안전", tone: "ok" },
      { name: "탄수화물", value: "0g", status: "안전", tone: "ok" },
      { name: "지방", value: "0g", status: "안전", tone: "ok" },
      { name: "나트륨", value: "10mg", status: "안전", tone: "ok" },
      { name: "당류", value: "0g", status: "안전", tone: "ok" },
    ],
    risk: { ok: 2, warn: 0, bad: 0 },
    ingredientsText: "정제수, 이산화탄소",
    warningIngredients: [],
    alternatives: [
      { name: "보리차", tag: "디카페인 · 부드러운 곡물차" },
      { name: "레몬워터", tag: "비타민C · 칼로리 0" },
    ],
  },
  {
    product: { foodType: "과자", name: "포카칩 오리지널", tags: ["과자", "스낵"] },
    verdict: { title: "조금만 드세요", sub: "나트륨과 지방 함량을 확인해보세요." },
    coach:
      "가끔 즐기는 간식으로는 괜찮지만, 한 봉지를 다 드시면 나트륨과 지방 섭취가 많아질 수 있어요.",
    nutrition: [
      { name: "열량", value: "340kcal", status: "주의", tone: "warn" },
      { name: "탄수화물", value: "32g", status: "안전", tone: "ok" },
      { name: "지방", value: "22g", status: "위험", tone: "bad" },
      { name: "포화지방", value: "8g", status: "주의", tone: "warn" },
      { name: "나트륨", value: "320mg", status: "주의", tone: "warn" },
    ],
    risk: { ok: 1, warn: 3, bad: 1 },
    ingredientsText: "감자, 식물성유지(팜올레인유), 정제소금, 향미증진제, 산화방지제",
    warningIngredients: [
      { name: "지방", category: "영양", info: "튀김 가공으로 지방 함량이 높아요." },
      { name: "팜올레인유", category: "유지", info: "포화지방 비율이 높은 편이에요." },
      { name: "향미증진제", category: "첨가물", info: "맛을 강화하기 위해 사용돼요." },
    ],
    alternatives: [
      { name: "고구마칩(에어프라이)", tag: "지방 낮음 · 식이섬유 풍부" },
      { name: "구운 통곡물 크래커", tag: "통곡물 · 나트륨 낮음" },
    ],
  },
];

function Result() {
  const navigate = useNavigate();
  const { from } = Route.useSearch();
  const isFromHome = from === "home";
  // New scan/upload → random mock product. Stable per mount.
  const d = useMemo(() => MOCK_LIST[Math.floor(Math.random() * MOCK_LIST.length)], []);

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
        <section className="rounded-3xl p-5 bg-gradient-to-br from-warning to-warning/80 text-warning-foreground relative overflow-hidden shadow-soft">
          <AlertTriangle className="absolute right-4 top-4 size-10 opacity-70" strokeWidth={2.2} />
          <div className="text-[12px] font-medium opacity-80">픽잇의 판단</div>
          <h2 className="mt-0.5 text-[28px] font-black tracking-tight leading-tight">
            {d.verdict.title}
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

import { Sparkles, ArrowRight, ImageOff } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mascot } from "@/components/Mascot";
import { cn } from "@/lib/utils";

type Verdict = "ok" | "warn" | "bad";
type Tone = "ok" | "warn" | "bad";

interface NutritionRow {
  name: string;
  value: string;
  status: string;
  tone: Tone;
}
interface IngredientRow {
  name: string;
  category?: string;
  info?: string;
  tone?: Tone;
}
interface AlternativeRow {
  name: string;
  tag?: string;
}
interface AnalysisData {
  product?: { name?: string; brand?: string; foodType?: string; tags?: string[] };
  verdict?: Verdict;
  verdictTitle?: string;
  verdictSub?: string;
  coach?: string;
  nutrition?: NutritionRow[];
  ingredientsText?: string;
  warningIngredients?: IngredientRow[];
  risk?: { ok?: number; warn?: number; bad?: number };
  alternatives?: AlternativeRow[];
}

const verdictMap: Record<Verdict, { title: string; sub: string; bg: string; emoji: string }> = {
  ok: { title: "안전", sub: "오늘 목표에 잘 맞아요", bg: "from-success to-success/70", emoji: "🌿" },
  warn: { title: "주의", sub: "주의 성분이 포함되어 있어요.", bg: "from-warning to-warning/80", emoji: "⚠️" },
  bad: { title: "위험", sub: "목표를 초과해요", bg: "from-destructive to-destructive/70", emoji: "🚫" },
};

function readAnalysis(): AnalysisData | null {
  try {
    const raw = sessionStorage.getItem("analyze.result");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return normalize(parsed);
  } catch {
    return null;
  }
}

function normalize(input: any): AnalysisData | null {
  if (!input || typeof input !== "object") return null;
  // Try common shapes from n8n response.
  const src = input.data ?? input.result ?? input;
  if (!src || typeof src !== "object") return null;

  const product = src.product ?? {
    name: src.product_name ?? src.productName ?? src.name,
    brand: src.food_type ?? src.brand,
    foodType: src.food_type ?? src.foodType ?? src.category ?? src.productType,
    tags: src.tags,
  };

  const rawNutrition = src.nutrition;
  let nutrition: NutritionRow[] | undefined;
  if (Array.isArray(rawNutrition)) {
    nutrition = rawNutrition.map((r: any) => ({
      name: String(r.name ?? r.n ?? ""),
      value: String(r.value ?? r.v ?? ""),
      status: String(r.status ?? r.s ?? ""),
      tone: (r.tone ?? r.t ?? "ok") as Tone,
    }));
  } else if (rawNutrition && typeof rawNutrition === "object") {
    nutrition = Object.entries(rawNutrition).map(([name, value]) => ({
      name,
      value: String(value ?? ""),
      status: "",
      tone: "ok" as Tone,
    }));
  }

  const warnSrc = src.warning_ingredients ?? src.warningIngredients ?? src.warnings;
  const warningIngredients: IngredientRow[] | undefined = Array.isArray(warnSrc)
    ? warnSrc.map((r: any) =>
        typeof r === "string"
          ? { name: r, tone: "warn" as Tone }
          : {
              name: String(r.name ?? r.n ?? ""),
              category: r.category ?? r.c,
              info: r.info ?? r.i ?? r.reason,
              tone: (r.tone ?? "warn") as Tone,
            }
      )
    : undefined;

  return {
    product: product ?? undefined,
    verdict: src.verdict as Verdict | undefined,
    verdictTitle: src.verdictTitle,
    verdictSub: src.verdictSub,
    coach: src.ai_comment ?? src.coach ?? src.comment ?? src.aiComment,
    nutrition,
    ingredientsText: src.ingredients ?? src.ingredientsText ?? src.rawIngredients,
    warningIngredients,
    risk: src.risk,
    alternatives: Array.isArray(src.alternatives)
      ? src.alternatives.map((a: any) => ({ name: String(a.name ?? a.n ?? ""), tag: a.tag ?? a.t }))
      : undefined,
  };
}

export function AnalysisView() {
  const [data, setData] = useState<AnalysisData | null | undefined>(undefined);

  useEffect(() => {
    setData(readAnalysis());
  }, []);

  if (data === undefined) {
    return (
      <main className="px-5 pt-10 pb-6 text-center text-[13px] text-muted-foreground">
        결과를 불러오는 중…
      </main>
    );
  }

  if (!data) {
    return (
      <main className="px-5 pt-16 pb-6 flex flex-col items-center text-center">
        <div className="size-16 rounded-full bg-muted grid place-items-center">
          <ImageOff className="size-7 text-muted-foreground" />
        </div>
        <h2 className="mt-5 text-[17px] font-bold">분석 결과를 불러올 수 없어요</h2>
        <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">
          이미지가 비어 있거나 분석에 실패했어요.<br />다시 촬영해주세요.
        </p>
        <Link
          to="/scan"
          className="mt-6 inline-flex h-11 px-5 items-center rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold"
        >
          다시 촬영하기
        </Link>
      </main>
    );
  }

  const verdict: Verdict = data.verdict ?? "warn";
  const v = verdictMap[verdict];
  const title = data.verdictTitle ?? v.title;
  const sub = data.verdictSub ?? v.sub;

  return (
    <main className="px-5 pt-2 pb-6 space-y-3.5">
      {/* Product summary */}
      <section className="rounded-3xl p-4 bg-surface border border-border flex gap-3">
        <div className="size-14 rounded-2xl bg-gradient-to-br from-zinc-200 to-zinc-300 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[11.5px] text-muted-foreground">{data.product?.foodType ?? "정보 없음"}</div>
          <div className="text-[15.5px] font-bold mt-0.5 truncate">
            {data.product?.name ?? "확인 불가"}
          </div>
          {data.product?.tags && data.product.tags.length > 0 && (
            <div className="mt-1.5 flex gap-1.5 flex-wrap">
              {data.product.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main verdict */}
      <section className={cn("rounded-3xl p-5 bg-gradient-to-br text-white relative overflow-hidden", v.bg)}>
        <div className="absolute -right-5 -top-5 text-[96px] opacity-20 leading-none select-none">{v.emoji}</div>
        <div className="text-[12px] font-medium opacity-90">픽잇의 판단</div>
        <h2 className="mt-0.5 text-[28px] font-black tracking-tight leading-tight">{title}</h2>
        <p className="mt-1.5 text-[13.5px] opacity-95 leading-relaxed pr-10">{sub}</p>
      </section>

      {/* AI coach comment */}
      {data.coach && (
        <section className="rounded-3xl p-4 bg-primary-soft border border-primary/30 flex gap-3">
          <Mascot size={40} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-primary">
              <Sparkles className="size-3" /> AI 코치 한마디
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-foreground">{data.coach}</p>
          </div>
        </section>
      )}

      {/* Scanned nutrition facts */}
      {data.nutrition && data.nutrition.length > 0 && (
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
              {data.nutrition.map((r) => (
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
      )}

      {/* Ingredient analysis */}
      {(data.ingredientsText || (data.warningIngredients && data.warningIngredients.length > 0) || data.risk) && (
        <section className="rounded-3xl p-5 bg-surface border border-border">
          <h3 className="text-[14px] font-bold">원재료명 분석</h3>
          <p className="mt-1 text-[12px] text-muted-foreground">원재료명에서 주의할 성분만 골라 정리했어요</p>

          {data.risk && (
            <div className="mt-4">
              <div className="text-[11.5px] font-semibold text-foreground/80">성분 위험도</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <RiskChip tone="ok">낮음 {data.risk.ok ?? 0}개</RiskChip>
                <RiskChip tone="warn">주의 {data.risk.warn ?? 0}개</RiskChip>
                <RiskChip tone="bad">피해야 함 {data.risk.bad ?? 0}개</RiskChip>
              </div>
            </div>
          )}

          {data.ingredientsText && (
            <div className="mt-4">
              <div className="text-[11.5px] font-semibold text-foreground/80">원재료명 원문</div>
              <div className="mt-2 rounded-2xl bg-muted/40 px-3.5 py-3">
                <p className="text-[12.5px] leading-relaxed text-foreground/75">{data.ingredientsText}</p>
              </div>
            </div>
          )}

          {data.warningIngredients && data.warningIngredients.length > 0 && (
            <div className="mt-4">
              <div className="text-[11.5px] font-semibold text-foreground/80">주의 성분</div>
              <ul className="mt-2 rounded-2xl border border-border/70 bg-background divide-y divide-border/60 overflow-hidden">
                {data.warningIngredients.map((r) => (
                  <li key={r.name} className="px-3.5 py-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge tone={r.tone ?? "warn"}>주의</StatusBadge>
                      <span className="text-[13.5px] font-semibold">{r.name}</span>
                      {r.category && (
                        <span className="text-[11px] text-muted-foreground ml-auto">{r.category}</span>
                      )}
                    </div>
                    {r.info && (
                      <p className="mt-1.5 text-[12.5px] leading-snug text-foreground/75">{r.info}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Alternative recommendations */}
      {data.alternatives && data.alternatives.length > 0 && (
        <section className="rounded-3xl p-5 bg-gradient-to-br from-secondary/40 to-primary-soft border border-border">
          <h3 className="text-[14px] font-bold">대체 상품 추천</h3>
          <ul className="mt-3 space-y-2">
            {data.alternatives.map((p) => (
              <li key={p.name} className="flex items-center gap-3 p-3 rounded-2xl bg-surface">
                <div className="size-10 rounded-xl bg-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold truncate">{p.name}</div>
                  {p.tag && <div className="text-[11.5px] text-muted-foreground">{p.tag}</div>}
                </div>
                <ArrowRight className="size-4 text-primary" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
      {children}
    </span>
  );
}

function RiskChip({ children, tone }: { children: React.ReactNode; tone: Tone }) {
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

function StatusBadge({ children, tone }: { children: React.ReactNode; tone: Tone }) {
  const styles =
    tone === "ok"
      ? "bg-success/15 text-success"
      : tone === "warn"
        ? "bg-warning/20 text-warning-foreground"
        : "bg-destructive/15 text-destructive";
  return (
    <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", styles)}>
      {children}
    </span>
  );
}

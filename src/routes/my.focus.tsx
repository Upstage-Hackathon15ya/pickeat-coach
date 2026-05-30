import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { cn } from "@/lib/utils";
import { syncOnboardingFromStorage, ApiError } from "@/lib/api";
import { Loader2, Minus, Plus } from "lucide-react";

const numericItems = ["당류", "나트륨", "탄수화물", "포화지방", "단백질"] as const;
const detectItems = ["대체당", "첨가물"] as const;
const NUMERIC_LIMIT = 3;

export const Route = createFileRoute("/my/focus")({
  component: FocusEdit,
});

type NumericKey = "당류" | "나트륨" | "포화지방" | "탄수화물" | "단백질";
type DetectKey = "대체당" | "첨가물";
type Key = NumericKey | DetectKey;

const items: Key[] = ["당류", "나트륨", "탄수화물", "포화지방", "단백질", "대체당", "첨가물"];

type NumericCfg = {
  kind: "numeric";
  label: string;
  unit: string;
  step: number;
  min: number;
  max: number;
  defaultValue: number;
  note: string;
};
type DetectCfg = {
  kind: "detect";
  label: string;
  body: string;
  note: string;
};

const config: Record<Key, NumericCfg | DetectCfg> = {
  당류: { kind: "numeric", label: "당류 목표량", unit: "g", step: 5, min: 20, max: 200, defaultValue: 70, note: "기준 권장량 100g · 당류 관리 목표에 맞춰 낮게 설정했어요." },
  나트륨: { kind: "numeric", label: "나트륨 목표량", unit: "mg", step: 100, min: 500, max: 3000, defaultValue: 1500, note: "기준 권장량 2000mg · 나트륨 관리 목표에 맞춰 낮게 설정했어요." },
  포화지방: { kind: "numeric", label: "포화지방 목표량", unit: "g", step: 1, min: 3, max: 30, defaultValue: 10, note: "기준 권장량 15g · 체중 관리 목표에 맞춰 낮게 설정했어요." },
  탄수화물: { kind: "numeric", label: "탄수화물 목표량", unit: "g", step: 10, min: 50, max: 500, defaultValue: 300, note: "기준 권장량 324g · 활동량에 맞춰 조절할 수 있어요." },
  단백질: { kind: "numeric", label: "단백질 목표량", unit: "g", step: 5, min: 30, max: 200, defaultValue: 70, note: "단백질 중심 목표에 맞춰 충분히 설정했어요." },
  대체당: { kind: "detect", label: "대체당 관리 방식", body: "원재료명에서 대체당을 감지하면 알려드려요.", note: "예: 아세설팜칼륨, 수크랄로스, 아스파탐" },
  첨가물: { kind: "detect", label: "첨가물 관리 방식", body: "원재료명에서 주의 첨가물을 감지하면 알려드려요.", note: "기준값이 아닌 성분 감지 중심으로 관리해요." },
};

const defaultValues: Record<string, number> = {
  당류: 70, 나트륨: 1500, 포화지방: 10, 탄수화물: 300, 단백질: 70,
};

const STORAGE_KEY = "onboarding.focus";

function FocusEdit() {
  const router = useRouter();
  const [sel, setSel] = useState<Key[]>([]);
  const [values, setValues] = useState<Record<string, number>>(defaultValues);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p.sel)) setSel(p.sel.filter((k: string) => (items as string[]).includes(k)) as Key[]);
        if (p.values) setValues((prev) => ({ ...prev, ...p.values }));
      }
    } catch {}
    setLoaded(true);
  }, []);

  const toggle = (v: Key) =>
    setSel((p) => {
      if (p.includes(v)) return p.filter((x) => x !== v);
      const isNumeric = (numericItems as readonly string[]).includes(v);
      if (isNumeric) {
        const currentNumeric = p.filter((k) => (numericItems as readonly string[]).includes(k)).length;
        if (currentNumeric >= NUMERIC_LIMIT) {
          toast("영양성분 기준은 최대 3개까지 선택할 수 있어요.");
          return p;
        }
      }
      return [...p, v];
    });

  const renderChip = (it: Key) => {
    const active = sel.includes(it);
    return (
      <button
        key={it}
        onClick={() => toggle(it)}
        className={cn(
          "h-11 px-2 rounded-full text-[14px] font-medium border transition-all w-full",
          active
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-surface text-foreground border-border"
        )}
      >
        {it}
      </button>
    );
  };

  const updateValue = (k: Key, delta: number) => {
    const cfg = config[k];
    if (cfg.kind !== "numeric") return;
    setValues((p) => ({
      ...p,
      [k]: Math.max(cfg.min, Math.min(cfg.max, (p[k] ?? cfg.defaultValue) + delta)),
    }));
  };

  const persist = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const prev = raw ? JSON.parse(raw) : {};
      const targets: Record<string, number> = {};
      const management: Record<string, string> = {};
      sel.forEach((k) => {
        const cfg = config[k];
        if (cfg.kind === "numeric") targets[k] = values[k] ?? cfg.defaultValue;
        else management[k] = "detect";
      });
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...prev, sel, values, targets, management })
      );
    } catch {}
  };

  // Note: do NOT auto-persist while editing. Only persist on explicit save (handleDone).

  const handleDone = async () => {
    if (saving) return;
    persist();
    setSaving(true);
    try {
      await syncOnboardingFromStorage();
      toast("집중 관리 성분이 저장되었어요.");
      router.history.back();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "저장에 실패했어요. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <TopBar title="집중 관리 성분" />
      <div className="flex-1 flex flex-col px-6 pb-10">
        <p className="text-[14px] text-muted-foreground">
          선택한 성분 위주로 알려드릴게요. 목표에 맞게 값을 조절할 수 있어요.
        </p>

        <div className="mt-6">
          <div className="text-[13px] font-semibold">영양성분 기준</div>
          <p className="mt-1 text-[12px] text-muted-foreground">최대 3개까지 선택할 수 있어요.</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {numericItems.map((it) => renderChip(it as Key))}
          </div>
        </div>

        <div className="mt-5">
          <div className="text-[13px] font-semibold">원재료 기준</div>
          <p className="mt-1 text-[12px] text-muted-foreground">원재료명에서 감지되면 알려드려요.</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {detectItems.map((it) => renderChip(it as Key))}
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          {items.filter((k) => sel.includes(k)).map((k) => {
            const cfg = config[k];
            if (cfg.kind === "numeric") {
              const value = values[k] ?? cfg.defaultValue;
              return (
                <div key={k} className="rounded-2xl border border-border bg-surface p-4">
                  <div className="text-[13px] font-semibold">{cfg.label}</div>
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/40 px-2 py-1.5">
                    <button
                      onClick={() => updateValue(k, -cfg.step)}
                      className="size-9 rounded-lg bg-surface border border-border grid place-items-center active:bg-muted"
                      aria-label="감소"
                    >
                      <Minus className="size-4" />
                    </button>
                    <div className="text-[15px] font-bold tabular-nums">
                      {value}
                      <span className="text-[12px] font-medium text-muted-foreground ml-1">{cfg.unit} / day</span>
                    </div>
                    <button
                      onClick={() => updateValue(k, cfg.step)}
                      className="size-9 rounded-lg bg-surface border border-border grid place-items-center active:bg-muted"
                      aria-label="증가"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                  <p className="mt-2.5 text-[11.5px] leading-relaxed text-muted-foreground">{cfg.note}</p>
                </div>
              );
            }
            return (
              <div key={k} className="rounded-2xl border border-border bg-surface p-4">
                <div className="text-[13px] font-semibold">{cfg.label}</div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-foreground/85">{cfg.body}</p>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{cfg.note}</p>
              </div>
            );
          })}
        </div>

        <div className="flex-1 min-h-6" />

        <button
          onClick={handleDone}
          disabled={saving}
          className="h-14 mt-6 rounded-2xl bg-primary text-primary-foreground text-base font-semibold disabled:opacity-70"
        >
          {saving ? <span className="inline-flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin" /> 저장 중…</span> : "변경 완료"}
        </button>
      </div>
    </AppShell>
  );
}

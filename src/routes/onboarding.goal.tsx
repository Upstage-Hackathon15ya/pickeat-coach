import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { cn } from "@/lib/utils";
import { Scale, Droplet, Salad, HeartPulse, Dumbbell, Sparkles } from "lucide-react";

export const Route = createFileRoute("/onboarding/goal")({
  component: OnbGoal,
});

const goals = [
  { id: "weight", label: "체중 관리", desc: "당류·포화지방·탄수화물 중심으로 봐드려요", icon: Scale, focus: ["당류", "포화지방", "나트륨"] },
  { id: "blood", label: "혈당 관리", desc: "당류와 GI 영향 성분을 체크해요", icon: Droplet, focus: ["당류", "대체당", "탄수화물"] },
  { id: "sodium", label: "나트륨 관리", desc: "숨은 나트륨까지 찾아드려요", icon: HeartPulse, focus: ["나트륨"] },
  { id: "gut", label: "장 건강", desc: "식이섬유와 첨가물을 봐드려요", icon: Salad, focus: ["대체당", "첨가물"] },
  { id: "protein", label: "단백질 중심", desc: "단백질 비율을 우선 분석해요", icon: Dumbbell, focus: ["단백질", "포화지방"] },
];

function saveGoal(id: string, label: string, focus: string[]) {
  try {
    localStorage.setItem(
      "onboarding.healthGoal",
      JSON.stringify({ id, label, focus })
    );
    // Reset previously saved focus selections so the next step
    // can pre-select the recommended ingredients for this goal.
    const prevRaw = localStorage.getItem("onboarding.focus");
    if (prevRaw) {
      try {
        const prev = JSON.parse(prevRaw);
        localStorage.setItem(
          "onboarding.focus",
          JSON.stringify({ ...prev, sel: focus })
        );
      } catch {
        localStorage.removeItem("onboarding.focus");
      }
    }
  } catch {}
}

function OnbGoal() {
  const [sel, setSel] = useState<string | null>("weight");
  const selected = goals.find((g) => g.id === sel);

  return (
    <AppShell>
      <TopBar title="2 / 4" />
      <div className="flex-1 flex flex-col px-6 pb-10">
        <h2 className="text-2xl font-extrabold tracking-tight leading-snug">
          어떤 건강 목표가<br />가장 중요한가요?
        </h2>
        <p className="mt-2 text-[14px] text-muted-foreground">하나만 선택해 주세요</p>

        <div className="mt-4 rounded-2xl bg-primary-soft border border-primary/30 px-4 py-3 flex items-start gap-2">
          <Sparkles className="size-4 text-primary mt-0.5 shrink-0" />
          <p className="text-[12.5px] leading-relaxed text-foreground/85">
            성별과 만 나이를 기준으로 기본 권장량이 자동 설정돼요.
          </p>
        </div>

        <div className="mt-5 space-y-2.5">
          {goals.map((g) => {
            const Icon = g.icon;
            const active = sel === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setSel(g.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all",
                  active
                    ? "border-primary bg-primary-soft shadow-[var(--shadow-soft)]"
                    : "border-border bg-surface"
                )}
              >
                <div className={cn(
                  "size-12 rounded-xl grid place-items-center shrink-0",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <Icon className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold">{g.label}</div>
                  <div className="text-[12.5px] text-muted-foreground mt-0.5">{g.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="mt-4 rounded-2xl border border-border bg-surface px-4 py-3">
            <div className="text-[11.5px] font-semibold text-muted-foreground">추천 집중 성분</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selected.focus.map((f) => (
                <span key={f} className="text-[12px] font-semibold px-2.5 py-1 rounded-full bg-primary-soft text-primary border border-primary/20">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 min-h-6" />
        <Link
          to="/onboarding/focus"
          onClick={() => {
            if (selected) saveGoal(selected.id, selected.label, selected.focus);
          }}
          className={cn(
            "h-14 mt-6 rounded-2xl text-base font-semibold grid place-items-center",
            sel ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground pointer-events-none"
          )}
        >
          다음
        </Link>
      </div>
    </AppShell>
  );
}

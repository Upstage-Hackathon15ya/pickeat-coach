import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";

export const Route = createFileRoute("/onboarding/restricted")({
  component: OnbRestricted,
});

const items = ["유제품", "견과류", "갑각류", "글루텐", "계란", "과일류"];
const STORAGE_KEY = "onboarding.restricted";

function OnbRestricted() {
  const navigate = useNavigate();
  const [sel, setSel] = useState<string[]>([]);
  const [custom, setCustom] = useState<string[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [text, setText] = useState("");

  const hasSelection = sel.length > 0;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p.sel)) setSel(p.sel);
        if (Array.isArray(p.custom)) setCustom(p.custom);
      }
    } catch {}
  }, []);

  const persist = (nextSel: string[], nextCustom: string[]) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ sel: nextSel, custom: nextCustom })
      );
    } catch {}
  };

  const toggle = (v: string) => {
    const next = sel.includes(v) ? sel.filter((x) => x !== v) : [...sel, v];
    setSel(next);
  };

  const addCustom = () => {
    const v = text.trim();
    if (!v) return;
    let nextCustom = custom;
    let nextSel = sel;
    if (!custom.includes(v)) nextCustom = [...custom, v];
    if (!sel.includes(v)) nextSel = [...sel, v];
    setCustom(nextCustom);
    setSel(nextSel);
    setText("");
  };

  const removeCustom = (v: string) => {
    const nextCustom = custom.filter((x) => x !== v);
    const nextSel = sel.filter((x) => x !== v);
    setCustom(nextCustom);
    setSel(nextSel);
  };

  const handleComplete = () => {
    persist(sel, custom);
    navigate({ to: "/onboarding/complete" });
  };

  const handleSkip = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    navigate({ to: "/onboarding/complete" });
  };

  return (
    <AppShell>
      <TopBar title="4 / 4" />
      <div className="flex-1 flex flex-col px-6 pb-10">
        <h2 className="text-2xl font-extrabold tracking-tight leading-snug">
          피해야 하는<br />성분이 있나요?
        </h2>
        <p className="mt-2 text-[14px] text-muted-foreground">
          선택한 성분이 원재료명에 포함되면 강하게 알려드려요.
        </p>

        <div className="mt-8 grid grid-cols-3 gap-2.5">
          {items.map((it) => {
            const active = sel.includes(it);
            return (
              <button
                key={it}
                onClick={() => toggle(it)}
                className={cn(
                  "h-16 rounded-2xl text-[14px] font-semibold border transition-all",
                  active
                    ? "bg-destructive/10 text-destructive border-destructive"
                    : "bg-surface text-foreground border-border"
                )}
              >
                {it}
              </button>
            );
          })}
          {custom.map((c) => (
            <div
              key={c}
              className="relative h-16 rounded-2xl text-[14px] font-semibold border transition-all bg-destructive/10 text-destructive border-destructive flex items-center justify-center"
            >
              <span className="px-3 truncate">{c}</span>
              <button
                onClick={() => removeCustom(c)}
                aria-label={`${c} 삭제`}
                className="absolute top-1 right-1 size-5 rounded-full grid place-items-center bg-destructive text-destructive-foreground"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setShowInput((v) => !v)}
            className={cn(
              "h-16 rounded-2xl text-[13px] font-medium border border-dashed flex items-center justify-center gap-1",
              showInput
                ? "border-destructive text-destructive"
                : "border-border text-muted-foreground"
            )}
          >
            <Plus className="size-4" /> 직접 입력
          </button>
        </div>

        {showInput && (
          <div className="mt-4 rounded-2xl border border-border bg-surface p-3">
            <label className="text-[13px] font-semibold text-foreground">
              직접 입력
            </label>
            <div className="mt-2 flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustom();
                  }
                }}
                placeholder="예: 복숭아, 땅콩, 아스파탐"
                className="flex-1 h-11 px-3 rounded-xl border border-border bg-background text-[14px] outline-none focus:border-destructive"
              />
              <button
                onClick={addCustom}
                className="h-11 px-4 rounded-xl bg-destructive text-destructive-foreground text-[14px] font-semibold"
              >
                추가
              </button>
            </div>
          </div>
        )}

        <div className="flex-1" />
        <div className="space-y-2">
          <button
            onClick={handleComplete}
            disabled={!hasSelection}
            className="w-full h-14 rounded-2xl text-base font-semibold grid place-items-center bg-primary text-primary-foreground disabled:opacity-50 disabled:active:scale-100"
          >
            완료
          </button>
          <button
            onClick={handleSkip}
            className="w-full h-12 text-[14px] font-medium grid place-items-center text-muted-foreground"
          >
            건너뛰기
          </button>
        </div>
      </div>
    </AppShell>
  );
}

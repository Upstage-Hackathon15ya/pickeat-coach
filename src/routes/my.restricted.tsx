import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { cn } from "@/lib/utils";
import { syncOnboardingFromStorage, ApiError } from "@/lib/api";
import { Loader2, Plus, X } from "lucide-react";

export const Route = createFileRoute("/my/restricted")({
  component: RestrictedEdit,
});

const items = ["유제품", "견과류", "갑각류", "글루텐", "계란", "과일류"];
const STORAGE_KEY = "onboarding.restricted";

function RestrictedEdit() {
  const router = useRouter();
  const [sel, setSel] = useState<string[]>([]);
  const [custom, setCustom] = useState<string[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

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
    setSel((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  };

  const addCustom = () => {
    const v = text.trim();
    if (!v) return;
    setCustom((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setSel((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setText("");
  };

  const removeCustom = (v: string) => {
    setCustom((prev) => prev.filter((x) => x !== v));
    setSel((prev) => prev.filter((x) => x !== v));
  };

  const handleSave = async () => {
    if (saving) return;
    persist(sel, custom);
    setSaving(true);
    try {
      await syncOnboardingFromStorage();
      toast("피해야 할 성분이 저장되었어요.");
      router.history.back();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "저장에 실패했어요. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <TopBar title="피해야 할 성분" />
      <div className="flex-1 flex flex-col px-5 pb-8">
        <p className="text-[13px] text-muted-foreground">선택한 성분이 들어있으면 강하게 알려드려요</p>
        <div className="mt-6 grid grid-cols-3 gap-2.5">
          {items.map((it) => {
            const active = sel.includes(it);
            return (
              <button
                key={it}
                onClick={() => toggle(it)}
                className={cn(
                  "h-16 rounded-2xl text-[14px] font-semibold border",
                  active ? "bg-destructive/10 text-destructive border-destructive" : "bg-surface border-border"
                )}
              >
                {it}
              </button>
            );
          })}
          {custom.map((c) => (
            <div
              key={c}
              className="relative h-16 rounded-2xl text-[14px] font-semibold border bg-destructive/10 text-destructive border-destructive flex items-center justify-center"
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
              showInput ? "border-destructive text-destructive" : "border-border text-muted-foreground"
            )}
          >
            <Plus className="size-4" /> 직접 입력
          </button>
        </div>

        {showInput && (
          <div className="mt-4 rounded-2xl border border-border bg-surface p-3">
            <label className="text-[13px] font-semibold text-foreground">직접 입력</label>
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
        <button onClick={handleSave} disabled={saving} className="h-14 rounded-2xl bg-primary text-primary-foreground text-base font-semibold disabled:opacity-70">
          {saving ? <span className="inline-flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin" /> 저장 중…</span> : "저장"}
        </button>
      </div>
    </AppShell>
  );
}

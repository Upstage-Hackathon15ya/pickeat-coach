import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { AnalysisView } from "@/components/AnalysisView";
import { saveIntake, saveScan, N8nError } from "@/lib/n8n";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analyze/result")({
  component: Result,
});

function readAnalysis(): unknown {
  try {
    const raw = sessionStorage.getItem("analyze.result");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function Result() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState<null | "eat" | "save">(null);
  const [error, setError] = useState<string | null>(null);

  const handle = async (mode: "eat" | "save") => {
    if (busy) return;
    setBusy(mode);
    setError(null);
    const analysis = readAnalysis();
    const payload = { analysis, savedAt: new Date().toISOString() };
    try {
      const tasks: Promise<unknown>[] = [saveScan(payload)];
      if (mode === "eat") tasks.push(saveIntake(payload));
      await Promise.all(tasks);
      navigate({ to: "/analyze/saved" });
    } catch (e) {
      setError(e instanceof N8nError ? e.message : "저장에 실패했어요");
      setBusy(null);
    }
  };

  return (
    <AppShell>
      <TopBar title="분석 결과" onBack={() => navigate({ to: "/home" })} />

      <AnalysisView />

      <div className="sticky bottom-0 bg-background/95 backdrop-blur px-5 pt-3 pb-6 border-t border-border">
        {error && <p className="mb-2 text-[12px] text-destructive">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => handle("eat")}
            disabled={!!busy}
            className={cn(
              "flex-[2] h-14 rounded-2xl bg-primary text-primary-foreground text-[15px] font-semibold grid place-items-center",
              busy && "opacity-70"
            )}
          >
            {busy === "eat" ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" /> 저장 중…
              </span>
            ) : (
              "먹었어요"
            )}
          </button>
          <button
            onClick={() => handle("save")}
            disabled={!!busy}
            className={cn(
              "flex-1 h-14 rounded-2xl bg-surface border border-border text-[14px] font-medium grid place-items-center",
              busy && "opacity-70"
            )}
          >
            {busy === "save" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "저장만 하기"
            )}
          </button>
        </div>
      </div>
    </AppShell>
  );
}

import { createFileRoute, useRouter } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { AnalysisView } from "@/components/AnalysisView";

export const Route = createFileRoute("/history/$id")({
  component: HistoryDetail,
});

function HistoryDetail() {
  const router = useRouter();
  return (
    <AppShell>
      <TopBar title="지난 분석" />
      <AnalysisView />
      <div className="sticky bottom-0 bg-background/95 backdrop-blur px-5 pt-3 pb-6 border-t border-border">
        <button
          onClick={() => router.history.back()}
          className="w-full h-14 rounded-2xl bg-surface border border-border text-[15px] font-medium"
        >
          이전으로
        </button>
      </div>
    </AppShell>
  );
}

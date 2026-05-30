import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/analyze/saved")({
  component: Saved,
});

function Saved() {
  return (
    <AppShell>
      <div className="flex-1 flex flex-col px-6 pb-10">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="size-24 rounded-full bg-success/15 grid place-items-center">
            <CheckCircle2 className="size-12 text-success" strokeWidth={2.2} />
          </div>
          <h1 className="mt-7 text-[22px] font-extrabold tracking-tight">
            오늘 기록에 저장했어요
          </h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            이어서 더 스캔하거나 기록을 확인해 보세요
          </p>
        </div>

        <div className="space-y-2">
          <Link to="/home" className="h-14 rounded-2xl bg-primary text-primary-foreground text-base font-semibold grid place-items-center">
            홈으로 가기
          </Link>
          <Link to="/history" className="h-14 rounded-2xl bg-surface border border-border text-base font-medium grid place-items-center">
            기록 보기
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

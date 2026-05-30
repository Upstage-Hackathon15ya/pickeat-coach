import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Mascot } from "@/components/Mascot";

export const Route = createFileRoute("/onboarding/complete")({
  component: OnbDone,
});

function OnbDone() {
  return (
    <AppShell>
      <div className="flex-1 flex flex-col px-6 pb-10 bg-gradient-to-b from-primary-soft/60 via-background to-background">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
            <Mascot size={120} className="relative animate-in zoom-in-50 duration-700" />
          </div>
          <h1 className="mt-8 text-[22px] font-extrabold tracking-tight leading-snug">
            픽잇이 맞춤 분석<br />준비를 끝냈어요
          </h1>
          <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed">
            이제 식품 성분표를 찍으면<br />바로 알려드릴게요
          </p>
        </div>

        <Link
          to="/home"
          className="h-14 rounded-2xl text-base font-semibold grid place-items-center bg-primary text-primary-foreground"
        >
          홈으로 가기
        </Link>
      </div>
    </AppShell>
  );
}

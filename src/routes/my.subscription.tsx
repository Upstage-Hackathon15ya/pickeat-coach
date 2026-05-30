import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { Check, Crown } from "lucide-react";

export const Route = createFileRoute("/my/subscription")({
  component: Sub,
});

function Sub() {
  return (
    <AppShell>
      <TopBar title="구독 관리" />
      <div className="flex-1 px-5 pb-10 space-y-4">
        <section className="rounded-3xl p-6 bg-gradient-to-br from-primary via-primary/85 to-secondary text-primary-foreground relative overflow-hidden">
          <Crown className="absolute -right-4 -top-4 size-32 opacity-20" />
          <div className="text-[12px] font-semibold opacity-90">Premium</div>
          <h2 className="mt-1 text-[26px] font-black tracking-tight">무제한으로 스캔하기</h2>
          <p className="mt-1.5 text-[13px] opacity-95">픽잇을 매일, 마음껏 활용해 보세요</p>
          <div className="mt-5 text-[28px] font-black">월 2,900원</div>
        </section>

        <ul className="rounded-3xl bg-surface border border-border p-5 space-y-3">
          {["하루 스캔 무제한"].map((t) => (
            <li key={t} className="flex items-center gap-3 text-[13.5px]">
              <span className="size-6 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0">
                <Check className="size-3.5" />
              </span>
              {t}
            </li>
          ))}
        </ul>

        <div className="rounded-3xl bg-muted/60 p-5">
          <div className="flex justify-between items-baseline">
            <div className="text-[13px] font-bold">Free 플랜</div>
            <div className="text-[11.5px] text-muted-foreground">현재 사용 중</div>
          </div>
          <p className="text-[12.5px] text-muted-foreground mt-1">하루 3회 스캔</p>
        </div>

        <button className="w-full h-14 rounded-2xl bg-primary text-primary-foreground text-base font-semibold">
          Premium 시작하기
        </button>
        <p className="text-center text-[11px] text-muted-foreground">언제든 해지할 수 있어요</p>
      </div>
    </AppShell>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { Mascot } from "@/components/Mascot";

export const Route = createFileRoute("/start")({
  component: Start,
});

function Start() {
  const navigate = useNavigate();
  return (
    <AppShell>
      <div className="flex-1 flex flex-col px-6 pt-16 pb-10">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <Mascot size={88} />
          <div className="mt-6"><Logo /></div>
          <h1 className="mt-8 text-2xl font-extrabold tracking-tight leading-snug">
            나에게 딱 맞는<br />음식인지 3초 안에
          </h1>
          <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed">
            성분표를 찍으면 AI 코치 픽잇이<br />먹어도 되는지 알려드려요
          </p>
        </div>

        <div className="space-y-3">
          <Link
            to="/signup"
            className="block w-full h-14 rounded-2xl bg-primary text-primary-foreground text-base font-semibold grid place-items-center active:scale-[0.99] transition-transform"
          >
            시작하기
          </Link>
          <button
            onClick={() => navigate({ to: "/login" })}
            className="block w-full h-14 rounded-2xl bg-surface border border-border text-sm font-medium text-foreground active:bg-muted"
          >
            이미 계정이 있어요
          </button>
          <p className="text-[11px] text-center text-muted-foreground pt-2">
            계속 진행하면 이용약관 및 개인정보 처리방침에 동의하게 됩니다
          </p>
        </div>
      </div>
    </AppShell>
  );
}

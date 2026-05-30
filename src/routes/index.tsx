import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { Mascot } from "@/components/Mascot";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PickEat 픽잇" },
      { name: "description", content: "먹기 전에, 나에게 맞는지 먼저 확인해요." },
    ],
  }),
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => navigate({ to: "/start" }), 1800);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <AppShell>
      <div className="flex-1 flex flex-col items-center justify-center px-6 bg-gradient-to-b from-primary-soft via-background to-background">
        <Mascot size={112} priority className="animate-in fade-in zoom-in-95 duration-700" />
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <Logo />
        </div>
        <p className="mt-5 text-center text-[15px] text-muted-foreground leading-relaxed animate-in fade-in duration-1000">
          먹기 전에, 나에게 맞는지<br />먼저 확인해요
        </p>
        <Link to="/start" className="sr-only">시작하기</Link>
      </div>
    </AppShell>
  );
}

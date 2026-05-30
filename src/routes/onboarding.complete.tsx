import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Mascot } from "@/components/Mascot";
import { submitOnboarding, ApiError } from "@/lib/api";

export const Route = createFileRoute("/onboarding/complete")({
  component: OnbDone,
});

function OnbDone() {
  const navigate = useNavigate();
  const sent = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  function readJSON<T = unknown>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    (async () => {
      try {
        await submitOnboarding({
          info: readJSON("onboarding.info"),
          goal: readJSON("onboarding.goal"),
          healthGoal: readJSON("onboarding.healthGoal"),
          focus: readJSON("onboarding.focus"),
          restricted: readJSON("onboarding.restricted"),
        });
      } catch {
        // 사용자 흐름을 막지 않기 위해 조용히 무시 — 홈 진입 시점에 다시 시도 가능
      }
    })();
  }, []);

  const goHome = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // 홈 진입 직전에도 한 번 더 전송 보장
      await submitOnboarding({
        info: readJSON("onboarding.info"),
        goal: readJSON("onboarding.goal"),
        healthGoal: readJSON("onboarding.healthGoal"),
        focus: readJSON("onboarding.focus"),
        restricted: readJSON("onboarding.restricted"),
      });
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      }
      // 실패해도 홈으로 이동
    } finally {
      setSubmitting(false);
      navigate({ to: "/home" });
    }
  };

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

        <button
          onClick={goHome}
          disabled={submitting}
          className="h-14 rounded-2xl text-base font-semibold grid place-items-center bg-primary text-primary-foreground disabled:opacity-70"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" /> 저장 중…
            </span>
          ) : (
            "홈으로 가기"
          )}
        </button>
      </div>
    </AppShell>
  );
}

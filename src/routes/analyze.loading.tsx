import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Mascot } from "@/components/Mascot";
import { scanNutrition } from "@/lib/n8n";
import { analyzeFood } from "@/lib/api";
import { ensureLoadedDataUrl, ImageNotLoadedError } from "@/lib/image";

export const Route = createFileRoute("/analyze/loading")({
  component: Loading,
});

const FAIL_MSG = "분석에 실패했어요. 다시 시도해주세요";

function Loading() {
  const navigate = useNavigate();
  const ran = useRef(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    try {
      sessionStorage.removeItem("analyze.result");
      sessionStorage.removeItem("analyze.error");
    } catch {
      // ignore
    }

    const read = (k: string) => {
      try { return sessionStorage.getItem(k); } catch { return null; }
    };
    const raw_nutrition = read("scan.image.nutrition");
    const raw_ingredients = read("scan.image.ingredients");

    console.log("raw_nutrition 길이:", raw_nutrition?.length);
    console.log("raw_ingredients 길이:", raw_ingredients?.length);

    if (!raw_nutrition || !raw_ingredients) {
      const msg = "이미지 촬영을 다시 시도해주세요";
      setErrorMsg(msg);
      toast.error(msg);
      try { sessionStorage.setItem("analyze.error", msg); } catch {}
      return;
    }

    let userHealthGoal = "";
    try {
      const raw = localStorage.getItem("onboarding.healthGoal");
      if (raw) {
        const parsed = JSON.parse(raw);
        userHealthGoal = parsed?.label ?? parsed?.id ?? "";
      }
    } catch {
      // ignore
    }

    (async () => {
      try {
        // Image 객체 onload 후 canvas 로 재-그려 placeholder 가 아닌 실제 픽셀
        // 데이터가 들어있는지 검증한다. naturalWidth === 0 이면 throw.
        const nutritionDataUrl = await ensureLoadedDataUrl(
          raw_nutrition.startsWith("data:") ? raw_nutrition : `data:image/jpeg;base64,${raw_nutrition}`,
        );
        // ingredients 도 동일하게 검증 (현재 API 는 nutrition 만 전송하지만 placeholder 검증 목적).
        await ensureLoadedDataUrl(
          raw_ingredients.startsWith("data:") ? raw_ingredients : `data:image/jpeg;base64,${raw_ingredients}`,
        );

        const image_nutrition = nutritionDataUrl.split(",")[1] ?? "";

        const result = await scanNutrition({
          image: image_nutrition,
          health_goal: userHealthGoal,
        });
        // 백엔드 analyzedFood 호출 (보조) — 실패해도 기존 결과 사용
        try {
          await analyzeFood({
            foodData: {
              image: image_nutrition,
              healthGoal: userHealthGoal,
            },
          });
        } catch {
          // ignore
        }
        if (!result || result.success === false) {
          setErrorMsg(FAIL_MSG);
          toast.error(FAIL_MSG);
          try { sessionStorage.setItem("analyze.error", FAIL_MSG); } catch {}
          return;
        }
        try {
          sessionStorage.setItem("analyze.result", JSON.stringify(result));
        } catch {
          // ignore
        }
        navigate({ to: "/analyze/result" });
      } catch (e) {
        const msg = e instanceof ImageNotLoadedError
          ? "이미지가 아직 로드되지 않았습니다. 다시 시도해주세요"
          : FAIL_MSG;
        try { sessionStorage.setItem("analyze.error", msg); } catch {}
        setErrorMsg(msg);
        toast.error(msg);
        void e;
      }
    })();
  }, [navigate]);

  return (
    <AppShell>
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center bg-gradient-to-b from-primary-soft/50 to-background">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl animate-pulse" />
          <Mascot size={120} className="relative" />
        </div>

        <div className="mt-10 flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>

        <h2 className="mt-8 text-[20px] font-extrabold tracking-tight">
          픽잇이 성분표를<br />분석하고 있어요
        </h2>
        <p className="mt-3 text-[14px] text-muted-foreground leading-relaxed">
          영양성분과 원재료명을<br />함께 확인하는 중이에요
        </p>

        {errorMsg && (
          <div className="mt-6 space-y-3">
            <p className="text-[13px] text-destructive">{errorMsg}</p>
            <button
              onClick={() => navigate({ to: "/scan" })}
              className="px-4 h-10 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold"
            >
              다시 촬영하기
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

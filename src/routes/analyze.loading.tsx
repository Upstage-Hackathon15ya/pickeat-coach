import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Mascot } from "@/components/Mascot";
import { scanNutrition } from "@/lib/n8n";
import { N8nError } from "@/lib/n8n";
import { ensureLoadedDataUrl, mergeImagesVertically, ImageNotLoadedError } from "@/lib/image";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/lib/api";

export const Route = createFileRoute("/analyze/loading")({
  component: Loading,
});

const FAIL_MSG = "분석에 실패했어요. 다시 시도해주세요";
const SERVER_MSG = "분석 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.";
const LOGIN_MSG = "로그인이 필요합니다.";

function Loading() {
  const navigate = useNavigate();
  const ran = useRef(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    sessionStorage.removeItem("analyze.result");
    sessionStorage.removeItem("analyze.error");

    const read = (k: string) => sessionStorage.getItem(k);

    const raw_nutrition = read("scan.image.nutrition");
    const raw_ingredients = read("scan.image.ingredients");

    if (!raw_nutrition || !raw_ingredients) {
      const msg = "이미지 촬영을 다시 시도해주세요";
      setErrorMsg(msg);
      toast.error(msg);
      sessionStorage.setItem("analyze.error", msg);
      return;
    }

    let userHealthGoal = "";
    try {
      const raw = localStorage.getItem("onboarding.healthGoal");
      if (raw) {
        const parsed = JSON.parse(raw);
        userHealthGoal = parsed?.label ?? parsed?.id ?? "";
      }
    } catch {}

    (async () => {
      try {
        // 1. 이미지 검증
        const nutritionDataUrl = await ensureLoadedDataUrl(
          raw_nutrition.startsWith("data:") ? raw_nutrition : `data:image/jpeg;base64,${raw_nutrition}`,
        );

        const ingredientsDataUrl = await ensureLoadedDataUrl(
          raw_ingredients.startsWith("data:") ? raw_ingredients : `data:image/jpeg;base64,${raw_ingredients}`,
        );

        // 2. 이미지 합치기
        const mergedDataUrl = await mergeImagesVertically(ingredientsDataUrl, nutritionDataUrl, "image/jpeg", 0.9);

        sessionStorage.setItem("scan.image.merged", mergedDataUrl);

        const image_merged = mergedDataUrl.split(",")[1] ?? "";

        // 3. user_id 확보
        let resolvedUserId: string | null = getUserId();

        if (!resolvedUserId) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          resolvedUserId = session?.user?.id ?? null;
        }

        // 4. 로그인 체크
        if (!resolvedUserId) {
          setErrorMsg(LOGIN_MSG);
          toast.error(LOGIN_MSG);
          return;
        }

        const user_id = String(resolvedUserId);

        // 🔥 DEBUG (필수)
        console.log("[n8n payload]", {
          user_id,
          health_goal: userHealthGoal,
          image_length: image_merged?.length,
        });

        // 5. n8n 호출 (절대 undefined 없음)
        const result = await scanNutrition({
          image: image_merged,
          health_goal: userHealthGoal,
          user_id: user_id,
        });

        // 6. 결과 체크
        if (!result?.success) {
          setErrorMsg(FAIL_MSG);
          toast.error(FAIL_MSG);
          sessionStorage.setItem("analyze.error", FAIL_MSG);
          return;
        }

        sessionStorage.setItem("analyze.result", JSON.stringify(result));
        navigate({ to: "/analyze/result" });
      } catch (e) {
        const msg =
          e instanceof ImageNotLoadedError
            ? "이미지가 아직 로드되지 않았습니다. 다시 시도해주세요"
            : e instanceof N8nError
              ? SERVER_MSG
              : FAIL_MSG;

        setErrorMsg(msg);
        toast.error(msg);
        sessionStorage.setItem("analyze.error", msg);
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
          픽잇이 성분표를
          <br />
          분석하고 있어요
        </h2>

        <p className="mt-3 text-[14px] text-muted-foreground leading-relaxed">
          영양성분과 원재료명을
          <br />
          함께 확인하는 중이에요
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

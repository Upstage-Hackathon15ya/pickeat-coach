import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { X, ImageIcon, HelpCircle, Zap } from "lucide-react";

export const Route = createFileRoute("/scan/")({
  component: Scan,
});

type Step = 1 | 2;

const STEP_COPY: Record<Step, { label: string; title: string; description: string; storageKey: string }> = {
  1: {
    label: "영양성분",
    title: "영양성분표를 스캔해주세요",
    description: "영양성분표 전체가 잘 보이도록 촬영해주세요.",
    storageKey: "scan.image.nutrition",
  },
  2: {
    label: "원재료명 및 함량",
    title: "원재료표를 스캔해주세요",
    description: "원재료명과 함량이 함께 보이도록 촬영해주세요.",
    storageKey: "scan.image.ingredients",
  },
};

function Scan() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Clear any prior scan/analysis state so a new session starts fresh.
  useEffect(() => {
    try {
      sessionStorage.removeItem("analyze.result");
      sessionStorage.removeItem("analyze.error");
      sessionStorage.removeItem("scan.image");
      sessionStorage.removeItem("scan.image.ingredients");
      sessionStorage.removeItem("scan.image.nutrition");
      sessionStorage.removeItem("scan.image.product");
      sessionStorage.removeItem("scan.mimeType");
      sessionStorage.removeItem("scan.filename");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const stopStream = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };

    const startCamera = async () => {
      try {
        if (typeof window !== "undefined" && window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
          const msg = "카메라 사용을 위해 HTTPS 환경이 필요합니다.";
          setErrorMsg(msg);
          toast.error(msg);
          return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
          const msg = "이 브라우저는 카메라를 지원하지 않습니다.";
          setErrorMsg(msg);
          toast.error(msg);
          return;
        }

        stopStream();

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.setAttribute("autoplay", "");
          video.setAttribute("playsinline", "");
          video.setAttribute("muted", "");
          video.muted = true;
          try {
            await video.play();
          } catch (playErr) {
            console.warn("video.play() failed:", playErr);
          }
          setErrorMsg(null);
        }
      } catch (err: any) {
        console.error("Camera Error:", err?.name, err?.message);
        let msg = "카메라를 열 수 없습니다.";
        switch (err?.name) {
          case "NotAllowedError":
          case "PermissionDeniedError":
            msg = "카메라 접근 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.";
            break;
          case "NotFoundError":
          case "DevicesNotFoundError":
            msg = "사용 가능한 카메라 장치를 찾을 수 없습니다.";
            break;
          case "NotReadableError":
          case "TrackStartError":
            msg = "카메라 장치에 접근할 수 없습니다. 다른 앱에서 사용 중일 수 있습니다.";
            break;
          case "OverconstrainedError":
          case "ConstraintNotSatisfiedError":
            msg = "요청한 카메라 설정을 지원하지 않습니다.";
            break;
          case "SecurityError":
            msg = "보안 정책으로 카메라를 사용할 수 없습니다 (HTTPS 필요).";
            break;
        }
        setErrorMsg(msg);
        toast.error(msg);
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      stopStream();
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, []);

  const handleCapture = () => {
    if (capturing || previewUrl) return;
    const video = videoRef.current;
    if (!video || !streamRef.current || video.readyState < 2 || !video.videoWidth) {
      toast.error("카메라가 아직 준비되지 않았어요");
      return;
    }
    try {
      setCapturing(true);
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        toast.error("이미지를 캡처할 수 없어요");
        setCapturing(false);
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      if (!dataUrl || dataUrl.length < 100) {
        toast.error("인식하지 못했어요. 다시 시도해주세요");
        setCapturing(false);
        return;
      }
      setPreviewUrl(dataUrl);
      setCapturing(false);
    } catch (e) {
      console.error(e);
      toast.error("인식하지 못했어요. 다시 시도해주세요");
      setCapturing(false);
    }
  };

  const handleRetake = () => {
    setPreviewUrl(null);
  };

  const handleConfirm = () => {
    if (!previewUrl) return;
    const current = STEP_COPY[step];
    try {
      sessionStorage.setItem(current.storageKey, previewUrl);
    } catch (e) {
      console.warn("sessionStorage write failed", e);
    }

    if (step < 2) {
      setStep((step + 1) as Step);
      setPreviewUrl(null);
      return;
    }

    try {
      sessionStorage.removeItem("analyze.result");
      sessionStorage.removeItem("analyze.error");
      const nutrition = sessionStorage.getItem("scan.image.nutrition");
      sessionStorage.setItem("scan.image", nutrition ?? previewUrl);
      sessionStorage.setItem("scan.mimeType", "image/jpeg");
      sessionStorage.setItem("scan.filename", `scan-${Date.now()}.jpg`);
    } catch (e) {
      console.warn("sessionStorage write failed", e);
    }
    navigate({ to: "/analyze/loading" });
  };

  const copy = STEP_COPY[step];

  return (
    <AppShell>
      <div className="relative flex-1 min-h-screen bg-[#0c0d0f] text-white flex flex-col">
        {/* top bar */}
        <header className="flex items-center justify-between px-4 pt-4 z-10">
          <button onClick={() => navigate({ to: "/home" })} aria-label="닫기" className="size-10 grid place-items-center rounded-full bg-white/10">
            <X className="size-5" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-medium text-white/70">{step}/2</span>
            <span className="text-[13px] font-semibold">{copy.label}</span>
          </div>
          <Link to="/scan/guide" className="size-10 grid place-items-center rounded-full bg-white/10" aria-label="가이드">
            <HelpCircle className="size-5" />
          </Link>
        </header>

        {/* step progress dots */}
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {[1, 2].map((i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all ${i === step ? "w-6 bg-primary" : i < step ? "w-3 bg-primary/60" : "w-3 bg-white/20"}`}
            />
          ))}
        </div>

        {/* title/description */}
        <div className="px-6 pt-3 text-center">
          <h2 className="text-[16px] font-bold leading-snug">{copy.title}</h2>
          <p className="mt-1 text-[12px] text-white/70 leading-relaxed">{copy.description}</p>
        </div>

        {/* camera viewport */}
        <div className="flex-1 relative flex items-center justify-center px-6">
          <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 aspect-[3/4] rounded-3xl overflow-hidden">
            {/* live camera */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover bg-zinc-900"
            />
            {errorMsg && (
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900 flex items-center justify-center p-6 text-center text-[13px] text-white/90">
                {errorMsg}
              </div>
            )}
            {previewUrl && (
              <img
                src={previewUrl}
                alt="촬영된 이미지"
                loading="eager"
                decoding="sync"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {/* corner frame */}
            <Corners />
            {!previewUrl && (
              <div className="absolute inset-x-0 bottom-6 flex justify-center">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-full bg-black/40 backdrop-blur">
                  <Zap className="size-3" /> 자동 인식 중
                </span>
              </div>
            )}
          </div>
        </div>

        {/* controls */}
        <footer className="px-6 pb-10 pt-6 flex items-center justify-between">
          {previewUrl ? (
            <>
              <button
                onClick={handleRetake}
                className="flex-1 h-14 rounded-2xl bg-white/10 text-white text-base font-semibold grid place-items-center active:scale-[0.99] transition-transform"
              >
                다시 찍기
              </button>
              <div className="w-3" />
              <button
                onClick={handleConfirm}
                className="flex-1 h-14 rounded-2xl bg-primary text-primary-foreground text-base font-semibold grid place-items-center active:scale-[0.99] transition-transform"
              >
                {step < 2 ? "다음" : "분석하기"}
              </button>
            </>
          ) : (
            <>
              <Link to="/scan/upload" aria-label="갤러리" className="size-12 rounded-2xl bg-white/10 grid place-items-center">
                <ImageIcon className="size-5" />
              </Link>
              <button
                onClick={handleCapture}
                disabled={capturing || !!errorMsg}
                aria-label="촬영"
                className="size-20 rounded-full bg-white grid place-items-center active:scale-95 transition-transform disabled:opacity-60"
              >
                <span className="size-16 rounded-full border-4 border-zinc-900" />
              </button>
              <div className="size-12" />
            </>
          )}
        </footer>
      </div>
    </AppShell>
  );
}

function Corners() {
  const c = "absolute size-8 border-primary";
  return (
    <>
      <div className={`${c} top-4 left-4 border-t-4 border-l-4 rounded-tl-2xl`} />
      <div className={`${c} top-4 right-4 border-t-4 border-r-4 rounded-tr-2xl`} />
      <div className={`${c} bottom-4 left-4 border-b-4 border-l-4 rounded-bl-2xl`} />
      <div className={`${c} bottom-4 right-4 border-b-4 border-r-4 rounded-br-2xl`} />
    </>
  );
}

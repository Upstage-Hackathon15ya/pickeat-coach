import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { ImagePlus, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fileToNormalizedDataUrl, ensureLoadedDataUrl } from "@/lib/image";

export const Route = createFileRoute("/scan/upload")({
  component: ScanUpload,
});




type Slot = "ingredients" | "nutrition";

interface SlotConfig {
  key: Slot;
  title: string;
  desc: string;
  storageKey: string;
  mimeKey: string;
  nameKey: string;
}

const SLOTS: SlotConfig[] = [
  {
    key: "ingredients",
    title: "원재료표",
    desc: "제품명과 원재료명 및 함량이 보이게 업로드",
    storageKey: "scan.image.ingredients",
    mimeKey: "scan.mimeType.ingredients",
    nameKey: "scan.filename.ingredients",
  },
  {
    key: "nutrition",
    title: "영양성분표",
    desc: "영양성분표 전체가 보이게 업로드",
    storageKey: "scan.image.nutrition",
    mimeKey: "scan.mimeType.nutrition",
    nameKey: "scan.filename.nutrition",
  },
];

function UploadBox({
  slot,
  file,
  preview,
  onPick,
  onReset,
}: {
  slot: SlotConfig;
  file: File | null;
  preview: string | null;
  onPick: (f: File | null) => void;
  onReset: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const picked = !!file;
  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className={cn(
          "aspect-[3/4] w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all overflow-hidden",
          picked
            ? "border-primary bg-primary-soft"
            : "border-border bg-surface text-muted-foreground"
        )}
      >
        {picked && preview ? (
          <img src={preview} alt={slot.title} loading="eager" decoding="sync" className="size-full object-cover" />
        ) : (
          <>
            <ImagePlus className="size-8" />
            <span className="text-[12px] font-medium">이미지 선택</span>
          </>
        )}
      </button>
      <div className="mt-2.5">
        <h3 className="text-[13px] font-semibold">{slot.title}</h3>
        <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
          {slot.desc}
        </p>
      </div>
      {picked && (
        <button
          onClick={() => {
            onReset();
            if (inputRef.current) inputRef.current.value = "";
          }}
          className="mt-2 self-start inline-flex items-center gap-1 text-[11px] text-muted-foreground"
        >
          <RotateCcw className="size-3" /> 다시 선택
        </button>
      )}
    </div>
  );
}

function ScanUpload() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<Record<Slot, File | null>>({
    ingredients: null,
    nutrition: null,
  });
  const [previews, setPreviews] = useState<Record<Slot, string | null>>({
    ingredients: null,
    nutrition: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bothPicked = !!files.ingredients && !!files.nutrition;

  useEffect(() => {
    try {
      sessionStorage.removeItem("analyze.result");
      sessionStorage.removeItem("analyze.error");
      SLOTS.forEach((s) => {
        sessionStorage.removeItem(s.storageKey);
        sessionStorage.removeItem(s.mimeKey);
        sessionStorage.removeItem(s.nameKey);
      });
    } catch {
      // ignore
    }
  }, []);

  const onPick = async (slot: Slot, f: File | null) => {
    if (!f) return;
    setError(null);
    setFiles((prev) => ({ ...prev, [slot]: f }));
    try {
      const url = await fileToNormalizedDataUrl(f, f.type || "image/jpeg");
      setPreviews((prev) => ({ ...prev, [slot]: url }));
    } catch {
      setPreviews((prev) => ({ ...prev, [slot]: null }));
    }
  };

  const onReset = (slot: Slot) => {
    setFiles((prev) => ({ ...prev, [slot]: null }));
    setPreviews((prev) => ({ ...prev, [slot]: null }));
  };

  const onAnalyze = async () => {
    if (!bothPicked || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      for (const slot of SLOTS) {
        const f = files[slot.key]!;
        const existing = previews[slot.key];
        const image = existing
          ? await ensureLoadedDataUrl(existing, f.type || "image/jpeg")
          : await fileToNormalizedDataUrl(f, f.type || "image/jpeg");
        if (!image) {
          setError("이미지를 읽을 수 없어요");
          setSubmitting(false);
          return;
        }
        try {
          sessionStorage.setItem(slot.storageKey, image);
          sessionStorage.setItem(slot.mimeKey, f.type || "image/jpeg");
          sessionStorage.setItem(
            slot.nameKey,
            f.name || `${slot.key}-${Date.now()}.jpg`
          );
        } catch {
          // ignore
        }
      }
      try {
        sessionStorage.removeItem("analyze.result");
        sessionStorage.removeItem("analyze.error");
      } catch {
        // ignore
      }
      navigate({ to: "/analyze/loading" });
    } catch {
      setError("분석 요청을 시작할 수 없어요");
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <TopBar title="이미지 업로드" />
      <div className="flex-1 flex flex-col px-5 pb-8">
        <p className="text-[13px] text-muted-foreground">
          원재료표와 영양성분표 사진을 각각 업로드해주세요
        </p>

        <div className="mt-5 flex gap-3">
          {SLOTS.map((slot) => (
            <UploadBox
              key={slot.key}
              slot={slot}
              file={files[slot.key]}
              preview={previews[slot.key]}
              onPick={(f) => onPick(slot.key, f)}
              onReset={() => onReset(slot.key)}
            />
          ))}
        </div>

        {error && (
          <p className="mt-3 text-[12px] text-destructive">{error}</p>
        )}

        <div className="flex-1" />
        <button
          onClick={onAnalyze}
          disabled={!bothPicked || submitting}
          className={cn(
            "h-14 rounded-2xl text-base font-semibold grid place-items-center",
            bothPicked && !submitting
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" /> 분석 중…
            </span>
          ) : (
            "분석하기"
          )}
        </button>
      </div>
    </AppShell>
  );
}

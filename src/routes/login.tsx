import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { login, ApiError, setStoredUser } from "@/lib/api";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim() && password.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      // userId 보장
      const existing = (() => {
        try { return JSON.parse(localStorage.getItem("eatfit.user") ?? "{}"); } catch { return {}; }
      })();
      if (!existing.userId) {
        const fallbackId =
          globalThis.crypto?.randomUUID?.() ??
          `u_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        setStoredUser({ userId: fallbackId, email: email.trim() });
      } else {
        setStoredUser({ email: email.trim() });
      }
      navigate({ to: "/home" });
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "로그인에 실패했어요. 이메일과 비밀번호를 확인해주세요.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <TopBar title="로그인" />
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col px-6 pt-4 pb-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight leading-snug">
            로그인
          </h1>
          <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">
            픽잇 계정으로 다시 시작해요.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Field label="이메일">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              autoComplete="email"
              className="w-full h-12 px-4 rounded-xl bg-surface border border-border text-[15px] outline-none focus:border-primary"
            />
          </Field>
          <Field label="비밀번호">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력해주세요"
              autoComplete="current-password"
              className="w-full h-12 px-4 rounded-xl bg-surface border border-border text-[15px] outline-none focus:border-primary"
            />
          </Field>
        </div>

        <div className="flex-1" />

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground text-base font-semibold grid place-items-center active:scale-[0.99] transition-transform disabled:opacity-50 disabled:active:scale-100"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" /> 로그인 중…
            </span>
          ) : (
            "로그인"
          )}
        </button>
      </form>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[13px] font-medium text-muted-foreground mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

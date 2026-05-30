import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";

export const Route = createFileRoute("/signup")({
  component: SignUp,
});

function SignUp() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const canSubmit = name.trim() && email.trim() && password.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast("올바른 이메일 형식이 아니에요.");
      return;
    }

    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    const hasNoSpaces = !/\s/.test(password);
    const isLongEnough = password.length >= 8;

    if (!hasLowercase || !hasNumber || !hasSpecial || !hasNoSpaces || !isLongEnough) {
      toast("비밀번호 조건을 확인해주세요.");
      return;
    }

    const userId =
      (globalThis.crypto?.randomUUID?.() ??
        `u_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`);
    try {
      localStorage.setItem(
        "eatfit.user",
        JSON.stringify({ userId, name: name.trim(), email: email.trim() }),
      );
    } catch {}
    navigate({ to: "/onboarding/info" });
  };

  return (
    <AppShell>
      <TopBar title="회원가입" />
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col px-6 pt-4 pb-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight leading-snug">
            회원가입
          </h1>
          <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">
            픽잇이 맞춤 분석을 시작할 수 있도록 정보를 입력해주세요.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Field label="이름">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력해주세요"
              className="w-full h-12 px-4 rounded-xl bg-surface border border-border text-[15px] outline-none focus:border-primary"
            />
          </Field>
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
              autoComplete="new-password"
              className="w-full h-12 px-4 rounded-xl bg-surface border border-border text-[15px] outline-none focus:border-primary"
            />
            <p className="mt-1.5 text-[12px] text-muted-foreground leading-relaxed">
              공백없이 영문 소문자·숫자·특수문자를 포함해 8자 이상 입력해주세요.
            </p>
          </Field>
        </div>

        <div className="flex-1" />

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground text-base font-semibold grid place-items-center active:scale-[0.99] transition-transform disabled:opacity-50 disabled:active:scale-100"
        >
          가입하고 시작하기
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

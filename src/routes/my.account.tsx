import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { syncOnboardingFromStorage, ApiError } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/my/account")({
  component: Account,
});

function Account() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [editing, setEditing] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("eatfit.user");
      if (raw) {
        const u = JSON.parse(raw);
        const n = typeof u?.name === "string" ? u.name.trim() : "";
        if (n && !n.startsWith("=") && !n.includes("{{")) setName(n);
        if (u?.email) setEmail(String(u.email));
        if (u?.password) setPassword(String(u.password));
      }
    } catch {}
  }, []);

  const handleSave = async () => {
    if (saving) return;
    const cleanName = name.trim();
    if (cleanName.startsWith("=") || cleanName.includes("{{")) {
      toast.error("이름이 올바르지 않아요. 다시 입력해주세요.");
      return;
    }
    try {
      const raw = localStorage.getItem("eatfit.user");
      const prev = raw ? JSON.parse(raw) : {};
      const next = { ...prev, name: cleanName, email, password };
      localStorage.setItem("eatfit.user", JSON.stringify(next));
    } catch {}
    setSaving(true);
    try {
      await syncOnboardingFromStorage();
      setEditing(false);
      toast("프로필이 저장되었어요.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "저장에 실패했어요. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    try {
      const raw = localStorage.getItem("eatfit.user");
      const prev = raw ? JSON.parse(raw) : {};
      const next = { name: prev.name };
      localStorage.setItem("eatfit.user", JSON.stringify(next));
    } catch {
      localStorage.removeItem("eatfit.user");
    }
    setLogoutOpen(false);
    router.navigate({ to: "/start" });
  };

  const handleDeleteAccount = () => {
    try {
      localStorage.removeItem("eatfit.user");
      localStorage.removeItem("onboarding.healthGoal");
      localStorage.removeItem("onboarding.focus");
      localStorage.removeItem("onboarding.restricted");
    } catch {}
    setDeleteOpen(false);
    router.navigate({ to: "/start" });
  };

  return (
    <AppShell>
      <TopBar
        title="프로필 관리"
        right={
          <button
            aria-label={editing ? "편집 중" : "편집"}
            onClick={() => !editing && setEditing(true)}
            className="size-10 grid place-items-center rounded-full active:bg-muted"
          >
            {editing ? (
              <Check className="size-5 text-primary" />
            ) : (
              <Pencil className="size-5" />
            )}
          </button>
        }
      />
      <div className="px-5 pt-2 space-y-3">
        <Field label="이름" value={name} onChange={setName} disabled={!editing} />
        <Field label="이메일" value={email} onChange={setEmail} type="email" disabled={!editing} />
        <Field label="비밀번호" value={password} onChange={setPassword} type="password" disabled={!editing} />
      </div>

      {editing && (
        <div className="px-5 mt-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary text-primary-foreground rounded-2xl py-4 text-[15px] font-semibold disabled:opacity-70"
          >
            {saving ? <span className="inline-flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin" /> 저장 중…</span> : "저장"}
          </button>
        </div>
      )}

      <div className="px-5 mt-10 space-y-3">
        <button
          onClick={() => setLogoutOpen(true)}
          className="w-full rounded-2xl py-4 text-[15px] font-semibold bg-surface border border-border text-foreground active:bg-muted"
        >
          로그아웃
        </button>
        <div className="h-px bg-border" />
        <button
          onClick={() => setDeleteOpen(true)}
          className="w-full rounded-2xl py-4 text-[15px] font-semibold bg-surface border border-destructive text-destructive active:bg-destructive/10"
        >
          회원 탈퇴
        </button>
      </div>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>로그아웃할까요?</AlertDialogTitle>
            <AlertDialogDescription>현재 계정에서 로그아웃됩니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLogoutOpen(false)}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>로그아웃</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 탈퇴할까요?</AlertDialogTitle>
            <AlertDialogDescription>탈퇴하면 계정 정보와 저장된 설정이 삭제됩니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteOpen(false)}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              탈퇴하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block p-4 rounded-2xl bg-surface border border-border">
      <div className="text-[11.5px] text-muted-foreground mb-1">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        readOnly={disabled}
        className="w-full bg-transparent outline-none text-[14px] font-medium disabled:opacity-100 disabled:cursor-default"
      />
    </label>
  );
}

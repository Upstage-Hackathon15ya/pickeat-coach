import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BottomNav } from "@/components/BottomNav";
import { ChevronRight, Crown, Target, Filter, Ban, Bell, Settings, User } from "lucide-react";

export const Route = createFileRoute("/my/")({
  component: My,
});

const RESTRICTED_KEY = "onboarding.restricted";
const FOCUS_KEY = "onboarding.focus";

function focusLabel(sel: string[]) {
  if (sel.length === 0) return "선택 없음";
  if (sel.length <= 2) return sel.join(", ");
  return `${sel.slice(0, 2).join(", ")} 외 ${sel.length - 2}개`;
}

function My() {
  const [restrictedCount, setRestrictedCount] = useState(0);
  const [focusDesc, setFocusDesc] = useState("선택 없음");
  const [profile, setProfile] = useState<{ name: string; age: number | null; healthGoal: string | null }>({
    name: "다임",
    age: null,
    healthGoal: null,
  });
  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem(RESTRICTED_KEY);
        if (!raw) setRestrictedCount(0);
        else {
          const p = JSON.parse(raw);
          const sel: string[] = Array.isArray(p.sel) ? p.sel : [];
          const custom: string[] = Array.isArray(p.custom) ? p.custom : [];
          setRestrictedCount(new Set([...sel, ...custom]).size);
        }
      } catch {
        setRestrictedCount(0);
      }
      try {
        const raw = localStorage.getItem(FOCUS_KEY);
        if (!raw) setFocusDesc("선택 없음");
        else {
          const p = JSON.parse(raw);
          const sel: string[] = Array.isArray(p.sel) ? p.sel : [];
          setFocusDesc(focusLabel(sel));
        }
      } catch {
        setFocusDesc("선택 없음");
      }
      try {
        const userRaw = localStorage.getItem("eatfit.user");
        const goalRaw = localStorage.getItem("onboarding.healthGoal");
        const user = userRaw ? JSON.parse(userRaw) : {};
        const goal = goalRaw ? JSON.parse(goalRaw) : null;
        setProfile({
          name: user?.name ?? "다임",
          age: typeof user?.age === "number" ? user.age : null,
          healthGoal: goal?.label ?? null,
        });
      } catch {}
    };
    read();
    window.addEventListener("focus", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("focus", read);
      window.removeEventListener("storage", read);
    };
  }, []);

  const goalDesc = profile.healthGoal ?? "체중 관리";

  const settings = [
    { to: "/my/goal", icon: Target, label: "건강 목표", desc: goalDesc },
    { to: "/my/focus", icon: Filter, label: "집중 관리 성분", desc: focusDesc },
    { to: "/my/restricted", icon: Ban, label: "피해야 할 성분", desc: restrictedCount === 0 ? "없음" : `${restrictedCount}개` },
    { to: "/my/subscription", icon: Crown, label: "구독 관리", desc: "Free 플랜" },
    { to: "/my/notifications", icon: Bell, label: "알림 설정", desc: "" },
    { to: "/my/account", icon: Settings, label: "계정 설정", desc: "" },
  ] as const;

  return (
    <AppShell withBottomNav>
      <header className="px-5 pt-5">
        <h1 className="text-[22px] font-extrabold tracking-tight">마이</h1>
      </header>

      <section className="mx-5 mt-4 p-5 rounded-3xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="size-14 rounded-full bg-white/20 grid place-items-center">
            <User className="size-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[16px] font-bold">{profile.name}님</div>
            <div className="text-[12px] opacity-90">
              {[profile.age ? `${profile.age}세` : null, profile.healthGoal ?? "체중 관리"]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
          <Link to="/my/subscription" className="text-[11.5px] font-semibold bg-white/20 px-3 py-1.5 rounded-full">
            업그레이드
          </Link>
        </div>
        <Link
          to="/my/account"
          className="mt-4 block w-full text-center bg-white/20 rounded-2xl py-3 text-[13px] font-semibold"
        >
          프로필 관리
        </Link>
      </section>

      <ul className="px-5 mt-5 space-y-2 pb-6">
        {settings.map((s) => {
          const Icon = s.icon;
          return (
            <li key={s.to}>
              <Link to={s.to} className="flex items-center gap-3 p-4 rounded-2xl bg-surface border border-border active:bg-muted/40">
                <div className="size-10 rounded-xl bg-muted grid place-items-center text-foreground">
                  <Icon className="size-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold">{s.label}</div>
                  {s.desc && <div className="text-[11.5px] text-muted-foreground mt-0.5">{s.desc}</div>}
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          );
        })}
      </ul>
      <BottomNav />
    </AppShell>
  );
}


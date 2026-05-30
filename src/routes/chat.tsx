import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BottomNav } from "@/components/BottomNav";
import { Mascot } from "@/components/Mascot";
import { Send, Sparkles } from "lucide-react";
import { chatWithBot, N8nError } from "@/lib/n8n";

export const Route = createFileRoute("/chat")({
  component: Chat,
});

const suggestions = [
  "대체당은 많이 먹어도 괜찮나요?",
  "혈당 관리 중 간식 고르는 법은?",
  "나트륨이 높으면 왜 조심해야 해요?",
  "단백질 하루 권장량은요?",
];

interface Msg { role: "user" | "ai"; text: string }

function extractReply(res: unknown): string {
  // DEBUG: n8n 응답이 그대로 표시되는 이슈 추적용
  console.log("[chat] extractReply raw response:", res);
  console.log("[chat] typeof:", typeof res, "isArray:", Array.isArray(res));
  try {
    console.log("[chat] JSON:", JSON.stringify(res, null, 2));
  } catch {
    console.log("[chat] (응답을 JSON으로 직렬화할 수 없음)");
  }
  if (res && typeof res === "object") {
    console.log("[chat] keys:", Object.keys(res as Record<string, unknown>));
  }

  if (!res) return "응답을 받지 못했어요.";
  if (typeof res === "string") return res;
  if (typeof res === "object") {
    const r = res as Record<string, unknown>;
    const v = r.reply ?? r.text ?? r.message ?? r.output ?? r.answer;
    if (typeof v === "string") return v;
  }
  return JSON.stringify(res);
}

function formatReply(text: string): string {
  let t = text.replace(/\r\n/g, "\n");
  // strip code fences
  t = t.replace(/```[\s\S]*?```/g, (m) => m.replace(/```\w*\n?|```/g, ""));
  // remove inline code backticks
  t = t.replace(/`([^`]+)`/g, "$1");
  // images ![alt](url) -> alt
  t = t.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
  // links [text](url) -> text
  t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  // bold/italic
  t = t.replace(/\*\*\*([^*]+)\*\*\*/g, "$1");
  t = t.replace(/\*\*([^*]+)\*\*/g, "$1");
  t = t.replace(/\*([^*]+)\*/g, "$1");
  t = t.replace(/___([^_]+)___/g, "$1");
  t = t.replace(/__([^_]+)__/g, "$1");
  t = t.replace(/(^|\s)_([^_]+)_/g, "$1$2");
  // strikethrough
  t = t.replace(/~~([^~]+)~~/g, "$1");
  // blockquote
  t = t.replace(/^\s*>\s?/gm, "");
  // headings
  t = t.replace(/^\s*#{1,6}\s+/gm, "");
  // horizontal rules
  t = t.replace(/^\s*([-*_])\1{2,}\s*$/gm, "");
  // list markers
  t = t.replace(/^\s*[-*+]\s+/gm, "");
  t = t.replace(/^\s*\d+[.)]\s+/gm, "");
  // collapse 3+ newlines and trim each line
  const paragraphs = t
    .split(/\n{2,}/)
    .map((p) =>
      p
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .join(" ")
    )
    .filter(Boolean);
  return paragraphs.join("\n\n");
}

function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const send = async (text: string) => {
    if (!text.trim() || sending) return;
    const userMsg: Msg = { role: "user", text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setSending(true);
    try {
      const res = await chatWithBot({ message: text, history: messages });
      setMessages((m) => [...m, { role: "ai", text: extractReply(res) }]);
    } catch (e) {
      const msg = e instanceof N8nError ? e.message : "응답을 받지 못했어요.";
      setMessages((m) => [...m, { role: "ai", text: msg }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell withBottomNav>
      <header className="px-5 pt-4 pb-3 flex items-center gap-3 border-b border-border">
        <Mascot size={40} />
        <div>
          <div className="text-[18px] font-bold">픽잇 AI 코치</div>
        </div>
      </header>

      <div className="flex-1 px-5 py-5 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="space-y-5">
            <div className="flex flex-col items-center text-center gap-3 py-6">
              <Mascot size={80} />
              <h2 className="text-[17px] font-extrabold">무엇이든 물어보세요</h2>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                성분, 목표, 대체 제품까지<br />픽잇이 친절히 알려드릴게요
              </p>
            </div>
            <div>
              <div className="text-[12px] font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <Sparkles className="size-3" /> 추천 질문
              </div>
              <ul className="space-y-2">
                {suggestions.map((q) => (
                  <li key={q}>
                    <button
                      onClick={() => send(q)}
                      className="w-full text-left p-3.5 rounded-2xl bg-surface border border-border text-[13.5px] font-medium active:bg-muted"
                    >
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
              {m.role === "ai" && <Mascot size={28} className="mt-1 shrink-0" />}
              <div
                className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-[13.5px] leading-relaxed whitespace-pre-line ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-surface border border-border rounded-bl-md"
                }`}
              >
                {m.role === "ai" ? formatReply(m.text) : m.text}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-4 pb-24 pt-2 sticky bottom-0 bg-gradient-to-t from-background via-background to-background/0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 p-1.5 rounded-full bg-surface border border-border shadow-[var(--shadow-soft)]"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="픽잇에게 물어보세요"
            className="flex-1 bg-transparent outline-none px-3 text-[14px]"
          />
          <button
            type="submit"
            aria-label="보내기"
            className="size-10 rounded-full bg-primary text-primary-foreground grid place-items-center disabled:opacity-50"
            disabled={!input.trim() || sending}
          >
            <Send className="size-4" />
          </button>
        </form>
      </div>
      <BottomNav />
    </AppShell>
  );
}

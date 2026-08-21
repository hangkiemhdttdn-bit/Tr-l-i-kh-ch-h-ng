"use client";

import React from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { qnaEntries } from "@/lib/mock-data";

interface Message {
  from: "bot" | "user";
  text: string;
}

// Vài câu hỏi gợi ý, lấy từ chính bộ QnA mà chatbot được phép trả lời.
const quickQuestions = qnaEntries.slice(0, 4).map((e) => e.question);

const greeting: Message = {
  from: "bot",
  text: "Chào bạn! Mình là trợ lý ảo của DuHoc24, bạn cần hỗ trợ gì về hồ sơ du học?",
};

// Khóa lưu id cuộc hội thoại trong localStorage → không mất khi tắt trình duyệt.
const CONV_KEY = "duhoc24_chat_conversation_id";

export function ChatWidget() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([greeting]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Khi mở trang: nếu đã có id cuộc hội thoại cũ, nạp lại lịch sử TỪ SUPABASE
  // (qua route server, không đọc trực tiếp DB) thay vì mất trắng như trước.
  React.useEffect(() => {
    const saved = localStorage.getItem(CONV_KEY);
    if (!saved) return;
    fetch(`/api/chat?conversationId=${encodeURIComponent(saved)}`)
      .then((r) => r.json())
      .then((d) => {
        setConversationId(saved);
        if (Array.isArray(d.messages) && d.messages.length > 0) {
          setMessages([greeting, ...(d.messages as Message[])]);
        }
      })
      .catch(() => {});
  }, []);

  // Luôn cuộn xuống tin nhắn mới nhất.
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const nextMessages: Message[] = [...messages, { from: "user", text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, conversationId }),
      });
      const data = await res.json().catch(() => ({}));
      // Lưu lại id cuộc hội thoại server trả về để các lượt sau ghi cùng một chỗ.
      if (typeof data?.conversationId === "string" && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
        localStorage.setItem(CONV_KEY, data.conversationId);
      }
      const reply =
        res.ok && data?.text
          ? (data.text as string)
          : (data?.error as string) ??
            "Xin lỗi, hiện mình chưa trả lời được. Bạn thử lại sau ít phút nhé.";
      setMessages((prev) => [...prev, { from: "bot", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Mất kết nối tới máy chủ, bạn kiểm tra mạng rồi thử lại giúp mình nhé." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border bg-card shadow-xl shadow-black/10 ring-1 ring-foreground/6.5 sm:w-96">
          <div className="flex items-center justify-between border-b bg-primary px-4 py-3 text-primary-foreground">
            <div>
              <p className="text-sm font-medium">Hỏi đáp nhanh</p>
              <p className="text-xs opacity-80">Thường trả lời trong vài phút</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Đóng khung chat"
              className="flex size-7 items-center justify-center rounded-full hover:bg-white/10"
            >
              <X className="size-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn("flex", m.from === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap",
                    m.from === "user"
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-muted text-foreground",
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5">
                  <span className="size-1.5 animate-bounce rounded-full bg-foreground/40 [animation-delay:-0.3s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-foreground/40 [animation-delay:-0.15s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-foreground/40" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t p-3">
            <div className="flex flex-wrap gap-1.5 pb-2">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                  className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground duration-150 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                placeholder="Nhập câu hỏi của bạn..."
                className="h-9 flex-1 rounded-full border border-input bg-transparent px-3.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
              />
              <Button
                type="submit"
                size="icon"
                className="shrink-0"
                aria-label="Gửi"
                disabled={loading || !input.trim()}
              >
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Đóng khung chat" : "Mở khung chat hỏi đáp"}
        className="ml-auto flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/20 duration-150 hover:brightness-105 active:scale-95"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </div>
  );
}

import { ChevronDown, MessageSquare } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { getConversations } from "@/lib/supabase";
import { cn } from "@/lib/utils";

// Luôn đọc dữ liệu mới nhất từ Supabase (không cache tĩnh).
export const dynamic = "force-dynamic";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminConversationsPage() {
  const conversations = await getConversations();

  return (
    <>
      <AdminPageHeader
        title="Hội thoại"
        description="Lịch sử trò chuyện của khách với chatbot trên trang chủ, lưu từ Supabase. Bấm vào một dòng để xem chi tiết từng tin nhắn."
      />

      {conversations.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
          <MessageSquare className="size-8 opacity-40" />
          <p>Chưa có cuộc trò chuyện nào được lưu.</p>
          <p className="text-sm">Khi khách chat trên trang chủ, hội thoại sẽ hiện ở đây.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => {
            const firstUser = conv.messages.find((m) => m.from === "user");
            return (
              <Card key={conv.id} className="overflow-hidden p-0">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 hover:bg-muted/40">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {firstUser?.text ?? "(chưa có tin nhắn)"}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {conv.channel} · {conv.messages.length} tin nhắn ·{" "}
                        {formatDateTime(conv.started_at)}
                      </p>
                    </div>
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>

                  <div className="space-y-3 border-t bg-muted/30 p-4">
                    {conv.messages.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground">
                        Hội thoại này chưa có tin nhắn.
                      </p>
                    ) : (
                      conv.messages.map((m, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex",
                            m.from === "user" ? "justify-end" : "justify-start",
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap",
                              m.from === "user"
                                ? "rounded-br-sm bg-primary text-primary-foreground"
                                : "rounded-bl-sm border bg-card text-foreground",
                            )}
                          >
                            {m.text}
                            <span className="mt-1 block text-[10px] opacity-60">
                              {formatTime(m.created_at)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </details>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

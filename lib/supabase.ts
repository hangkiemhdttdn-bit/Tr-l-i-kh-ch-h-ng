// Tiện ích Supabase phía SERVER cho việc lưu lịch sử chat.
// Dùng createAdminClient (secret key) — VƯỢT RLS và CHỈ được import ở server
// (route handler, server component). TUYỆT ĐỐI không import vào code client:
// secret key không bao giờ được lộ ra trình duyệt.
import { createAdminClient } from "@supabase/server/core";
import type { Database } from "@/lib/database.types";

// Khởi tạo lười + cache. Trả null nếu chưa cấu hình env, để chatbot vẫn chạy
// được ngay cả khi Supabase chưa sẵn sàng (không làm hỏng trải nghiệm chat).
let adminClient: ReturnType<typeof createAdminClient<Database>> | null = null;

function getAdmin() {
  if (adminClient) return adminClient;
  try {
    adminClient = createAdminClient<Database>(); // đọc SUPABASE_URL + SUPABASE_SECRET_KEY
    return adminClient;
  } catch (e) {
    console.error("Không khởi tạo được Supabase admin client:", (e as Error).message);
    return null;
  }
}

export interface DbMessage {
  from: "bot" | "user";
  text: string;
}

// Tạo một cuộc hội thoại mới, trả về id (hoặc null nếu lỗi/chưa cấu hình).
export async function createConversation(): Promise<string | null> {
  const admin = getAdmin();
  if (!admin) return null;
  const { data, error } = await admin
    .from("conversations")
    .insert({ channel: "Web" })
    .select("id")
    .single();
  if (error) {
    console.error("Lỗi tạo conversation:", error.message);
    return null;
  }
  return data.id as string;
}

// Kiểm tra một cuộc hội thoại có còn tồn tại không (tránh ghi vào id đã bị xoá).
export async function conversationExists(id: string): Promise<boolean> {
  const admin = getAdmin();
  if (!admin) return false;
  const { data, error } = await admin
    .from("conversations")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("Lỗi kiểm tra conversation:", error.message);
    return false;
  }
  return !!data;
}

// Ghi các tin nhắn vào một cuộc hội thoại.
export async function saveMessages(
  conversationId: string,
  messages: DbMessage[],
): Promise<void> {
  const admin = getAdmin();
  if (!admin || messages.length === 0) return;
  const rows = messages.map((m) => ({
    conversation_id: conversationId,
    from: m.from,
    text: m.text,
  }));
  const { error } = await admin.from("messages").insert(rows);
  if (error) console.error("Lỗi lưu messages:", error.message);
}

export interface DbConversation {
  id: string;
  channel: string;
  started_at: string;
  messages: (DbMessage & { created_at: string })[];
}

// Lấy TẤT CẢ hội thoại kèm tin nhắn bên trong — dùng cho trang admin.
// Mới nhất lên đầu; tin nhắn trong mỗi hội thoại theo thứ tự thời gian.
export async function getConversations(): Promise<DbConversation[]> {
  const admin = getAdmin();
  if (!admin) return [];

  const { data: convs, error: e1 } = await admin
    .from("conversations")
    .select("id, channel, started_at")
    .order("started_at", { ascending: false });
  if (e1) {
    console.error("Lỗi đọc conversations:", e1.message);
    return [];
  }

  const { data: msgs, error: e2 } = await admin
    .from("messages")
    .select("conversation_id, from, text, created_at")
    .order("created_at", { ascending: true });
  if (e2) {
    console.error("Lỗi đọc messages:", e2.message);
    return [];
  }

  // Gom tin nhắn theo conversation_id.
  const byConv = new Map<string, DbConversation["messages"]>();
  for (const m of msgs ?? []) {
    const arr = byConv.get(m.conversation_id) ?? [];
    arr.push({ from: m.from, text: m.text, created_at: m.created_at });
    byConv.set(m.conversation_id, arr);
  }

  return (convs ?? []).map((c) => ({
    id: c.id,
    channel: c.channel,
    started_at: c.started_at,
    messages: byConv.get(c.id) ?? [],
  }));
}

// Lấy toàn bộ tin nhắn của một cuộc hội thoại (theo thứ tự thời gian).
export async function getMessages(conversationId: string): Promise<DbMessage[]> {
  const admin = getAdmin();
  if (!admin) return [];
  const { data, error } = await admin
    .from("messages")
    .select("from, text, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("Lỗi đọc messages:", error.message);
    return [];
  }
  return (data ?? []).map((r) => ({
    from: r.from as "bot" | "user",
    text: r.text as string,
  }));
}

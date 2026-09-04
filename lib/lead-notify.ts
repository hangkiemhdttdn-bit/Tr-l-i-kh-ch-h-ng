// Thông báo lead sang webhook Make.com khi khách để lại thông tin liên hệ.
// Chạy phía SERVER, gọi trong `after()` của route chat để không làm chậm phản hồi.

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;

interface Msg {
  from: "bot" | "user";
  text: string;
}

interface Lead {
  hoTen: string;
  email: string;
  soDienThoai: string;
  quocGia: string;
  bacHoc: string;
  nganhHoc: string;
  tomTat: string;
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
// SĐT Việt Nam: bắt đầu 0 hoặc +84, tổng 9-11 chữ số (sau khi bỏ dấu cách/gạch/chấm).
const PHONE_RE = /(?:\+?84|0)\d{8,10}/;

function hasContact(text: string): boolean {
  const compact = text.replace(/[\s.\-()]/g, "");
  return EMAIL_RE.test(text) || PHONE_RE.test(compact);
}

// Dùng Gemini Flash-Lite trích xuất thông tin lead thành JSON có cấu trúc.
async function extractLead(messages: Msg[]): Promise<Lead | null> {
  if (!GEMINI_API_KEY) return null;
  const transcript = messages
    .filter((m) => m.text?.trim())
    .map((m) => `${m.from === "user" ? "Khách" : "Trợ lý"}: ${m.text}`)
    .join("\n");

  const prompt = `Từ đoạn hội thoại tư vấn du học dưới đây, trích xuất thông tin khách hàng thành JSON với ĐÚNG các khoá sau: hoTen, email, soDienThoai, quocGia, bacHoc, nganhHoc, tomTat. Trường nào khách chưa cung cấp thì để chuỗi rỗng "". "tomTat" là một câu ngắn tóm tắt nhu cầu của khách. Chỉ trả về JSON, không thêm chữ nào khác.

HỘI THOẠI:
${transcript}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
          },
        }),
      },
    );
    if (!res.ok) {
      console.error("extractLead: Gemini lỗi", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const raw: string | undefined = data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("")
      .trim();
    if (!raw) return null;
    return JSON.parse(raw) as Lead;
  } catch (e) {
    console.error("extractLead lỗi:", (e as Error).message);
    return null;
  }
}

// Nếu khách vừa để lại thông tin liên hệ → bắn lead sang webhook Make.
// Gate bằng regex trên tin nhắn mới nhất để không gọi Gemini/webhook mỗi lượt.
export async function notifyLeadIfCaptured(
  messages: Msg[],
  conversationId: string | null,
): Promise<void> {
  if (!MAKE_WEBHOOK_URL) return;

  const lastUser = [...messages].reverse().find((m) => m.from === "user" && m.text?.trim());
  if (!lastUser || !hasContact(lastUser.text)) return;

  const lead = await extractLead(messages);
  if (!lead || (!lead.email && !lead.soDienThoai)) return;

  try {
    const r = await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        thoiGian: new Date().toISOString(),
        ...lead,
      }),
    });
    if (!r.ok) {
      console.error("Webhook Make trả lỗi:", r.status, await r.text());
    } else {
      console.log("Đã gửi lead sang Make cho conversation", conversationId);
    }
  } catch (e) {
    console.error("Gửi webhook Make lỗi:", (e as Error).message);
  }
}

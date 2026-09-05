// Thông báo lead sang webhook Make.com khi khách để lại thông tin liên hệ.
// Chạy phía SERVER, gọi trong `after()` của route chat để không làm chậm phản hồi.
// Payload gửi đi CHỈ gồm 4 trường: email, soDienThoai, goi, gia.
import { servicePackages } from "@/lib/mock-data";

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;
const MAKE_APPROVE_WEBHOOK_URL = process.env.MAKE_APPROVE_WEBHOOK_URL;

interface Msg {
  from: "bot" | "user";
  text: string;
}

// Gemini chỉ trích 3 trường; `gia` do code tự map từ `goi` để không bịa giá.
interface ExtractedLead {
  email: string;
  soDienThoai: string;
  goi: string;
}

// Payload chuẩn gửi sang Make: 4 trường.
export interface LeadPayload {
  email: string;
  soDienThoai: string;
  goi: string;
  gia: string;
}

// Payload khi DUYỆT: kèm thông tin đăng nhập ảo cho khách.
export interface ApprovePayload extends LeadPayload {
  linkDangNhap: string;
  matKhau: string;
}

// POST payload sang 1 webhook Make. Trả true nếu Make nhận (2xx).
async function postWebhook(
  url: string | undefined,
  payload: LeadPayload,
  label: string,
): Promise<boolean> {
  if (!url) {
    console.error(`Chưa cấu hình ${label}`);
    return false;
  }
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      console.error(`Webhook ${label} lỗi:`, r.status, await r.text());
      return false;
    }
    console.log(`Đã gửi tới ${label}:`, payload.email || payload.soDienThoai);
    return true;
  } catch (e) {
    console.error(`Gửi ${label} lỗi:`, (e as Error).message);
    return false;
  }
}

// Webhook báo giá (khi khách để lại liên hệ qua form/chat).
export function sendLeadWebhook(payload: LeadPayload): Promise<boolean> {
  return postWebhook(MAKE_WEBHOOK_URL, payload, "MAKE_WEBHOOK_URL (báo giá)");
}

// Webhook khi admin DUYỆT yêu cầu → Make tạo tài khoản + gửi mail đăng nhập.
export function sendApproveWebhook(payload: ApprovePayload): Promise<boolean> {
  return postWebhook(MAKE_APPROVE_WEBHOOK_URL, payload, "MAKE_APPROVE_WEBHOOK_URL (duyệt)");
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
// SĐT Việt Nam: bắt đầu 0 hoặc +84, tổng 9-11 chữ số (sau khi bỏ dấu cách/gạch/chấm).
const PHONE_RE = /(?:\+?84|0)\d{8,10}/;

function hasContact(text: string): boolean {
  const compact = text.replace(/[\s.\-()]/g, "");
  return EMAIL_RE.test(text) || PHONE_RE.test(compact);
}

// Map tên gói → giá thật (định dạng VN), lấy từ servicePackages. Không khớp → "".
function priceForPackage(goi: string): string {
  const key = goi.trim().toLowerCase();
  const pkg = servicePackages.find((p) => p.name.toLowerCase() === key);
  return pkg ? `${pkg.price.toLocaleString("vi-VN")}₫` : "";
}

// Dùng Gemini Flash-Lite trích email, SĐT, và gói phù hợp.
async function extractLead(messages: Msg[]): Promise<ExtractedLead | null> {
  if (!GEMINI_API_KEY) return null;
  const transcript = messages
    .filter((m) => m.text?.trim())
    .map((m) => `${m.from === "user" ? "Khách" : "Trợ lý"}: ${m.text}`)
    .join("\n");

  const goiList = servicePackages.map((p) => p.name).join('", "');
  const prompt = `Từ đoạn hội thoại tư vấn du học dưới đây, trích xuất thông tin thành JSON với ĐÚNG 3 khoá: email, soDienThoai, goi.
- email, soDienThoai: lấy đúng như khách cung cấp; chưa có thì để "".
- goi: chọn MỘT gói dịch vụ phù hợp nhất với nhu cầu khách, chỉ được là "${goiList}". Gói "Cơ bản" cho khách hồ sơ đơn giản, tự lo được phần lớn; gói "Toàn diện" cho khách cần đồng hành trọn gói (tư vấn chọn trường, học bổng, phỏng vấn). Nếu chưa đủ thông tin để chắc chắn thì để "".
Chỉ trả về JSON, không thêm chữ nào khác.

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
    return JSON.parse(raw) as ExtractedLead;
  } catch (e) {
    console.error("extractLead lỗi:", (e as Error).message);
    return null;
  }
}

// Nếu khách vừa để lại thông tin liên hệ → bắn lead sang webhook Make.
// Gate bằng regex trên tin nhắn mới nhất để không gọi Gemini/webhook mỗi lượt.
// Payload CHỈ gồm: email, soDienThoai, goi, gia.
export async function notifyLeadIfCaptured(messages: Msg[]): Promise<void> {
  if (!MAKE_WEBHOOK_URL) return;

  const lastUser = [...messages].reverse().find((m) => m.from === "user" && m.text?.trim());
  if (!lastUser || !hasContact(lastUser.text)) return;

  const lead = await extractLead(messages);
  if (!lead || (!lead.email && !lead.soDienThoai)) return;

  await sendLeadWebhook({
    email: lead.email,
    soDienThoai: lead.soDienThoai,
    goi: lead.goi,
    gia: priceForPackage(lead.goi),
  });
}

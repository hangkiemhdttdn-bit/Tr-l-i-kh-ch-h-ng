# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> ⚠️ Xem `AGENTS.md` (được import ở trên): đây là **Next.js 16 với breaking changes**. Đọc guide trong `node_modules/next/dist/docs/` trước khi viết code Next.js — API và quy ước có thể khác với dữ liệu huấn luyện. Ví dụ đã thấy trong repo: `RootLayout` dùng type toàn cục `LayoutProps<"/">` (không tự import).

## Bối cảnh dự án

Repo mẫu (`website-mau`) cho **khoá lập trình 6 tuần**: dựng "Cổng Tiếp Nhận Hồ Sơ Du Học" (DuHoc24). **Phần lớn vẫn là UI tĩnh với dữ liệu mock viết cứng trong [`lib/mock-data.ts`](lib/mock-data.ts)** (chưa có database hay auth thật). Ngoại lệ đã làm: **chatbot ở trang chủ gọi Gemini thật** qua route `app/api/chat/route.ts` (tính năng Tuần 2 — xem mục "Chatbot Gemini" bên dưới).

Lộ trình dự kiến (xem `README.md` để biết chi tiết): Tuần 2 chatbot Gemini thật · Tuần 3 Supabase + form báo giá + deploy Vercel · Tuần 4 đọc/trích xuất hồ sơ giấy tờ · Tuần 5 tự động hoá Make.com · Tuần 6 auth magic link. Khi thêm tính năng, giữ nguyên cấu trúc types trong `mock-data.ts` làm hợp đồng dữ liệu để thay mock bằng nguồn thật.

## Lệnh thường dùng

```bash
npm run dev      # chạy dev server tại http://localhost:3000
npm run build    # build production
npm run start    # chạy bản đã build
npm run lint     # eslint (config: eslint.config.mjs, dùng eslint-config-next)
```

Chưa có test framework. Biến môi trường (tất cả server-side, KHÔNG `NEXT_PUBLIC_`):
- `GEMINI_API_KEY` (bắt buộc cho chatbot), `GEMINI_MODEL` (tuỳ chọn, mặc định `gemini-3.5-flash-lite`).
- Lưu lịch sử chat cần: `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (dùng key MỚI `sb_secret_...`, không phải service_role cũ). `SUPABASE_PUBLISHABLE_KEY`/`SUPABASE_JWKS_URL` để dành cho auth sau. Thiếu các biến này thì chatbot vẫn trả lời, chỉ không lưu lịch sử (degrade an toàn).
- `MAKE_WEBHOOK_URL` (tuỳ chọn): webhook Make.com nhận thông báo lead khi khách để lại email/SĐT (xem `lib/lead-notify.ts`). Thiếu thì bỏ qua, không ảnh hưởng chat.

## Kiến trúc

- **Next.js App Router** (thư mục `app/`) + TypeScript + Tailwind CSS v4 + React 19.
- **shadcn/ui** style `base-nova` trên nền **Base UI** (`@base-ui/react`) — KHÔNG phải Radix. Icon dùng `lucide-react`. Config ở `components.json`.
- Alias `@/*` trỏ về gốc repo (xem `tsconfig.json`). Ví dụ: `@/components`, `@/lib/utils`, `@/components/ui`.
- Ngôn ngữ mặc định tiếng Việt (`app/layout.tsx` đặt `lang="vi"`, font Be Vietnam Pro).

### Ba khu vực (route group theo thư mục)

| Vùng | Route | Layout |
|---|---|---|
| Landing | `/` | dùng `SiteHeader`/`SiteFooter`, các block trong `components/landing/` |
| Portal học viên | `/portal` | cổng nộp hồ sơ, `components/portal/` |
| Admin | `/admin/*` | `app/admin/layout.tsx` bọc sidebar; `/admin` redirect sang `/admin/requests` |

Điều hướng admin định nghĩa tập trung ở mảng `adminNavItems` trong [`components/admin/sidebar.tsx`](components/admin/sidebar.tsx) — thêm trang admin thì thêm mục ở đây.

### Quy ước dữ liệu & trạng thái

- Kiểu trạng thái dùng **key tiếng Việt không dấu** làm union type, ví dụ `DocStatus = "chua_nop" | "dang_xu_ly" | "hop_le" | "can_nop_lai"`, `RequestStatus`, `ServicePackage`. Định nghĩa trong `lib/mock-data.ts`.
- Việc map từ status → nhãn hiển thị/màu sắc/icon nằm **tập trung** trong [`components/status-badge.tsx`](components/status-badge.tsx) (`docStatusMeta`, `requestStatusMeta`, và các component `DocStatusBadge`/`RequestStatusBadge`). Đừng tự viết lại nhãn/màu rải rác — sửa ở đây.
- Gộp className bằng helper `cn()` trong [`lib/utils.ts`](lib/utils.ts) (`clsx` + `tailwind-merge`).

### Chatbot Gemini (trang chủ)

- Luồng: [`components/landing/chat-widget.tsx`](components/landing/chat-widget.tsx) (client) `fetch` POST tới [`app/api/chat/route.ts`](app/api/chat/route.ts) (route handler, server) → gọi REST API Gemini `generativelanguage.googleapis.com` bằng header `x-goog-api-key`.
- **Hành vi chatbot do `systemInstruction` viết thẳng trong `app/api/chat/route.ts` quyết định.** Hiện tại là một persona "Trợ lý Tư vấn Du học" dẫn dắt hội thoại có cấu trúc (hỏi nước → bậc học/ngành → giới thiệu dịch vụ → thu thập họ tên/email/SĐT → mời đặt lịch), mỗi lượt chỉ hỏi 1 câu; **muốn đổi cách bot trò chuyện thì sửa chuỗi `systemInstruction` này**. (Trước đây bot bị giới hạn cứng trong bộ QnA — đã bỏ.)
- `qnaEntries` (kiểu `QnaEntry`) trong [`lib/mock-data.ts`](lib/mock-data.ts) giờ **chỉ còn dùng cho các nút câu hỏi gợi ý** trong widget, không còn nhét vào `systemInstruction`.
- Body gửi lên: `{ messages: {from:"bot"|"user", text}[] }` (cả lịch sử hội thoại để giữ mạch). Route map `from` → `role` của Gemini (`user`/`model`) và bỏ các lượt `model` đứng đầu (Gemini yêu cầu lượt đầu là `user`).
- Lỗi từ Gemini (kể cả 401 do sai key) được `console.error` ở server; client chỉ hiển thị thông báo thân thiện. API key đọc từ `process.env.GEMINI_API_KEY`, không lộ ra client.

### Lưu lịch sử chat vào Supabase (server-only)

- **Dữ liệu riêng tư, chỉ server truy cập.** Trình duyệt KHÔNG đụng thẳng Supabase — luôn đi qua route Next.js. Helper [`lib/supabase.ts`](lib/supabase.ts) dùng `createAdminClient` (package `@supabase/server`, key MỚI `SUPABASE_SECRET_KEY`) nên **chỉ được import ở server**; secret key không bao giờ lộ ra client. Kiểu DB viết tay ở [`lib/database.types.ts`](lib/database.types.ts).
- **Bảo mật bằng RLS**: 2 bảng `conversations`/`messages` bật Row Level Security, KHÔNG có policy công khai → anon/publishable (trình duyệt) bị chặn hoàn toàn; secret key (admin) vượt RLS nên server đọc/ghi được. Bảng còn cần `grant ... to service_role`.
- **Luồng**: `POST /api/chat` sau khi Gemini đáp thì ghi câu hỏi + trả lời vào `messages` (tạo `conversation` nếu chưa có), trả `conversationId`. Client lưu `conversationId` vào `localStorage` (key `duhoc24_chat_conversation_id`) → không mất khi tắt trình duyệt. Khi mở lại, widget gọi `GET /api/chat?conversationId=...` để nạp lịch sử **từ Supabase** thay vì bộ nhớ tạm.
- Mọi thao tác DB bọc try/catch: Supabase lỗi thì chat vẫn trả lời bình thường.
- **Thông báo lead (Tuần 5)**: sau khi trả lời khách, route gọi `after()` (từ `next/server`) chạy nền `notifyLeadIfCaptured()` trong [`lib/lead-notify.ts`](lib/lead-notify.ts). Khi tin nhắn khách mới nhất có email/SĐT (gate bằng regex để không gọi mỗi lượt) → dùng Gemini trích xuất lead có cấu trúc → POST sang `MAKE_WEBHOOK_URL`. Chạy nền nên không làm chậm chat.
- **Trang admin** [`app/admin/conversations/page.tsx`](app/admin/conversations/page.tsx) là Server Component (`export const dynamic = "force-dynamic"`), gọi `getConversations()` đọc thẳng Supabase ở server rồi render danh sách hội thoại + chi tiết từng tin nhắn (dùng `<details>` gập/mở). Lưu ý: `/admin` hiện CHƯA có auth (để Tuần 6) — ai vào cũng xem được, cần khoá lại khi lên thật.

### UI primitives

`components/ui/` chứa các primitive shadcn (button, card, table, input, select…). Component nào cần state của client mới thêm `"use client"` (ví dụ sidebar dùng `usePathname`); mặc định là Server Component.

## Quy tắc Git

- Luôn xác nhận với người dùng trước khi push lên GitHub.
- Không bao giờ commit file `.env` (hay `.env.local`, `.env.*.local`) hoặc bất kỳ file nào chứa API key / secret. Chỉ `.env.example` (không có giá trị thật) được phép commit.

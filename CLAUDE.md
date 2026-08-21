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

Chưa có test framework. Biến môi trường: cần `GEMINI_API_KEY` trong `.env` để chatbot hoạt động (server-side, KHÔNG đặt tiền tố `NEXT_PUBLIC_`); tuỳ chọn `GEMINI_MODEL` để đổi model (mặc định `gemini-3.5-flash-lite`). Supabase/site URL sẽ dùng từ Tuần 3+ (xem `.env.example`).

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
- **Chatbot chỉ được trả lời trong phạm vi bộ QnA** `qnaEntries` (kiểu `QnaEntry`) trong [`lib/mock-data.ts`](lib/mock-data.ts). Route dựng `systemInstruction` từ chính mảng này và ràng buộc model không thêm thông tin ngoài phạm vi. **Muốn đổi câu hỏi/câu trả lời thì sửa `qnaEntries`** — cả chatbot lẫn các nút gợi ý trong widget đều lấy từ đó, không viết lặp.
- Body gửi lên: `{ messages: {from:"bot"|"user", text}[] }` (cả lịch sử hội thoại để giữ mạch). Route map `from` → `role` của Gemini (`user`/`model`) và bỏ các lượt `model` đứng đầu (Gemini yêu cầu lượt đầu là `user`).
- Lỗi từ Gemini (kể cả 401 do sai key) được `console.error` ở server; client chỉ hiển thị thông báo thân thiện. API key đọc từ `process.env.GEMINI_API_KEY`, không lộ ra client.

### UI primitives

`components/ui/` chứa các primitive shadcn (button, card, table, input, select…). Component nào cần state của client mới thêm `"use client"` (ví dụ sidebar dùng `usePathname`); mặc định là Server Component.

## Quy tắc Git

- Luôn xác nhận với người dùng trước khi push lên GitHub.
- Không bao giờ commit file `.env` (hay `.env.local`, `.env.*.local`) hoặc bất kỳ file nào chứa API key / secret. Chỉ `.env.example` (không có giá trị thật) được phép commit.

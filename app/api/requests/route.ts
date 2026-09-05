import { servicePackages } from "@/lib/mock-data";
import { setRequestStatus } from "@/lib/supabase";
import { sendApproveWebhook } from "@/lib/lead-notify";

// Sinh chuỗi ngẫu nhiên (token / mật khẩu tạm) — dùng cho tài khoản đăng nhập ảo.
function randomToken(len: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

// Admin Duyệt / Từ chối một yêu cầu. Khi DUYỆT → bắn webhook để Make
// tạo tài khoản đăng nhập + gửi mail cho khách.
export async function POST(request: Request) {
  let body: { id?: string; action?: "approve" | "reject" };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body không hợp lệ" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return Response.json({ error: "Thiếu id" }, { status: 400 });
  if (body.action !== "approve" && body.action !== "reject") {
    return Response.json({ error: "action không hợp lệ" }, { status: 400 });
  }

  const status = body.action === "approve" ? "da_duyet" : "tu_choi";
  const req = await setRequestStatus(id, status);
  if (!req) {
    return Response.json(
      { error: "Không cập nhật được yêu cầu (kiểm tra Supabase)" },
      { status: 500 },
    );
  }

  // Chỉ khi DUYỆT mới tạo tài khoản đăng nhập (ảo) + gửi mail cho khách.
  if (body.action === "approve") {
    const pkg = servicePackages.find((p) => p.id === req.packageId);
    // Thông tin đăng nhập ảo — thay bằng auth thật ở Tuần 6.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const linkDangNhap = `${siteUrl}/portal?token=${randomToken(24)}`;
    const matKhau = randomToken(8);
    await sendApproveWebhook({
      email: req.email,
      soDienThoai: req.phone,
      goi: pkg?.name ?? "",
      gia: pkg ? `${pkg.price.toLocaleString("vi-VN")}₫` : "",
      linkDangNhap,
      matKhau,
    });
  }

  return Response.json({ ok: true, status });
}

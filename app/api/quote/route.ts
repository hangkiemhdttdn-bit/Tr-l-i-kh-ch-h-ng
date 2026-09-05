import { servicePackages, type ServicePackage } from "@/lib/mock-data";
import { sendLeadWebhook } from "@/lib/lead-notify";
import { saveRequest } from "@/lib/supabase";

// Nhận dữ liệu form "Nhận báo giá" và bắn 4 trường (email, soDienThoai, goi, gia)
// sang webhook Make. Chạy server-side để không lộ MAKE_WEBHOOK_URL ra trình duyệt.
export async function POST(request: Request) {
  let body: { email?: string; phone?: string; packageId?: ServicePackage };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body không hợp lệ" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!email || !phone) {
    return Response.json(
      { error: "Thiếu email hoặc số điện thoại" },
      { status: 400 },
    );
  }

  const pkg = servicePackages.find((p) => p.id === body.packageId);
  const goi = pkg?.name ?? "";
  const gia = pkg ? `${pkg.price.toLocaleString("vi-VN")}₫` : "";

  // Lưu yêu cầu vào Supabase để admin duyệt sau (bọc try/catch ở tầng DB).
  if (pkg) {
    await saveRequest({ email, phone, packageId: pkg.id, price: pkg.price });
  }

  const ok = await sendLeadWebhook({ email, soDienThoai: phone, goi, gia });

  return Response.json({ ok });
}

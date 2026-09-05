import { servicePackages } from "@/lib/mock-data";
import { setRequestStatus } from "@/lib/supabase";
import { sendApproveWebhook } from "@/lib/lead-notify";

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

  // Chỉ khi DUYỆT mới tạo tài khoản + gửi mail đăng nhập.
  if (body.action === "approve") {
    const pkg = servicePackages.find((p) => p.id === req.packageId);
    await sendApproveWebhook({
      email: req.email,
      soDienThoai: req.phone,
      goi: pkg?.name ?? "",
      gia: pkg ? `${pkg.price.toLocaleString("vi-VN")}₫` : "",
    });
  }

  return Response.json({ ok: true, status });
}

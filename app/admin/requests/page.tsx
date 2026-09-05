import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { RequestStatusBadge } from "@/components/status-badge";
import { RequestActions } from "@/components/admin/request-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { servicePackages, type RequestStatus } from "@/lib/mock-data";
import { getRequests } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function formatVnd(value: number) {
  return value.toLocaleString("vi-VN") + "₫";
}

function packageLabel(id: string) {
  return servicePackages.find((p) => p.id === id)?.name ?? id;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminRequestsPage() {
  const requests = await getRequests();

  return (
    <>
      <AdminPageHeader
        title="Yêu cầu"
        description="Yêu cầu báo giá khách gửi từ trang chủ. Bấm ✓ để duyệt — hệ thống tạo tài khoản và gửi mail đăng nhập cho khách."
      />

      <Card>
        {requests.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <p>Chưa có yêu cầu nào.</p>
            <p className="text-sm">Khi khách điền form &quot;Nhận báo giá&quot;, yêu cầu sẽ hiện ở đây.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email khách</TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead>Gói dịch vụ</TableHead>
                <TableHead>Báo giá</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.email}</TableCell>
                  <TableCell>{req.phone}</TableCell>
                  <TableCell>{packageLabel(req.packageId)}</TableCell>
                  <TableCell>{formatVnd(req.price)}</TableCell>
                  <TableCell>
                    <RequestStatusBadge status={req.status as RequestStatus} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(req.createdAt)}
                  </TableCell>
                  <TableCell>
                    <RequestActions id={req.id} status={req.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}

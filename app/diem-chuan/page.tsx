import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSchools } from "@/lib/supabase";

// Luôn đọc dữ liệu mới nhất từ Supabase.
export const dynamic = "force-dynamic";

export default async function DiemChuanPage() {
  const schools = await getSchools();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 pb-16 pt-28">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Điểm chuẩn trường</h1>
          <p className="mt-2 text-muted-foreground">
            Yêu cầu điểm học tập và IELTS tối thiểu của các trường tham chiếu. Dùng để
            đối chiếu xem hồ sơ của bạn đạt hay chưa đạt.
          </p>
        </div>

        <Card>
          {schools.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <p>Chưa có dữ liệu điểm chuẩn.</p>
              <p className="text-sm">Vui lòng quay lại sau nhé.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên trường</TableHead>
                  <TableHead>Quốc gia</TableHead>
                  <TableHead>Điểm học tập tối thiểu</TableHead>
                  <TableHead>IELTS tối thiểu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">{school.name}</TableCell>
                    <TableCell>{school.country}</TableCell>
                    <TableCell>{school.minGpa.toFixed(1)}</TableCell>
                    <TableCell>{school.minIelts.toFixed(1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}

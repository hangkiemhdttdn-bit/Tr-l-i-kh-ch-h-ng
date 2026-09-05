"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Nút Duyệt / Từ chối cho một yêu cầu (gọi /api/requests rồi làm mới trang).
export function RequestActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState<null | "approve" | "reject">(null);

  async function act(action: "approve" | "reject") {
    if (loading) return;
    setLoading(action);
    try {
      await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      router.refresh(); // đọc lại Server Component với trạng thái mới
    } catch {
      // lỗi đã log ở server
    } finally {
      setLoading(null);
    }
  }

  // Đã xử lý rồi thì không cho thao tác nữa.
  if (status !== "cho_duyet") {
    return <span className="text-xs text-muted-foreground">Đã xử lý</span>;
  }

  return (
    <div className="flex justify-end gap-2">
      <Button
        size="icon-sm"
        variant="outline"
        aria-label="Duyệt"
        disabled={!!loading}
        onClick={() => act("approve")}
      >
        <Check className="size-3.5" />
      </Button>
      <Button
        size="icon-sm"
        variant="outline"
        aria-label="Từ chối"
        disabled={!!loading}
        onClick={() => act("reject")}
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}

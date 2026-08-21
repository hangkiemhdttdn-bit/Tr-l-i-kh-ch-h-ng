// PostToolUse hook (Write|Edit): nhắc Claude rà soát/cập nhật CLAUDE.md
// khi vừa sửa một file mã nguồn có thể ảnh hưởng tới tài liệu.
// Đọc JSON của hook trên stdin, in ra additionalContext nếu cần.
import { readFileSync } from "node:fs";

let raw = "";
try {
  raw = readFileSync(0, "utf8");
} catch {
  process.exit(0);
}

let data = {};
try {
  data = JSON.parse(raw || "{}");
} catch {
  process.exit(0);
}

const fp =
  data?.tool_input?.file_path ||
  data?.tool_response?.filePath ||
  "";
const norm = String(fp).replace(/\\/g, "/");

// Chỉ nhắc với file mã nguồn trong app/ components/ lib/ — nơi thay đổi
// dễ khiến CLAUDE.md (lệnh, kiến trúc, route, quy ước dữ liệu) lỗi thời.
// Bỏ qua file vendored (node_modules, .next).
const isVendored = /(^|\/)(node_modules|\.next)\//.test(norm);
const isSource =
  /\.(ts|tsx)$/.test(norm) && /(^|\/)(app|components|lib)\//.test(norm) && !isVendored;
// Không tự nhắc khi chính tài liệu đang được sửa.
const isDoc = /(CLAUDE|AGENTS)\.md$/i.test(norm);

if (isSource && !isDoc) {
  const reminder =
    `Bạn vừa sửa file mã nguồn: ${norm}. ` +
    `Hãy rà soát nhanh xem thay đổi này có làm CLAUDE.md lỗi thời không ` +
    `(lệnh build/lint/test, kiến trúc, danh sách route, quy ước types/trạng thái trong lib/mock-data.ts, ` +
    `mục điều hướng adminNavItems, cấu trúc thư mục). ` +
    `Nếu có, cập nhật CLAUDE.md cho khớp. Nếu không ảnh hưởng gì thì bỏ qua — đừng sửa CLAUDE.md một cách không cần thiết.`;

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: reminder,
      },
      suppressOutput: true,
    }),
  );
}

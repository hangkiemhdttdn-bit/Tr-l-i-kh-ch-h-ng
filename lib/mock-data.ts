// Toàn bộ dữ liệu trong file này là dữ liệu giả (mock), viết cứng để dựng UI.
// Học viên sẽ thay thế bằng dữ liệu thật từ Supabase ở các tuần sau.

export type DocStatus = "chua_nop" | "dang_xu_ly" | "hop_le" | "can_nop_lai";

export type RequestStatus = "cho_duyet" | "da_duyet" | "tu_choi";

export type ServicePackage = "co_ban" | "toan_dien";

export interface School {
  id: string;
  name: string;
  country: string;
  minGpa: number;
  minIelts: number;
}

export const countries = [
  "Mỹ",
  "Anh",
  "Úc",
  "Canada",
  "Hàn Quốc",
  "Nhật Bản",
] as const;

export const schools: School[] = [
  {
    id: "sch_01",
    name: "University of Toronto",
    country: "Canada",
    minGpa: 8.0,
    minIelts: 6.5,
  },
  {
    id: "sch_02",
    name: "RMIT University",
    country: "Úc",
    minGpa: 7.0,
    minIelts: 6.0,
  },
  {
    id: "sch_03",
    name: "University of Manchester",
    country: "Anh",
    minGpa: 7.5,
    minIelts: 6.5,
  },
  {
    id: "sch_04",
    name: "Arizona State University",
    country: "Mỹ",
    minGpa: 6.5,
    minIelts: 6.0,
  },
  {
    id: "sch_05",
    name: "Yonsei University",
    country: "Hàn Quốc",
    minGpa: 8.5,
    minIelts: 7.0,
  },
];

export interface ServiceOption {
  id: ServicePackage;
  name: string;
  price: number;
  description: string;
  benefits: string[];
}

export const servicePackages: ServiceOption[] = [
  {
    id: "co_ban",
    name: "Cơ bản",
    price: 18_000_000,
    description: "Phù hợp nếu hồ sơ của bạn đơn giản và đã chuẩn bị sẵn phần lớn giấy tờ.",
    benefits: [
      "Đối chiếu điểm chuẩn tự động",
      "Kiểm tra hợp lệ giấy tờ (bảng điểm, IELTS, CMND/hộ chiếu)",
      "Hỗ trợ qua email trong 24h",
      "1 lần nộp lại hồ sơ miễn phí",
    ],
  },
  {
    id: "toan_dien",
    name: "Toàn diện",
    price: 45_000_000,
    description: "Đồng hành trọn gói từ tư vấn trường đến nộp hồ sơ.",
    benefits: [
      "Toàn bộ quyền lợi gói Cơ bản",
      "Tư vấn chọn trường 1:1 với chuyên viên",
      "Rà soát hồ sơ không giới hạn số lần",
      "Hỗ trợ ưu tiên qua điện thoại + email",
      "Theo dõi tiến độ xét duyệt hằng tuần",
    ],
  },
];

export interface AdmissionRequest {
  id: string;
  customerName: string;
  package: ServicePackage;
  quote: number;
  status: RequestStatus;
  createdAt: string;
}

export const admissionRequests: AdmissionRequest[] = [
  {
    id: "req_2101",
    customerName: "Trần Thị Bích",
    package: "toan_dien",
    quote: 45_000_000,
    status: "cho_duyet",
    createdAt: "2026-08-06 08:20",
  },
  {
    id: "req_2100",
    customerName: "Đỗ Ngọc Lan",
    package: "toan_dien",
    quote: 45_000_000,
    status: "cho_duyet",
    createdAt: "2026-08-05 09:12",
  },
  {
    id: "req_2099",
    customerName: "Lê Văn Hùng",
    package: "co_ban",
    quote: 18_000_000,
    status: "da_duyet",
    createdAt: "2026-08-04 14:30",
  },
  {
    id: "req_2098",
    customerName: "Phạm Thu Hà",
    package: "toan_dien",
    quote: 45_000_000,
    status: "da_duyet",
    createdAt: "2026-08-03 10:05",
  },
  {
    id: "req_2097",
    customerName: "Nguyễn Đức Anh",
    package: "co_ban",
    quote: 18_000_000,
    status: "tu_choi",
    createdAt: "2026-08-02 16:47",
  },
];

export interface StudentProfile {
  id: string;
  studentName: string;
  email: string;
  submittedAt: string;
  docs: {
    transcript: DocStatus;
    ielts: DocStatus;
    identity: DocStatus;
  };
  matchedSchools: number;
  totalSchools: number;
}

export const studentProfiles: StudentProfile[] = [
  {
    id: "stu_501",
    studentName: "Nguyễn Minh Anh",
    email: "minhanh.nguyen@example.com",
    submittedAt: "2026-08-01",
    docs: { transcript: "hop_le", ielts: "dang_xu_ly", identity: "can_nop_lai" },
    matchedSchools: 2,
    totalSchools: 5,
  },
  {
    id: "stu_502",
    studentName: "Vũ Thị Mai",
    email: "mai.vu@example.com",
    submittedAt: "2026-07-30",
    docs: { transcript: "hop_le", ielts: "hop_le", identity: "hop_le" },
    matchedSchools: 3,
    totalSchools: 5,
  },
  {
    id: "stu_503",
    studentName: "Hoàng Gia Bảo",
    email: "bao.hoang@example.com",
    submittedAt: "2026-08-02",
    docs: { transcript: "hop_le", ielts: "hop_le", identity: "dang_xu_ly" },
    matchedSchools: 1,
    totalSchools: 5,
  },
  {
    id: "stu_504",
    studentName: "Trịnh Thu Trang",
    email: "trang.trinh@example.com",
    submittedAt: "2026-08-04",
    docs: { transcript: "can_nop_lai", ielts: "hop_le", identity: "hop_le" },
    matchedSchools: 0,
    totalSchools: 5,
  },
  {
    id: "stu_505",
    studentName: "Bùi Anh Tuấn",
    email: "tuan.bui@example.com",
    submittedAt: "2026-08-05",
    docs: { transcript: "dang_xu_ly", ielts: "dang_xu_ly", identity: "dang_xu_ly" },
    matchedSchools: 0,
    totalSchools: 5,
  },
];

export interface ChatMessage {
  from: "bot" | "user";
  text: string;
  time: string;
}

export interface Conversation {
  id: string;
  channel: "Web";
  messageCount: number;
  startedAt: string;
  messages: ChatMessage[];
}

export const conversations: Conversation[] = [
  {
    id: "conv_2081",
    channel: "Web",
    messageCount: 8,
    startedAt: "2026-08-06 09:03",
    messages: [
      { from: "bot", text: "Chào bạn! Mình có thể giúp gì cho hồ sơ du học của bạn?", time: "09:03" },
      { from: "user", text: "Gói Toàn diện có gì khác gói Cơ bản vậy ạ?", time: "09:04" },
      { from: "bot", text: "Gói Toàn diện gồm tư vấn chọn trường 1:1, rà soát hồ sơ không giới hạn và hỗ trợ ưu tiên qua điện thoại.", time: "09:04" },
    ],
  },
  {
    id: "conv_2080",
    channel: "Web",
    messageCount: 4,
    startedAt: "2026-08-05 20:15",
    messages: [
      { from: "bot", text: "Chào bạn! Mình có thể giúp gì cho hồ sơ du học của bạn?", time: "20:15" },
      { from: "user", text: "Bao lâu thì có kết quả đối chiếu điểm chuẩn?", time: "20:16" },
    ],
  },
  {
    id: "conv_2079",
    channel: "Web",
    messageCount: 12,
    startedAt: "2026-08-05 11:42",
    messages: [
      { from: "bot", text: "Chào bạn! Mình có thể giúp gì cho hồ sơ du học của bạn?", time: "11:42" },
      { from: "user", text: "Em cần chuẩn bị giấy tờ gì để nộp hồ sơ?", time: "11:43" },
      { from: "bot", text: "Bạn cần bảng điểm (PDF), ảnh chứng chỉ IELTS và ảnh CMND/CCCD hoặc hộ chiếu.", time: "11:43" },
    ],
  },
  {
    id: "conv_2078",
    channel: "Web",
    messageCount: 3,
    startedAt: "2026-08-04 18:57",
    messages: [
      { from: "bot", text: "Chào bạn! Mình có thể giúp gì cho hồ sơ du học của bạn?", time: "18:57" },
      { from: "user", text: "Chi phí dịch vụ là bao nhiêu?", time: "18:58" },
    ],
  },
  {
    id: "conv_2077",
    channel: "Web",
    messageCount: 6,
    startedAt: "2026-08-03 13:21",
    messages: [
      { from: "bot", text: "Chào bạn! Mình có thể giúp gì cho hồ sơ du học của bạn?", time: "13:21" },
      { from: "user", text: "Dịch vụ này gồm những gì ạ?", time: "13:22" },
    ],
  },
];

// Bộ hỏi–đáp (QnA) chatbot được phép trả lời. Chatbot chỉ được dựa trên
// đúng nội dung này, không tự thêm thông tin ngoài phạm vi. Đây cũng là
// nguồn để dựng `systemInstruction` khi gọi Gemini (xem app/api/chat/route.ts).
export interface QnaEntry {
  question: string;
  answer: string;
}

export const qnaEntries: QnaEntry[] = [
  {
    question: "Dịch vụ này gồm những gì?",
    answer:
      "Có 2 gói: gói Cơ bản chỉ hỗ trợ chuẩn bị và nộp hồ sơ, gói Toàn diện thêm cả tư vấn xin học bổng và phỏng vấn.",
  },
  {
    question: "Mất bao lâu để có kết quả?",
    answer:
      "Sau khi nộp đủ hồ sơ, hệ thống đối chiếu và báo kết quả sơ bộ trong vài phút. Kết quả chính thức từ trường thường mất 2-6 tuần tùy trường.",
  },
  {
    question: "Cần chuẩn bị giấy tờ gì?",
    answer:
      "3 loại: bảng điểm học tập (định dạng PDF), ảnh chứng chỉ IELTS, và ảnh CMND/CCCD hoặc hộ chiếu.",
  },
  {
    question: "Chi phí dịch vụ là bao nhiêu?",
    answer:
      "Tùy gói và bậc học, xem báo giá ngay trên trang chủ sau khi điền form, không mất phí xem báo giá.",
  },
  {
    question: "Tôi chưa có bằng IELTS thì có đăng ký được không?",
    answer:
      "Vẫn đăng ký được, nhưng cần bổ sung chứng chỉ IELTS trước khi nộp hồ sơ chính thức cho trường.",
  },
  {
    question: "Làm sao biết mình đủ điều kiện vào trường nào?",
    answer:
      "Sau khi nộp đủ hồ sơ trong cổng hồ sơ, hệ thống tự so sánh điểm học tập và điểm IELTS với điểm chuẩn từng trường, báo ngay trường nào đủ điều kiện.",
  },
  {
    question: "Sau khi điền form báo giá, bước tiếp theo là gì?",
    answer:
      "Đội ngũ tư vấn sẽ xem xét và duyệt yêu cầu, sau đó gửi email mời bạn vào cổng hồ sơ để nộp giấy tờ.",
  },
  {
    question: "Hồ sơ của tôi có được bảo mật không?",
    answer:
      "Có, hồ sơ chỉ hiển thị cho bạn và đội ngũ tư vấn sau khi đăng nhập, không công khai.",
  },
  {
    question: "Tôi cần liên hệ ai nếu có thắc mắc khác?",
    answer:
      "Bạn có thể để lại câu hỏi ngay trong khung chat này, hoặc để lại email/số điện thoại trong form báo giá, đội ngũ sẽ liên hệ lại.",
  },
];

// Hồ sơ của học viên đang đăng nhập demo tại /portal
export const currentStudent = {
  name: "Nguyễn Minh Anh",
  email: "minhanh.nguyen@example.com",
  documents: {
    transcript: {
      status: "hop_le" as DocStatus,
      fileName: "bang-diem-minh-anh.pdf",
    },
    ielts: {
      status: "dang_xu_ly" as DocStatus,
      fileName: "ielts-certificate.jpg",
    },
    identity: {
      status: "can_nop_lai" as DocStatus,
      fileName: "cccd-mat-truoc.jpg",
      reason: "Ảnh mờ, không đọc rõ thông tin",
    },
  },
  extracted: {
    fullName: "Nguyễn Minh Anh",
    dateOfBirth: "12/05/2005",
    gpa: 8.2,
    ielts: 6.5,
  },
  matches: [
    { school: schools[0], passed: true },
    { school: schools[4], passed: false },
  ],
};

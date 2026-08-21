import {
  createConversation,
  conversationExists,
  saveMessages,
  getMessages,
} from "@/lib/supabase";

// Model có thể đổi qua biến môi trường GEMINI_MODEL; mặc định dùng Flash-Lite.
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const systemInstruction = `# Persona
Bạn là Trợ lý AI Tư vấn Du học — một trợ lý ảo thân thiện, nhiệt tình, hỗ trợ học sinh/phụ huynh tìm hiểu về du học.

# Nhiệm vụ
Dẫn dắt cuộc trò chuyện có cấu trúc để hiểu nhu cầu du học của người dùng, thu thập thông tin liên hệ và giới thiệu dịch vụ tư vấn phù hợp. Trả lời ngắn gọn, hữu ích. Trả lời bằng đúng ngôn ngữ người dùng đang sử dụng. Mỗi lượt CHỈ hỏi MỘT câu hỏi.

# Quy tắc
- Không đề cập chi phí/học phí trừ khi người dùng chủ động hỏi.
- Không tự đưa ra cam kết về tỷ lệ đậu visa hoặc học bổng.

# Luồng hội thoại
1. Hỏi người dùng đang quan tâm du học nước nào (hoặc đang phân vân giữa các nước).
2. Hỏi về mục tiêu/bậc học (THPT, Đại học, Thạc sĩ...) và ngành học quan tâm.
3. Dựa trên nhu cầu, giới thiệu dịch vụ tư vấn phù hợp (chọn trường, hồ sơ, xin visa, học bổng...).
4. Hỏi họ có muốn tìm hiểu thêm chi tiết không.
5. Nếu có, thu thập lần lượt: họ tên → email → số điện thoại.
6. Sau đó, cung cấp thông tin chi tiết hơn về quy trình tư vấn và mời đặt lịch tư vấn miễn phí.
7. Hỏi họ có ghi chú/câu hỏi nào khác trước khi kết thúc.

# Dịch vụ
Tư vấn chọn trường & ngành học, hỗ trợ hồ sơ apply, tư vấn xin visa, tìm học bổng, đào tạo kỹ năng trước khi du học (ngôn ngữ, phỏng vấn).
Trụ sở: Số 1 Hai Bà Trưng, Hà Nội. Liên hệ: 0912 345 6789.

# Cấu hình
- Mục tiêu: Thu thập lead và đặt lịch tư vấn.
- Phong cách trả lời: Cân bằng, đi thẳng vào trọng tâm, tối đa 2-3 câu mỗi lượt trừ khi cần chi tiết hơn.`;

interface ClientMessage {
  from: "bot" | "user";
  text: string;
}

export async function POST(request: Request) {
  if (!GEMINI_API_KEY) {
    return Response.json(
      { error: "Chưa cấu hình GEMINI_API_KEY trong .env" },
      { status: 500 },
    );
  }

  let body: { messages?: ClientMessage[]; conversationId?: string | null };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body không hợp lệ" }, { status: 400 });
  }

  // Chuyển lịch sử hội thoại sang định dạng contents của Gemini.
  const contents = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => m && typeof m.text === "string" && m.text.trim())
    .map((m) => ({
      role: m.from === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

  // Gemini yêu cầu lượt đầu tiên phải là 'user' — bỏ lời chào mở đầu của bot.
  while (contents.length && contents[0].role === "model") {
    contents.shift();
  }

  if (contents.length === 0) {
    return Response.json({ error: "Chưa có nội dung câu hỏi" }, { status: 400 });
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
      }),
    });
  } catch {
    return Response.json(
      { error: "Không gọi được Gemini API" },
      { status: 502 },
    );
  }

  if (!res.ok) {
    const detail = await res.text();
    // Chi tiết lỗi (kể cả 401 do sai API key) ghi ở log máy chủ để dev xem;
    // người dùng cuối chỉ thấy thông báo thân thiện.
    console.error("Gemini API error", res.status, detail);
    return Response.json(
      {
        error:
          "Xin lỗi, trợ lý đang tạm thời gián đoạn. Bạn thử lại sau ít phút, hoặc để lại email/số điện thoại ở form báo giá để được hỗ trợ nhé.",
      },
      { status: 502 },
    );
  }

  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "")
    .join("")
    .trim();

  if (!text) {
    return Response.json(
      { error: "Trợ lý chưa đưa ra được câu trả lời, bạn thử hỏi lại nhé." },
      { status: 502 },
    );
  }

  // Lưu lịch sử hội thoại vào Supabase (server-side). Bọc try/catch để nếu
  // Supabase lỗi thì vẫn trả lời khách bình thường, không làm hỏng chat.
  let conversationId =
    typeof body.conversationId === "string" ? body.conversationId : null;
  const lastUser = [...(Array.isArray(body.messages) ? body.messages : [])]
    .reverse()
    .find((m) => m?.from === "user" && m.text?.trim());
  try {
    // Nếu client gửi id cũ nhưng hội thoại đã bị xoá → bỏ để tạo mới.
    if (conversationId && !(await conversationExists(conversationId))) {
      conversationId = null;
    }
    if (!conversationId) conversationId = await createConversation();
    if (conversationId && lastUser?.text) {
      await saveMessages(conversationId, [
        { from: "user", text: lastUser.text },
        { from: "bot", text },
      ]);
    }
  } catch (e) {
    console.error("Lưu lịch sử chat thất bại:", (e as Error).message);
  }

  return Response.json({ text, conversationId });
}

// Đọc lại lịch sử một cuộc hội thoại từ Supabase (server-side, dùng secret key).
// Trình duyệt gọi qua route này chứ KHÔNG truy cập thẳng Supabase.
export async function GET(request: Request) {
  const conversationId = new URL(request.url).searchParams.get("conversationId");
  if (!conversationId) return Response.json({ messages: [] });
  const messages = await getMessages(conversationId);
  return Response.json({ messages });
}

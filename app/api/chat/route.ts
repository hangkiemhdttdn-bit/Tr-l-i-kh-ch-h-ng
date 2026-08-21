import { qnaEntries } from "@/lib/mock-data";

// Model có thể đổi qua biến môi trường GEMINI_MODEL; mặc định dùng Flash-Lite.
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Dựng bộ hỏi–đáp thành text để nhét vào systemInstruction.
const qnaBlock = qnaEntries
  .map((e, i) => `${i + 1}. Hỏi: ${e.question}\n   Đáp: ${e.answer}`)
  .join("\n");

const systemInstruction = `Bạn là trợ lý tư vấn du học của DuHoc24, trả lời khách hàng trên khung chat ở trang chủ.

QUY TẮC BẮT BUỘC:
- CHỈ được trả lời dựa trên đúng nội dung bộ hỏi–đáp bên dưới. TUYỆT ĐỐI không thêm bất kỳ thông tin, con số, cam kết hay chi tiết nào nằm ngoài phạm vi này.
- Nếu câu hỏi của khách nằm ngoài các nội dung bên dưới, hãy lịch sự trả lời rằng bạn chỉ hỗ trợ các thông tin về dịch vụ trong khung chat, và mời khách để lại email hoặc số điện thoại ở form báo giá trên trang chủ để được đội ngũ tư vấn thêm.
- Trả lời bằng tiếng Việt, ngắn gọn, thân thiện. Được phép diễn đạt lại cho tự nhiên nhưng không được thay đổi ý nghĩa hay bịa thêm thông tin.

BỘ HỎI–ĐÁP ĐƯỢC PHÉP DÙNG:
${qnaBlock}`;

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

  let body: { messages?: ClientMessage[] };
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

  return Response.json({ text });
}

import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const EMERGENCY_TRIGGERS = [
  'đau ngực', 'đau ngực trái', 'khó thở', 'gọi cấp cứu', 'tức ngực',
  'ngực trái lan ra tay', 'nhồi máu cơ tim', 'đau tim'
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history, sessionId, customApiKey } = body;

    // Check environment key or the dynamic UI key passed in
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    // Check if API Key is not set -> fallback to mock SSE stream
    if (!apiKey) {
      const encoder = new TextEncoder();
      const text = (message || '').toLowerCase();
      const isEmergency = EMERGENCY_TRIGGERS.some(trigger => text.includes(trigger));

      const tokens = isEmergency
        ? [
          " [Lưu ý: Đang chạy ở chế độ giả lập (Mock). Cấu hình GEMINI_API_KEY trong file .env.local hoặc nhập API Key ở bảng điều khiển để kết nối Gemini thật] \n\n",
          "Chào bạn.", " Qua mô tả,", " tôi phát hiện", " triệu chứng của bạn", " có thể liên quan", " đến tình trạng khẩn cấp", " về tim mạch.", " Vui lòng liên hệ", " cơ sở y tế gần nhất", " hoặc gọi cấp cứu 115 ngay lập tức!"
        ]
        : [
          " [Lưu ý: Đang chạy ở chế độ giả lập (Mock). Cấu hình GEMINI_API_KEY trong file .env.local hoặc nhập API Key ở bảng điều khiển để kết nối Gemini thật] \n\n",
          "Chào bạn.", " Tôi đã ghi nhận", " các triệu chứng của bạn.", " Dựa trên mô tả,", " tình trạng của bạn", " hiện tại chưa có dấu hiệu", " nguy hiểm khẩn cấp.", " Tuy nhiên,", " bạn nên nghỉ ngơi,", " uống đủ nước và", " đăng ký khám chuyên khoa phù hợp để được kiểm tra kỹ hơn."
        ];

      const stream = new ReadableStream({
        async start(controller) {
          const sendChunk = (data: object) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          };

          sendChunk({ type: 'status', status: 'connected' });
          await new Promise((resolve) => setTimeout(resolve, 100));

          for (let i = 0; i < tokens.length; i++) {
            if (isEmergency && i === 5) {
              sendChunk({
                type: 'triage',
                status: 'EMERGENCY',
                flags: ['chest_pain', 'cardiac_alert']
              });
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
            sendChunk({ type: 'token', content: tokens[i] });
            await new Promise((resolve) => setTimeout(resolve, 30));
          }

          if (!isEmergency) {
            sendChunk({ type: 'triage', status: 'NORMAL', flags: [] });
          }

          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

    // Call Real Gemini API Streaming Endpoint
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${apiKey}`;

    // Map history to Gemini's content format
    let contents = [];
    if (history && Array.isArray(history) && history.length > 0) {
      contents = history.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
    } else {
      contents = [{
        role: 'user',
        parts: [{ text: message }]
      }];
    }

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
          parts: [{
            text: `Bạn là trợ lý ảo Y khoa chuyên nghiệp CareAgent AI (MedConcierge AI).
Nhiệm vụ của bạn là tư vấn sức khỏe, trả lời thắc mắc về bệnh lý và HỖ TRỢ/HƯỚNG DẪN đặt lịch hẹn khám bệnh khi người dùng yêu cầu hoặc khi phát hiện triệu chứng cần đi khám.
Bạn tuyệt đối không từ chối việc đặt lịch, hãy khuyên người bệnh đặt lịch hẹn tại chuyên khoa phù hợp (ví dụ: Khoa Tim Mạch, Khoa Tai - Mũi - Họng, Khoa Cơ Xương Khớp, Khoa Da Liễu, Khoa Nhi).
Trả lời ngắn gọn, lịch sự, đúng trọng tâm bằng tiếng Việt (hoặc tiếng Anh nếu người dùng dùng tiếng Anh).
Nếu câu hỏi nằm ngoài phạm vi y học và sức khỏe (ví dụ nấu ăn, lập trình, thời tiết...), hãy từ chối lịch sự và nói rõ bạn chỉ hỗ trợ y khoa.
Lưu ý bảo mật cực kỳ quan trọng: Không được giải mã hay thay thế các từ khóa mặt nạ PII như [MASKED_NAME_1], [MASKED_PHONE_1], [MASKED_ID_1]. Hãy giữ nguyên các từ mặt nạ đó trong câu trả lời để bảo vệ thông tin riêng tư của người bệnh.`
          }]
        },
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 500
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorJson = await geminiResponse.json().catch(() => ({}));
      const errMsg = errorJson.error?.message || geminiResponse.statusText || `Status ${geminiResponse.status}`;
      console.error("Gemini API stream failed:", errorJson);
      throw new Error(`Gemini API error: ${errMsg}`);
    }

    const reader = geminiResponse.body?.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendChunk = (data: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        sendChunk({ type: 'status', status: 'connected' });

        let buffer = '';
        let braceCount = 0;
        let startIndex = -1;
        let inString = false;
        let escaped = false;

        while (true) {
          const { value, done } = await reader!.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          for (let i = 0; i < buffer.length; i++) {
            const char = buffer[i];

            if (escaped) {
              escaped = false;
              continue;
            }
            if (char === '\\') {
              escaped = true;
              continue;
            }
            if (char === '"') {
              inString = !inString;
              continue;
            }

            if (!inString) {
              if (char === '{') {
                if (braceCount === 0) {
                  startIndex = i;
                }
                braceCount++;
              } else if (char === '}') {
                braceCount--;
                if (braceCount === 0 && startIndex !== -1) {
                  const jsonStr = buffer.slice(startIndex, i + 1);
                  try {
                    const parsed = JSON.parse(jsonStr);
                    const textContent = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (textContent) {
                      sendChunk({ type: 'token', content: textContent });
                    }
                  } catch (err) {
                    // Ignore parsing errors for partial chunks
                  }
                  buffer = buffer.slice(i + 1);
                  i = -1;
                  startIndex = -1;
                }
              }
            }
          }
        }

        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error: any) {
    console.error('Error in API Stream handler:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

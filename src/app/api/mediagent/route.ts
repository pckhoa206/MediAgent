import { NextRequest } from 'next/server';
import { evaluateAgentGuardrail } from '@/modules/security/guardrail';

export const runtime = 'nodejs';

// ─────────────────────── Clinical Knowledge Base (RAG Seed) ───────────────────────
// Vietnamese medical triage keywords and contextual department mapping.
const EMERGENCY_TRIGGERS = [
  'đau ngực', 'đau ngực trái', 'khó thở', 'gọi cấp cứu', 'tức ngực',
  'ngực trái lan ra tay', 'nhồi máu cơ tim', 'đau tim', 'đột quỵ',
  'mất ý thức', 'không tỉnh', 'ngã bất tỉnh', 'co giật', 'xuất huyết',
  'chảy máu không cầm', 'gãy xương hở', 'ngộ độc cấp',
];

// Contextual department routing knowledge used to enrich the system prompt
const CLINICAL_KNOWLEDGE = `
## Hướng dẫn Phân khoa Lâm sàng (Clinical Routing Knowledge Base)

| Triệu chứng | Chuyên khoa phù hợp |
|---|---|
| Đau ngực, khó thở, tức ngực, nhịp tim bất thường | Khoa Tim Mạch |
| Ho kéo dài, khó thở, tức ngực khi thở | Khoa Hô Hấp |
| Đau đầu, chóng mặt, mất thăng bằng, đột quỵ | Khoa Thần Kinh |
| Đau bụng, buồn nôn, nôn mửa, rối loạn tiêu hóa | Khoa Tiêu Hóa |
| Đau khớp, sưng khớp, đau lưng, cứng cơ | Khoa Cơ Xương Khớp |
| Phát ban, ngứa da, mề đay, mụn trứng cá nặng | Khoa Da Liễu |
| Ù tai, mất thính lực, viêm họng, ngạt mũi | Khoa Tai Mũi Họng |
| Trẻ em dưới 16 tuổi với bất kỳ triệu chứng nào | Khoa Nhi |
| Đau mắt, đỏ mắt, mờ mắt | Khoa Mắt |
| Vấn đề tiết niệu, thận, tiểu buốt | Khoa Tiết Niệu |
| Vấn đề phụ khoa, thai kỳ | Khoa Sản Phụ Khoa |
| Tiểu đường, tuyến giáp, rối loạn nội tiết | Khoa Nội Tiết |
| Trầm cảm, lo âu, rối loạn tâm thần | Khoa Tâm Thần |
| Vết thương, gãy xương, tai nạn | Khoa Chấn Thương Chỉnh Hình |

## Quy trình Triage Khẩn cấp
- Nếu phát hiện bất kỳ triệu chứng khẩn cấp nào (đau ngực, khó thở cấp, co giật, mất ý thức, xuất huyết nặng): YÊU CẦU gọi ngay 115 hoặc đến cấp cứu gần nhất.
- Không trì hoãn tư vấn đặt lịch khi có triệu chứng khẩn cấp — hướng dẫn đến cấp cứu trực tiếp.

## Khung Tư vấn An toàn
- Không đưa ra chẩn đoán xác định. Chỉ gợi ý chuyên khoa phù hợp.
- Luôn khuyến nghị thăm khám trực tiếp với bác sĩ chuyên khoa.
- Với triệu chứng mơ hồ hoặc không rõ: Đề nghị khám Nội Tổng hợp.
`;

// ─────────────────────── Helpers ───────────────────────

function detectEmergency(text: string): boolean {
  const lower = text.toLowerCase();
  return EMERGENCY_TRIGGERS.some((t) => lower.includes(t));
}

function buildSystemPrompt(isEmergency: boolean): string {
  return `Bạn là CareAgent AI — Trợ lý Y tế Thông minh của hệ thống MediAgent.

## Vai trò & Quyền hạn
Bạn là một trợ lý y tế ảo CHUYÊN HỖ TRỢ:
1. Tư vấn triệu chứng và gợi ý chuyên khoa phù hợp
2. Hỗ trợ và hướng dẫn đặt lịch hẹn khám
3. Giải đáp thắc mắc về thủ tục, bảo hiểm y tế
4. Cung cấp thông tin y khoa chính xác, dễ hiểu

## Bảo mật PII Quan trọng
Tuyệt đối KHÔNG giải mã hoặc thay thế các token mặt nạ như [MASKED_NAME_1], [MASKED_PHONE_1], [MASKED_ID_1]. Giữ nguyên token đó trong mọi phản hồi.

${CLINICAL_KNOWLEDGE}

## Định dạng Phản hồi
- Ngắn gọn (dưới 300 từ), thân thiện, chuyên nghiệp
- Nếu gợi ý chuyên khoa, hỏi người dùng có muốn đặt lịch không
- Trả lời bằng ngôn ngữ mà người dùng đang sử dụng (Tiếng Việt / English)
- Từ chối lịch sự các câu hỏi nằm ngoài y tế và sức khỏe

${isEmergency ? `
## ⚠️ CẢNH BÁO: Phiên này có dấu hiệu KHẨN CẤP Y TẾ
Người dùng đang mô tả triệu chứng nghiêm trọng. YÊU CẦU:
1. Nhắc ngay: Gọi cấp cứu 115 hoặc đến cơ sở y tế gần nhất ngay lập tức
2. KHÔNG trì hoãn bằng tư vấn lịch khám thông thường
3. Cung cấp hướng dẫn sơ cứu cơ bản nếu có thể
` : ''}`;
}

function classifyTriage(message: string): { status: 'EMERGENCY' | 'URGENT' | 'NORMAL'; flags: string[] } {
  const lower = message.toLowerCase();
  const flags: string[] = [];
  let status: 'EMERGENCY' | 'URGENT' | 'NORMAL' = 'NORMAL';

  if (lower.includes('đau ngực') || lower.includes('tức ngực') || lower.includes('đau tim')) {
    flags.push('chest_pain', 'cardiac_alert');
    status = 'EMERGENCY';
  }
  if (lower.includes('khó thở') || lower.includes('không thở được')) {
    flags.push('respiratory_distress');
    status = 'EMERGENCY';
  }
  if (lower.includes('co giật') || lower.includes('mất ý thức') || lower.includes('ngất xỉu')) {
    flags.push('neurological_emergency');
    status = 'EMERGENCY';
  }
  if (lower.includes('đột quỵ') || lower.includes('liệt nửa người') || lower.includes('méo miệng')) {
    flags.push('stroke_alert');
    status = 'EMERGENCY';
  }
  if (lower.includes('chảy máu') || lower.includes('xuất huyết')) {
    flags.push('hemorrhage');
    status = status === 'EMERGENCY' ? 'EMERGENCY' : 'URGENT';
  }
  if (lower.includes('đau bụng dữ dội') || lower.includes('đau quặn bụng')) {
    flags.push('acute_abdominal');
    status = status === 'EMERGENCY' ? 'EMERGENCY' : 'URGENT';
  }

  return { status, flags };
}

// ─────────────────────── API Handler ───────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history, customApiKey } = body as {
      message: string;
      history?: Array<{ role: string; content: string }>;
      customApiKey?: string;
    };

    // — Guardrail evaluation (blocks non-medical, privacy-extracting queries)
    const guardrailResult = evaluateAgentGuardrail(message || '');
    const isEmergency = detectEmergency(message || '');
    const triageResult = classifyTriage(message || '');

    if (!guardrailResult.isAllowed) {
      const encoder = new TextEncoder();
      const blockedStream = new ReadableStream({
        start(controller) {
          const send = (data: object) =>
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          send({ type: 'status', status: 'connected' });
          send({ type: 'token', content: guardrailResult.response });
          send({ type: 'triage', status: 'NORMAL', flags: [] });
          controller.close();
        },
      });
      return new Response(blockedStream, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
      });
    }

    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    // — Mock fallback when no API key is configured
    if (!apiKey) {
      const encoder = new TextEncoder();
      const mockTokens = isEmergency
        ? [
            '[Lưu ý: Đang chạy ở chế độ Demo. Cấu hình GEMINI_API_KEY để kết nối AI thật.]\n\n',
            '⚠️ **CẢNH BÁO KHẨN CẤP**: Dựa trên mô tả của bạn, tôi phát hiện các dấu hiệu nguy hiểm. ',
            'Vui lòng **gọi ngay 115** hoặc đến phòng cấp cứu gần nhất **NGAY LẬP TỨC**. ',
            'Đừng chờ đợi hoặc tự điều trị.',
          ]
        : [
            '[Lưu ý: Đang chạy ở chế độ Demo. Cấu hình GEMINI_API_KEY để kết nối AI thật.]\n\n',
            'Chào bạn! Tôi đã ghi nhận thông tin về triệu chứng của bạn. ',
            'Dựa trên mô tả, tình trạng của bạn chưa có dấu hiệu nguy hiểm khẩn cấp. ',
            'Bạn nên nghỉ ngơi đầy đủ, uống đủ nước và theo dõi triệu chứng. ',
            'Nếu triệu chứng kéo dài hoặc nặng thêm, hãy đặt lịch khám tại chuyên khoa phù hợp.',
          ];

      const mockStream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const send = (data: object) =>
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

          send({ type: 'status', status: 'connected' });
          await new Promise((r) => setTimeout(r, 100));

          for (const token of mockTokens) {
            send({ type: 'token', content: token });
            await new Promise((r) => setTimeout(r, 40));
          }

          send({ type: 'triage', status: triageResult.status, flags: triageResult.flags });
          controller.close();
        },
      });

      return new Response(mockStream, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
      });
    }

    // — Real Gemini API call with RAG-enriched system prompt
    const systemPrompt = buildSystemPrompt(isEmergency);
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${apiKey}`;

    type GeminiContent = { role: string; parts: Array<{ text: string }> };
    let contents: GeminiContent[] = [];

    if (history && Array.isArray(history) && history.length > 0) {
      contents = history.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));
    } else {
      contents = [{ role: 'user', parts: [{ text: message }] }];
    }

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature: isEmergency ? 0.1 : 0.3,
          maxOutputTokens: 600,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorJson = await geminiResponse.json().catch(() => ({})) as { error?: { message?: string } };
      const errMsg = errorJson.error?.message || geminiResponse.statusText;
      throw new Error(`Gemini API error: ${errMsg}`);
    }

    const reader = geminiResponse.body?.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

        send({ type: 'status', status: 'connected' });

        // Emit triage signal early if emergency
        if (triageResult.status === 'EMERGENCY') {
          send({ type: 'triage', status: triageResult.status, flags: triageResult.flags });
        }

        let buffer = '';
        let braceCount = 0;
        let startIndex = -1;
        let inString = false;
        let escaped = false;
        let triageSent = triageResult.status === 'EMERGENCY';

        while (true) {
          const { value, done } = await reader!.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          for (let i = 0; i < buffer.length; i++) {
            const char = buffer[i];
            if (escaped) { escaped = false; continue; }
            if (char === '\\') { escaped = true; continue; }
            if (char === '"') { inString = !inString; continue; }

            if (!inString) {
              if (char === '{') {
                if (braceCount === 0) startIndex = i;
                braceCount++;
              } else if (char === '}') {
                braceCount--;
                if (braceCount === 0 && startIndex !== -1) {
                  const jsonStr = buffer.slice(startIndex, i + 1);
                  try {
                    const parsed = JSON.parse(jsonStr) as {
                      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
                    };
                    const textContent = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (textContent) {
                      send({ type: 'token', content: textContent });
                    }
                  } catch {
                    // Partial chunk, ignore
                  }
                  buffer = buffer.slice(i + 1);
                  i = -1;
                  startIndex = -1;
                }
              }
            }
          }
        }

        // Emit triage at end if not already sent
        if (!triageSent) {
          send({ type: 'triage', status: triageResult.status, flags: triageResult.flags });
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    console.error('Error in MediAgent API handler:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

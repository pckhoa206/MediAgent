import { NextRequest } from 'next/server';
import { evaluateAgentGuardrail } from '@/modules/security/guardrail';
import { getDatabaseAdapter } from '@/lib/db/adapter';
import { createAppointment, findUser, writeAuditLog } from '@/lib/db/store';
import { matchDepartmentSemantic } from '@/utils/semantic-routing';
import { detectLanguage } from '@/utils/language';

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

## Khung Tư vấn An sau
- Không đưa ra chẩn đoán xác định. Chỉ gợi ý chuyên khoa phù hợp.
- Luôn khuyến nghị thăm khám trực tiếp với bác sĩ chuyên khoa.
- Với triệu chứng mơ hồ hoặc không rõ: Đề nghị khám Nội Tổng hợp.
`;

const CLINICAL_KNOWLEDGE_EN = `
## Clinical Department Routing Guidelines

| Symptoms | Suitable Department |
|---|---|
| Chest pain, breathing difficulties, chest tightness, abnormal heart rate | Cardiology (Khoa Tim Mạch) |
| Persistent cough, breathing difficulties, tightness when breathing | Pulmonology (Khoa Hô Hấp) |
| Headache, dizziness, loss of balance, stroke signs | Neurology (Khoa Thần Kinh) |
| Abdominal pain, nausea, vomiting, digestive disorders | Gastroenterology (Khoa Tiêu Hóa) |
| Joint pain, knee pain, bone/joint issues, back pain, muscle stiffness | Rheumatology / Orthopedics (Khoa Cơ Xương Khớp) |
| Rashes, skin itching, severe acne, hives | Dermatology (Khoa Da Liễu) |
| Tinnitus, hearing loss, sore throat, nasal congestion | ENT (Khoa Tai Mũi Họng) |
| Children under 16 years old with any symptoms | Pediatrics (Khoa Nhi) |
| Eye pain, red eyes, blurred vision | Ophthalmology (Khoa Mắt) |
| Urinary issues, kidney issues, painful urination | Urology (Khoa Tiết Niệu) |
| Gynecological issues, pregnancy | Obstetrics & Gynecology (Khoa Sản Phụ Khoa) |
| Diabetes, thyroid, endocrine disorders | Endocrinology (Khoa Nội Tiết) |
| Depression, anxiety, mental disorders | Psychiatry (Khoa Tâm Thần) |
| Trauma, fractures, accidents | Orthopedics & Trauma (Khoa Chấn Thương Chỉnh Hình) |

## Emergency Triage Protocol
- If any emergency symptoms are detected (chest pain, acute shortness of breath, seizures, loss of consciousness, severe bleeding): REQUIRE calling 115 or going to the nearest emergency department immediately.
- Do not delay consulting or booking when emergency symptoms are present—guide them directly to the ER.

## Safe Consultation Boundaries
- Do not provide a definitive diagnosis. Only suggest the appropriate department.
- Always recommend an in-person examination with a specialist doctor.
- For vague or unclear symptoms: Suggest General Internal Medicine (Khoa Nội Tổng Quát).
`;

// ─────────────────────── Helpers ───────────────────────

function detectEmergency(text: string): boolean {
  const lower = text.toLowerCase();
  return EMERGENCY_TRIGGERS.some((t) => lower.includes(t));
}

function buildSystemPrompt(isEmergency: boolean, lang: 'vi' | 'en' = 'vi'): string {
  if (lang === 'en') {
    return `You are CareAgent AI — the Smart Medical Assistant of the MediAgent system.

## Role & Capabilities
You are a virtual medical assistant specialized in:
1. Symptom consultation and suggesting appropriate clinical departments.
2. Assisting and guiding patients in booking appointments.
3. Answering inquiries regarding procedures and health insurance.
4. Providing accurate, easy-to-understand medical information.

## Critical PII Security
Do NOT decrypt or replace masked tokens like [MASKED_NAME_1], [MASKED_PHONE_1], [MASKED_ID_1]. Keep these tokens exactly as they are in all responses.

${CLINICAL_KNOWLEDGE_EN}

## Response Formatting
- Concise (under 300 words), friendly, and professional.
- If suggesting a department, ask the user if they would like to book an appointment.
- Respond STRICTLY in English.
- Politely decline queries unrelated to medicine and health.

${isEmergency ? `
## ⚠️ WARNING: CLINICAL EMERGENCY DETECTED
The user is describing severe symptoms. REQUIREMENTS:
1. Immediately advise: Call emergency 115 or go to the nearest emergency room immediately.
2. Do NOT delay with standard appointment booking guides.
3. Provide basic first-aid instructions if applicable.
` : ''}`;
  }

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

async function generateLocalFallbackResponse(message: string, triageResult: any, lang: 'vi' | 'en' = 'vi', apiKey?: string): Promise<string> {
  const matched = await matchDepartmentSemantic(message, apiKey);

  if (lang === 'en') {
    const department = matched || "General Internal Medicine";
    if (triageResult.status === 'EMERGENCY') {
      return `[Offline Mode] Emergency Warning: Your symptoms indicate a critical clinical condition. Please call 115 or proceed to the nearest emergency room immediately!`;
    }
    return `[Offline Mode] Based on your symptoms, I recommend registering for a consultation at the **${department}** department. Would you like me to assist you in booking an appointment?`;
  }

  const department = matched || "Khoa Nội Tổng Quát";
  if (triageResult.status === 'EMERGENCY') {
    return `[Chế độ Ngoại tuyến] Cảnh báo khẩn cấp: Các triệu chứng của bạn chỉ ra tình trạng nguy kịch lâm sàng. Bạn vui lòng gọi ngay 115 hoặc di chuyển khẩn cấp đến phòng cấp cứu gần nhất!`;
  }

  return `[Chế độ Ngoại tuyến] Dựa trên các triệu chứng của bạn, tôi khuyên bạn nên đăng ký khám tại chuyên khoa **${department}**. Bạn có muốn tôi hỗ trợ đặt lịch khám tại khoa này không?`;
}

const MOCK_SLOTS = [
  { id: 'slot-1', time: '08:00 - 09:00', department: 'Khoa Tai - Mũi - Họng', assignedDoctorId: 'DOC-11223' },
  { id: 'slot-2', time: '09:00 - 10:00', department: 'Khoa Tai - Mũi - Họng', assignedDoctorId: 'DOC-11223' },
  { id: 'slot-3', time: '10:00 - 11:00', department: 'Khoa Tai - Mũi - Họng', assignedDoctorId: 'DOC-11223' },
  { id: 'slot-4', time: '14:00 - 15:00', department: 'Khoa Tim Mạch', assignedDoctorId: 'DOC-22334' },
  { id: 'slot-5', time: '15:00 - 16:00', department: 'Khoa Tim Mạch', assignedDoctorId: 'DOC-22334' }
];

async function executeTool(name: string, args: any, sessionId: string) {
  if (name === 'get_available_slots') {
    try {
      const adapter = getDatabaseAdapter();
      const bookedAppointments = await adapter.all<{ slotId: string }>(
        "SELECT slotId FROM appointments WHERE status = 'BOOKED'"
      );
      const bookedIds = new Set(bookedAppointments.map(a => a.slotId));
      const available = MOCK_SLOTS.filter(s => !bookedIds.has(s.id));
      return { slots: available };
    } catch (e) {
      return { error: 'Failed to query slots', slots: MOCK_SLOTS };
    }
  }

  if (name === 'book_appointment') {
    const { slotId } = args;
    if (!slotId) return { error: 'Missing slotId parameter' };
    if (!sessionId || sessionId === 'guest') {
      return { error: 'User is not logged in. Booking requires a logged in patient session.' };
    }

    try {
      const user = await findUser(sessionId);
      if (!user) {
        return { error: 'Patient account not found.' };
      }

      const slot = MOCK_SLOTS.find(s => s.id === slotId);
      if (!slot) return { error: 'Invalid slotId.' };

      const adapter = getDatabaseAdapter();
      const existing = await adapter.get(
        "SELECT id FROM appointments WHERE slotId = ? AND status = 'BOOKED'",
        [slotId]
      );
      if (existing) return { error: 'This time slot is already booked.' };

      const apt = await createAppointment({
        patientCccd: user.cccd,
        patientName: user.fullName,
        doctorId: slot.assignedDoctorId,
        department: slot.department,
        slot: slot.time,
        slotId: slot.id,
        status: 'BOOKED'
      });

      await writeAuditLog(user.cccd, user.role, 'APT_BOOKED_BY_AI', `apt:${apt.id}`, '127.0.0.1');
      return {
        success: true,
        message: `Đặt lịch thành công cho bệnh nhân ${user.fullName} tại ${slot.department} lúc ${slot.time}.`,
        appointment: apt
      };
    } catch (e: any) {
      return { error: `Failed to book appointment: ${e.message}` };
    }
  }

  return { error: `Unknown tool: ${name}` };
}

// ─────────────────────── API Handler ───────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history, customApiKey, sessionId, lang } = body as {
      message: string;
      history?: Array<{ role: string; content: string }>;
      customApiKey?: string;
      sessionId?: string;
      lang?: 'vi' | 'en';
    };
    const activeLang = lang || detectLanguage(message || '') || 'vi';

    // — Guardrail evaluation (blocks non-medical, privacy-extracting queries)
    const guardrailResult = evaluateAgentGuardrail(message || '', activeLang);
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
      const mockTokens = activeLang === 'en'
        ? (isEmergency
            ? [
                '[Note: Running in Demo Mode. Configure GEMINI_API_KEY to connect to real AI.]\n\n',
                '⚠️ **EMERGENCY WARNING**: Based on your description, I detected critical symptoms. ',
                'Please **call 115 immediately** or proceed to the nearest emergency department **RIGHT NOW**. ',
                'Do not wait or self-treat.',
              ]
            : [
                '[Note: Running in Demo Mode. Configure GEMINI_API_KEY to connect to real AI.]\n\n',
                'Hello! I have recorded your symptoms. ',
                'Based on your description, your condition does not show emergency signs. ',
                'Please rest well, drink enough water, and monitor your symptoms. ',
                'If symptoms persist or worsen, please book an appointment with the appropriate department.',
              ])
        : (isEmergency
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
              ]);

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
    const systemPrompt = buildSystemPrompt(isEmergency, activeLang);
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

    let geminiResponse;
    let useFallback = false;
    let fallbackText = '';

    try {
      geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          tools: [{
            functionDeclarations: [
              {
                name: "get_available_slots",
                description: "Lấy danh sách các khung giờ khám bệnh còn trống bao gồm chuyên khoa y khoa, thời gian, và mã bác sĩ phụ trách.",
                parameters: {
                  type: "OBJECT",
                  properties: {}
                }
              },
              {
                name: "book_appointment",
                description: "Đặt lịch khám bệnh cho bệnh nhân vào một khung giờ cụ thể.",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    slotId: {
                      type: "STRING",
                      description: "Mã định danh của khung giờ khám muốn đặt (ví dụ: slot-1, slot-2, ...)"
                    }
                  },
                  required: ["slotId"]
                }
              }
            ]
          }],
          generationConfig: {
            temperature: isEmergency ? 0.1 : 0.3,
            maxOutputTokens: 600,
          },
        }),
      });

      if (!geminiResponse.ok) {
        const errorJson = await geminiResponse.json().catch(() => ({})) as { error?: { message?: string } };
        console.error("Gemini API call failed. Status:", geminiResponse.status, "Error body:", JSON.stringify(errorJson));
        useFallback = true;
        fallbackText = await generateLocalFallbackResponse(message, triageResult, activeLang, apiKey);
      }
    } catch (e: any) {
      console.error("Fetch to Gemini failed:", e.message);
      useFallback = true;
      fallbackText = await generateLocalFallbackResponse(message, triageResult, activeLang, apiKey);
    }

    if (useFallback) {
      const encoder = new TextEncoder();
      const mockStream = new ReadableStream({
        async start(controller) {
          const send = (data: object) =>
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

          send({ type: 'status', status: 'connected' });

          const words = fallbackText.split(' ');
          for (const word of words) {
            send({ type: 'token', content: word + ' ' });
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

    const reader = geminiResponse!.body?.getReader();
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

        let scannedLength = 0;
        let buffer = '';
        let braceCount = 0;
        let startIndex = -1;
        let inString = false;
        let escaped = false;
        let triageSent = triageResult.status === 'EMERGENCY';
        let activeFunctionCall: { name: string; args: any } | null = null;

        while (true) {
          const { value, done } = await reader!.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          for (let i = scannedLength; i < buffer.length; i++) {
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
                      candidates?: Array<{ 
                        content?: { 
                          parts?: Array<{ 
                            text?: string;
                            functionCall?: { name: string; args?: any };
                          }> 
                        } 
                      }>;
                    };
                    
                    const funcCall = parsed.candidates?.[0]?.content?.parts?.[0]?.functionCall;
                    if (funcCall) {
                      activeFunctionCall = {
                        name: funcCall.name,
                        args: funcCall.args || {}
                      };
                    }

                    const textContent = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (textContent) {
                      send({ type: 'token', content: textContent });
                    }
                  } catch (err: any) {
                    console.error("[mediagent/api] JSON parse failed:", err.message, "on string:", jsonStr);
                  }
                  buffer = buffer.slice(i + 1);
                  i = -1;
                  startIndex = -1;
                  scannedLength = 0;
                  continue;
                }
              }
            }
          }
          if (buffer.length > 0) {
            scannedLength = buffer.length;
          }
        }

        // If a function call was requested, execute it and call Gemini again
        if (activeFunctionCall) {
          console.log("[mediagent/api] Tool requested:", activeFunctionCall.name, "with args:", JSON.stringify(activeFunctionCall.args));
          const activeSessionId = sessionId || 'guest';
          const toolResult = await executeTool(activeFunctionCall.name, activeFunctionCall.args, activeSessionId);
          console.log("[mediagent/api] Tool result:", JSON.stringify(toolResult));
          
          if (activeFunctionCall.name === 'book_appointment' && toolResult.success) {
            send({ type: 'appointment_booked', appointment: toolResult.appointment });
          }

          const secondContents = [
            ...contents,
            {
              role: 'model',
              parts: [{
                functionCall: {
                  name: activeFunctionCall.name,
                  args: activeFunctionCall.args
                }
              }]
            },
            {
              role: 'function',
              parts: [{
                functionResponse: {
                  name: activeFunctionCall.name,
                  response: toolResult
                }
              }]
            }
          ];

          const secondResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: secondContents,
              systemInstruction: { parts: [{ text: systemPrompt }] },
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 600,
              },
            }),
          });

          if (secondResponse.ok && secondResponse.body) {
            const secondReader = secondResponse.body.getReader();
            let secondScannedLength = 0;
            let secondBuffer = '';
            let secondBraceCount = 0;
            let secondStartIndex = -1;
            let secondInString = false;
            let secondEscaped = false;

            while (true) {
              const { value, done } = await secondReader.read();
              if (done) break;

              secondBuffer += decoder.decode(value, { stream: true });

              for (let i = secondScannedLength; i < secondBuffer.length; i++) {
                const char = secondBuffer[i];
                if (secondEscaped) { secondEscaped = false; continue; }
                if (char === '\\') { secondEscaped = true; continue; }
                if (char === '"') { secondInString = !secondInString; continue; }

                if (!secondInString) {
                  if (char === '{') {
                    if (secondBraceCount === 0) secondStartIndex = i;
                    secondBraceCount++;
                  } else if (char === '}') {
                    secondBraceCount--;
                    if (secondBraceCount === 0 && secondStartIndex !== -1) {
                      const jsonStr = secondBuffer.slice(secondStartIndex, i + 1);
                      try {
                        const parsed = JSON.parse(jsonStr) as {
                          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
                        };
                        const textContent = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (textContent) {
                          send({ type: 'token', content: textContent });
                        }
                      } catch {
                        // Ignore partial JSON parsing errors
                      }
                      secondBuffer = secondBuffer.slice(i + 1);
                      i = -1;
                      secondStartIndex = -1;
                      secondScannedLength = 0;
                      continue;
                    }
                  }
                }
              }
              if (secondBuffer.length > 0) {
                secondScannedLength = secondBuffer.length;
              }
            }
          } else {
            const errJson = await secondResponse.json().catch(() => ({}));
            console.error("Gemini second call failed. Status:", secondResponse.status, "Error body:", JSON.stringify(errJson));
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

import { NextRequest } from 'next/server';
import { detectLanguage } from '@/utils/language';

export const runtime = 'nodejs'; // or 'edge'

const EMERGENCY_TRIGGERS = [
  'đau ngực', 'đau ngực trái', 'khó thở', 'gọi cấp cứu', 'tức ngực',
  'ngực trái lan ra tay', 'nhồi máu cơ tim', 'đau tim'
];

export async function POST(req: NextRequest) {
  try {
    const { message, lang } = await req.json();
    const activeLang = lang || detectLanguage(message || '') || 'vi';
    const apiKey = process.env.GEMINI_API_KEY;

    // Check if API Key is not set -> fallback to mock SSE stream
    if (!apiKey) {
      const encoder = new TextEncoder();
      const text = (message || '').toLowerCase();
      const isEmergency = EMERGENCY_TRIGGERS.some(trigger => text.includes(trigger));

      const tokens = activeLang === 'en'
        ? (isEmergency 
          ? [
              " [Note: Running in Mock Mode. Set GEMINI_API_KEY in .env.local to connect to real Gemini] \n\n",
              "Hello.", " I", " detected", " symptoms", " you", " described", " that", " may", " be", " related", " to", " a", " cardiovascular", " emergency.", " The", " system", " has", " activated", " emergency", " alert."
            ]
          : [
              " [Note: Running in Mock Mode. Set GEMINI_API_KEY in .env.local to connect to real Gemini] \n\n",
              "Hello.", " I", " have", " received", " your", " information.", " Your", " symptoms", " seem", " normal.", " Please", " rest", " and", " monitor", " further."
            ])
        : (isEmergency 
          ? [
              " [Lưu ý: Đang chạy ở chế độ giả lập (Mock). Cấu hình GEMINI_API_KEY trong file .env.local để kết nối Gemini thật] \n\n",
              "Chào", " bạn.", " Tôi", " phát", " hiện", " triệu", " chứng", " bạn", " mô", " tả",
              " có", " thể", " liên", " quan", " đến", " một", " tình", " trạng", " khẩn", " cấp",
              " về", " tim", " mạch.", " Hệ", " thống", " đã", " kích", " hoạt", " cảnh", " báo", " cấp", " cứu."
            ]
          : [
              " [Lưu ý: Đang chạy ở chế độ giả lập (Mock). Cấu hình GEMINI_API_KEY trong file .env.local để kết nối Gemini thật] \n\n",
              "Chào", " bạn.", " Tôi", " đã", " nhận", " được", " thông", " tin.", " Triệu", " chứng",
              " của", " bạn", " có", " vẻ", " bình", " thường.", " Hãy", " nghỉ", " ngơi", " và",
              " theo", " dõi", " thêm."
            ]);

      const stream = new ReadableStream({
        async start(controller) {
          const sendChunk = (data: object) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          };

          sendChunk({ type: 'status', status: 'connected' });
          await new Promise((resolve) => setTimeout(resolve, 100));

          for (let i = 0; i < tokens.length; i++) {
            const triggerIndex = activeLang === 'en' ? 15 : 16;
            if (isEmergency && i === triggerIndex) {
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

    const systemPrompt = activeLang === 'en'
      ? `You are CareAgent AI — the smart and professional medical virtual assistant.
Your task is to analyze preliminary health symptoms from the patient's message.
Respond concisely, politely, and focus on the query in English.
Security note: Do not guess or decrypt masked tokens like [MASKED_NAME_1], [MASKED_PHONE_1] or [MASKED_ID_1]. Respond naturally while keeping these tokens intact.

Patient's message: "${message}"`
      : `Bạn là trợ lý ảo Y khoa chuyên nghiệp MedConcierge AI.
Nhiệm vụ của bạn là phân tích triệu chứng sức khỏe sơ bộ từ tin nhắn của bệnh nhân. 
Trả lời ngắn gọn, lịch sự, đúng trọng tâm bằng tiếng Việt.
Lưu ý bảo mật: Không phỏng đoán hay điền thông tin cá nhân cho các từ khóa mặt nạ như [MASKED_NAME_1], [MASKED_PHONE_1] hay [MASKED_ID_1]. Hãy phản hồi tự nhiên giữ nguyên các từ mặt nạ đó.

Tin nhắn của bệnh nhân: "${message}"`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }],
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

    // Stream transformation from Gemini format to SSE format
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
                    // Ignore parsing errors for incomplete chunks
                  }
                  buffer = buffer.slice(i + 1);
                  i = -1; // Reset loop pointer for sliced buffer
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

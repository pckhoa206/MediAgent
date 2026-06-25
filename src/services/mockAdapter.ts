/**
 * Mock SSE Adapter
 * Simulates a server-sent events stream response containing text tokens and triage alerts.
 */

export interface MockSSEOptions {
  message: string;
  delayMs?: number;
}

const EMERGENCY_TRIGGERS = [
  'đau ngực', 'đau ngực trái', 'khó thở', 'gọi cấp cứu', 'tức ngực',
  'ngực trái lan ra tay', 'nhồi máu cơ tim', 'đau tim'
];

/**
 * Returns a mock Response containing a ReadableStream that outputs SSE data chunks.
 */
export function createMockSSEResponse(options: MockSSEOptions): Response {
  const encoder = new TextEncoder();
  const text = options.message.toLowerCase();
  
  // Determine if it triggers an emergency triage state
  const isEmergency = EMERGENCY_TRIGGERS.some(trigger => text.includes(trigger));
  
  const tokens = isEmergency 
    ? [
        "Chào", " bạn.", " Tôi", " phát", " hiện", " triệu", " chứng", " bạn", " mô", " tả",
        " có", " thể", " liên", " quan", " đến", " một", " tình", " trạng", " khẩn", " cấp",
        " về", " tim", " mạch.", " Hệ", " thống", " đã", " kích", " hoạt", " cảnh", " báo", " cấp", " cứu."
      ]
    : [
        "Chào", " bạn.", " Tôi", " đã", " nhận", " được", " thông", " tin.", " Triệu", " chứng",
        " của", " bạn", " có", " vẻ", " bình", " thường.", " Hãy", " nghỉ", " ngơi", " và",
        " theo", " dõi", " thêm."
      ];

  const stream = new ReadableStream({
    async start(controller) {
      const sendChunk = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // 1. Send initial session/meta chunk
      sendChunk({ type: 'status', status: 'connected' });
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 2. Stream tokens sequentially
      for (let i = 0; i < tokens.length; i++) {
        // If it's emergency, trigger triage card injection mid-way (e.g. at token 15)
        if (isEmergency && i === 15) {
          sendChunk({ 
            type: 'triage', 
            status: 'EMERGENCY', 
            flags: ['chest_pain', 'cardiac_alert'] 
          });
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        sendChunk({ type: 'token', content: tokens[i] });
        await new Promise((resolve) => setTimeout(resolve, options.delayMs || 50));
      }

      // If it wasn't triggered mid-way, send a normal triage status at the end
      if (!isEmergency) {
        sendChunk({ type: 'triage', status: 'NORMAL', flags: [] });
      }

      // 3. Close the stream
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

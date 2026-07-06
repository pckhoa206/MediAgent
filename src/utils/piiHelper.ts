import { maskPII, MaskResult } from '../security/piiFilter';
import { useChatStore } from '../store/useChatStore';

/**
 * Utility helper to mask PII before sending data to external services.
 * It automatically updates the chat store with new PII mappings.
 */
export function sanitizeDataBeforeSend(text: string): string {
  const result: MaskResult = maskPII(text);
  
  if (result.mappings.length > 0) {
    useChatStore.getState().addPiiMappings(result.mappings);
  }
  
  return result.maskedText;
}

/**
 * Utility helper to unmask PII when receiving data from external services.
 * It uses the mappings stored in the chat store.
 */
export function restoreDataAfterReceive(text: string): string {
  let restoredText = text;
  const mappings = useChatStore.getState().piiMappings;
  
  mappings.forEach(mapping => {
    // Escape brackets for regex
    const tokenRegex = new RegExp(mapping.token.replace(/\[/g, '\\[').replace(/\]/g, '\\]'), 'g');
    restoredText = restoredText.replace(tokenRegex, mapping.original);
  });
  
  return restoredText;
}

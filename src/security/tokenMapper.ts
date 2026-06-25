import { PIIMapping } from './piiFilter';

/**
 * Replaces all [MASKED_*] tokens in the given text back with their original values.
 * This runs strictly on the client side prior to rendering in the DOM.
 */
export function restorePII(text: string, mappings: PIIMapping[]): string {
  let restoredText = text;
  
  // Sort mappings by token length descending to prevent substring mismatch (just in case)
  const sortedMappings = [...mappings].sort((a, b) => b.token.length - a.token.length);
  
  for (const mapping of sortedMappings) {
    // Escape special regex characters in token
    const escapedToken = mapping.token.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escapedToken, 'g');
    restoredText = restoredText.replace(regex, mapping.original);
  }
  
  return restoredText;
}

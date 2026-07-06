/**
 * Simple heuristic to detect if a message is written in English or Vietnamese.
 * Uses a scoring system to robustly handle queries with mixed content (e.g. English query with Vietnamese name).
 */
export function detectLanguage(text: string): 'vi' | 'en' {
  const normalized = text.toLowerCase().trim();

  // Split by non-alphanumeric/non-diacritic boundary to keep accented words intact
  const words = normalized.split(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỷỹỵđ]/i)
    .filter(Boolean);

  const viDiacritics = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỷỹỵđ]/i;

  const englishWords = [
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 
    'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'what', 'which', 
    'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 
    'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 
    'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 
    'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 
    'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 
    'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 
    'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 
    'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 
    'just', 'should', 'now', 'pain', 'fever', 'cough', 'symptom', 'doctor', 'appointment', 
    'schedule', 'book', 'hospital', 'clinic', 'medical', 'health', 'hello', 'hi', 'please', 
    'thanks', 'thank', 'help', 'chest', 'headache', 'clinical', 'care', 'show', 'record', 
    'patient', 'give', 'number', 'phone', 'email', 'id', 'card', 'personal', 'private'
  ];

  let viScore = 0;
  let enScore = 0;

  for (const w of words) {
    if (viDiacritics.test(w)) {
      viScore++;
    }
    if (englishWords.includes(w)) {
      enScore++;
    }
  }

  // If we have English words and they are at least as numerous as Vietnamese accented words, classify as English
  if (enScore > 0 && enScore >= viScore) {
    return 'en';
  }

  // Default fallback is Vietnamese
  return 'vi';
}

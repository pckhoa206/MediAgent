import { MEDICAL_DEPARTMENTS, matchDepartment } from './medical-departments';

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function matchDepartmentSemantic(
  query: string,
  apiKey?: string
): Promise<string | null> {
  // If no API key is provided, fallback to keyword matching
  if (!apiKey) {
    return matchDepartment(query);
  }

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key=${apiKey}`;

    const deptTexts = MEDICAL_DEPARTMENTS.map(
      (dept) => `${dept.name}: ${dept.description} Từ khóa: ${dept.keywords.join(', ')}`
    );

    const requests = [
      {
        model: 'models/text-embedding-004',
        content: { parts: [{ text: query }] },
      },
      ...deptTexts.map((text) => ({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] },
      })),
    ];

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    });

    if (!response.ok) {
      console.warn('Gemini embedding batch call failed, falling back to keywords. Status:', response.status);
      return matchDepartment(query);
    }

    const data = (await response.json()) as {
      embeddings?: Array<{ values: number[] }>;
    };

    if (!data.embeddings || data.embeddings.length !== requests.length) {
      console.warn('Invalid embeddings returned from Gemini, falling back to keywords.');
      return matchDepartment(query);
    }

    const queryVector = data.embeddings[0].values;
    const deptVectors = data.embeddings.slice(1).map((e) => e.values);

    let bestDeptIndex = -1;
    let highestSimilarity = -1;

    for (let i = 0; i < deptVectors.length; i++) {
      const similarity = cosineSimilarity(queryVector, deptVectors[i]);
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestDeptIndex = i;
      }
    }

    // Threshold of similarity to avoid completely irrelevant routing
    const SIMID_THRESHOLD = 0.35; 
    if (highestSimilarity >= SIMID_THRESHOLD && bestDeptIndex !== -1) {
      return MEDICAL_DEPARTMENTS[bestDeptIndex].name;
    }

    return null;
  } catch (error) {
    console.error('Error during semantic routing embedding, falling back to keywords:', error);
    return matchDepartment(query);
  }
}

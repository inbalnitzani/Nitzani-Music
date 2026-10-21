// Thin wrappers around the Gemini REST API (free tier).
// Needs the GEMINI_API_KEY secret: `supabase secrets set GEMINI_API_KEY=...`

const API = 'https://generativelanguage.googleapis.com/v1beta/models';
const EMBED_MODEL = 'gemini-embedding-2';
// Matches songs.embedding vector(1536); gemini-embedding-2 normalises truncated vectors itself
const EMBED_DIMENSIONS = 1536;
export const CHAT_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';

export class GeminiRateLimitError extends Error {}

async function call<T>(path: string, body: unknown): Promise<T> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const res = await fetch(`${API}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new GeminiRateLimitError(await res.text());
  if (!res.ok) throw new Error(`Gemini ${path} failed (${res.status}): ${await res.text()}`);
  return res.json() as Promise<T>;
}

// gemini-embedding-2 takes the retrieval task as a text prefix instead of a taskType
export const queryText = (query: string) => `task: search result | query: ${query}`;
export const documentText = (title: string | null, text: string) => `title: ${title || 'none'} | text: ${text}`;

export async function embed(text: string): Promise<number[]> {
  const data = await call<{ embedding: { values: number[] } }>(`${EMBED_MODEL}:embedContent`, {
    content: { parts: [{ text }] },
    embedContentConfig: { outputDimensionality: EMBED_DIMENSIONS },
  });
  return data.embedding.values;
}

export async function embedMany(texts: string[]): Promise<number[][]> {
  const data = await call<{ embeddings: { values: number[] }[] }>(`${EMBED_MODEL}:batchEmbedContents`, {
    requests: texts.map(text => ({
      model: `models/${EMBED_MODEL}`,
      content: { parts: [{ text }] },
      embedContentConfig: { outputDimensionality: EMBED_DIMENSIONS },
    })),
  });
  return data.embeddings.map(e => e.values);
}

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

/** Runs one generateContent call constrained to `schema` and returns the parsed JSON. */
export async function generateJson<T>(system: string, turns: ChatTurn[], schema: unknown): Promise<T> {
  const data = await call<{ candidates?: { content?: { parts?: { text?: string }[] } }[] }>(
    `${CHAT_MODEL}:generateContent`,
    {
      systemInstruction: { parts: [{ text: system }] },
      contents: turns.map(t => ({ role: t.role, parts: [{ text: t.text }] })),
      generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.7 },
    },
  );
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('');
  if (!text) throw new Error('Gemini returned no content');
  return JSON.parse(text) as T;
}

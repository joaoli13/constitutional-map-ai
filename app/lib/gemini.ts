const GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";
const GEMINI_EMBEDDING_DIMENSIONS = 768;
const RETRIEVAL_QUERY_TASK_TYPE = "RETRIEVAL_QUERY";

type GeminiEmbedResponse = {
  embedding?: {
    values?: unknown;
  };
};

export async function embedSemanticQuery(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: `models/${GEMINI_EMBEDDING_MODEL}`,
        content: {
          parts: [{text}],
        },
        taskType: RETRIEVAL_QUERY_TASK_TYPE,
        outputDimensionality: GEMINI_EMBEDDING_DIMENSIONS,
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Gemini embedding request failed with status ${response.status}: ${errorText}`,
    );
  }

  const payload = (await response.json()) as GeminiEmbedResponse;
  const values = payload.embedding?.values;
  if (!Array.isArray(values)) {
    throw new Error("Gemini embedding response did not include an embedding vector.");
  }

  return normalizeEmbedding(values, GEMINI_EMBEDDING_DIMENSIONS);
}

function normalizeEmbedding(values: unknown[], expectedDimensions: number) {
  if (values.length !== expectedDimensions) {
    throw new Error(
      `Embedding dimension mismatch: expected ${expectedDimensions}, got ${values.length}.`,
    );
  }

  const numericValues = values.map((value) => Number(value));
  if (numericValues.some((value) => !Number.isFinite(value))) {
    throw new Error("Embedding vector contains NaN or Infinity.");
  }

  const norm = Math.hypot(...numericValues);
  if (norm === 0) {
    throw new Error("Embedding vector has zero norm.");
  }

  return numericValues.map((value) => value / norm);
}

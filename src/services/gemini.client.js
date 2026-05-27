const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_GENERATE_MODEL = process.env.GEMINI_GENERATE_MODEL || "gemini-2.5-flash";
const DEFAULT_EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";

function getApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const err = new Error("GEMINI_API_KEY is not configured");
    err.status = 500;
    throw err;
  }

  return apiKey;
}

async function geminiRequest(path, body) {
  const apiKey = getApiKey();
  const url = `${GEMINI_API_BASE}/${path}?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = new Error(
      payload?.error?.message || "Gemini API request failed",
    );
    err.status = response.status;
    err.details = payload;
    throw err;
  }

  return payload;
}

export async function createEmbedding(text) {
  const payload = await geminiRequest(
    `models/${DEFAULT_EMBEDDING_MODEL}:embedContent`,
    {
      model: `models/${DEFAULT_EMBEDDING_MODEL}`,
      taskType: "RETRIEVAL_DOCUMENT",
      content: {
        parts: [{ text }],
      },
      outputDimensionality: 768,
    },
  );

  const values = payload?.embedding?.values;
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Gemini embedding response did not include embedding values");
  }

  return values;
}

export async function createQueryEmbedding(text) {
  const payload = await geminiRequest(
    `models/${DEFAULT_EMBEDDING_MODEL}:embedContent`,
    {
      model: `models/${DEFAULT_EMBEDDING_MODEL}`,
      taskType: "RETRIEVAL_QUERY",
      content: {
        parts: [{ text }],
      },
      outputDimensionality: 768,
    },
  );

  const values = payload?.embedding?.values;
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Gemini query embedding response did not include embedding values");
  }

  return values;
}

export async function generateUserAnswer({ question, context }) {
  const payload = await geminiRequest(
    `models/${DEFAULT_GENERATE_MODEL}:generateContent`,
    {
      systemInstruction: {
        parts: [
          {
            text:
              "You answer questions about application users using only the provided context. " +
              "Be concise, factual, and mention when the context is insufficient.",
          },
        ],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Context:\n${context}\n\nQuestion:\n${question}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.9,
        maxOutputTokens: 400,
      },
    },
  );

  const text =
    payload?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || "";

  if (!text) {
    throw new Error("Gemini generateContent response did not include text");
  }

  return text;
}

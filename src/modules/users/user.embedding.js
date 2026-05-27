import { createEmbedding } from "../../services/gemini.client.js";

export function buildUserEmbeddingText(user) {
  return [
    `username: ${user.username}`,
    `email: ${user.email}`,
    `role: ${user.role}`,
  ].join("\n");
}

export async function buildUserEmbedding(user) {
  return createEmbedding(buildUserEmbeddingText(user));
}

export function cosineSimilarity(vectorA = [], vectorB = []) {
  if (
    !Array.isArray(vectorA) ||
    !Array.isArray(vectorB) ||
    vectorA.length === 0 ||
    vectorB.length === 0 ||
    vectorA.length !== vectorB.length
  ) {
    return -1;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i += 1) {
    dot += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  if (normA === 0 || normB === 0) {
    return -1;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Splitting text into sliding-window chunks on word boundaries.
 */
export const chunkText = (text: string, chunkSize = 800, overlap = 150): string[] => {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + chunkSize;
    
    // Backtrack to find the last whitespace character to keep word intact
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(' ', end);
      if (lastSpace > start + (chunkSize / 2)) {
        end = lastSpace;
      }
    } else {
      end = text.length;
    }
    
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    
    start = end - overlap;
    
    // Prevent infinite loops or overflow
    if (start >= text.length || end === text.length) {
      break;
    }
  }
  return chunks;
};

export let lastEmbeddingFailed = false;

/**
 * Returns a 768-dimension vector embedding for text.
 * Integrates with Gemini text-embedding-004, or falls back to a deterministic local mock vector generator.
 */
export const getEmbedding = async (text: string): Promise<number[]> => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
    lastEmbeddingFailed = true;
    // Generate a deterministic mock 768-dimensional vector based on the string chars
    return Array.from({ length: 768 }, (_, i) => {
      const charCode = text.charCodeAt(i % text.length) || 32;
      return Math.sin(charCode + i) * 0.5; // bounded float between -0.5 and 0.5
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
      const result = await model.embedContent(text);
      lastEmbeddingFailed = false;
      return result.embedding.values;
    } catch (embedErr) {
      console.warn('[Embeddings] gemini-embedding-001 call failed, trying gemini-embedding-2 fallback...', embedErr);
      const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
      const result = await model.embedContent(text);
      lastEmbeddingFailed = false;
      return result.embedding.values;
    }
  } catch (err) {
    lastEmbeddingFailed = true;
    console.error('[Embeddings] Both Gemini embedding models failed, falling back to mock vectors:', err);
    return Array.from({ length: 768 }, (_, i) => {
      const charCode = text.charCodeAt(i % text.length) || 32;
      return Math.sin(charCode + i) * 0.5;
    });
  }
};

/**
 * Computes the cosine similarity between two float vectors.
 */
export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (vecA.length !== vecB.length) return 0;
  
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
};

const stopWords = new Set([
  'the', 'what', 'why', 'who', 'how', 'did', 'was', 'were', 'are', 'is', 'for', 'and', 'but', 'not', 'you', 'your', 'with', 'from', 'this', 'that', 'these', 'those', 'have', 'has', 'had', 'been', 'will', 'would', 'should', 'can', 'could', 'about', 'out', 'into', 'under', 'over', 'more', 'some', 'any', 'the'
]);

/**
 * Pure local keyword matching score (fallback).
 * Yields a float score between 0.0 and 1.0 representing how many query words exist in the target text.
 */
export const calculateKeywordScore = (query: string, text: string): number => {
  const queryTerms = query.toLowerCase()
    .split(/\W+/)
    .filter(t => t.length > 2 && !stopWords.has(t));
    
  if (queryTerms.length === 0) return 0;

  const targetText = text.toLowerCase();
  let matches = 0;
  
  for (const term of queryTerms) {
    if (targetText.includes(term)) {
      matches++;
    }
  }
  
  return matches / queryTerms.length;
};

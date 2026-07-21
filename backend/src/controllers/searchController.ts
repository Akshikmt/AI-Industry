import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { documentRepository, documentChunkRepository } from '../utils/db';
import { getEmbedding, cosineSimilarity, calculateKeywordScore, lastEmbeddingFailed } from '../services/embeddingService';

/**
 * Perform semantic similarity search across ingested text chunks.
 */
export const searchDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const { query, limit = 5 } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    console.log(`[Search] Performing search query: "${query}"`);

    // 1. Generate query vector embedding
    const queryVector = await getEmbedding(query);

    // 2. Fetch all document chunks and document references
    const allChunks = await documentChunkRepository.findAllChunks(req.user?.orgId);
    const allDocs = await documentRepository.findAll(req.user?.orgId);
    
    const docMap = new Map(allDocs.map(d => [d.id, d]));
    const hasApiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY';
    const useSemantic = hasApiKey && !lastEmbeddingFailed;

    // 3. Compute similarity scores
    const scoredChunks = allChunks.map(chunk => {
      const parentDoc = docMap.get(chunk.documentId);
      
      let score = 0;
      if (useSemantic) {
        // Semantic search
        score = cosineSimilarity(queryVector, chunk.embedding);
      } else {
        // Keyword overlap fallback (highly accurate for local dev testing)
        score = calculateKeywordScore(query, chunk.chunkText);
      }

      return {
        chunkId: chunk.id,
        documentId: chunk.documentId,
        documentTitle: parentDoc ? parentDoc.title : 'Unknown Document',
        documentUrl: parentDoc ? parentDoc.fileUrl : '',
        chunkText: chunk.chunkText,
        pageNumber: chunk.pageNumber,
        score: parseFloat(score.toFixed(4)),
        searchMethod: useSemantic ? 'vector_similarity' : 'keyword_overlap'
      };
    });

    // 4. Sort and limit results
    // Filter out very low matching scores
    const threshold = useSemantic ? 0.1 : 0.01;
    const sortedResults = scoredChunks
      .filter(item => item.score > threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return res.status(200).json({
      query,
      results: sortedResults,
      count: sortedResults.length,
      mode: useSemantic ? 'semantic' : 'keyword_fallback'
    });

  } catch (error) {
    console.error('Search endpoint error:', error);
    return res.status(500).json({ error: 'Internal server error occurred' });
  }
};

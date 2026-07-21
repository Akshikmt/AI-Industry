import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { 
  documentRepository, 
  documentChunkRepository, 
  assetRepository, 
  queryRepository, 
  activityLogRepository 
} from '../utils/db';
import { getEmbedding, cosineSimilarity, calculateKeywordScore, lastEmbeddingFailed } from '../services/embeddingService';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Handle AI Copilot questions using RAG (Retrieval-Augmented Generation)
 */
export const askCopilot = async (req: AuthRequest, res: Response) => {
  try {
    const { question, assetTag } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Question parameter is required' });
    }

    console.log(`[Copilot] Querying Copilot: "${question}" (Asset filter: ${assetTag || 'None'})`);

    // 1. Get embedding for the user's question
    const queryVector = await getEmbedding(question);

    // 2. Fetch all document chunks and documents
    const allChunks = await documentChunkRepository.findAllChunks(req.user?.orgId);
    const allDocs = await documentRepository.findAll(req.user?.orgId);
    const docMap = new Map(allDocs.map(d => [d.id, d]));

    // 3. Filter and score chunks (RAG)
    let filteredChunks = allChunks;
    if (assetTag) {
      const lowerTag = assetTag.toLowerCase();
      filteredChunks = allChunks.filter(c => c.chunkText.toLowerCase().includes(lowerTag));
      if (filteredChunks.length === 0) {
        filteredChunks = allChunks;
      }
    }

    const scoredChunks = filteredChunks.map(chunk => {
      const parentDoc = docMap.get(chunk.documentId);
      const hasApiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY';
      
      const useKeyword = !hasApiKey || lastEmbeddingFailed;
      const score = useKeyword
        ? calculateKeywordScore(question, chunk.chunkText)
        : cosineSimilarity(queryVector, chunk.embedding);

      return { chunk, doc: parentDoc, score };
    });

    // Sort descending and keep top 3 relevant chunks (raising threshold to 0.20 to filter out noise)
    const topMatches = scoredChunks
      .filter(item => item.score > 0.20)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // 4. Determine Confidence Score based on top match
    const topScore = topMatches.length > 0 ? topMatches[0].score : 0;
    let confidence = 0.3; // Default low confidence
    if (topScore > 0.7) confidence = 0.95;
    else if (topScore > 0.4) confidence = 0.75;
    else if (topScore > 0.15) confidence = 0.5;

    // 5. Generate Answer (Gemini RAG vs Local Fallback)
    let answer = '';
    const hasApiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY';
    
    // Assemble context content
    const contextText = topMatches
      .map((item, idx) => `[Document: ${item.doc?.title || 'Unknown'}]\n${item.chunk.chunkText}`)
      .join('\n\n');

    if (hasApiKey && topMatches.length > 0) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        
        const prompt = `INSTRUCTIONS:
You are an industrial AI copilot for maintenance and operations.
Your job is to answer questions using only the provided retrieved documents and metadata.

RULES:
1. Be concise, professional, and technically accurate.
2. Never invent facts that are not explicitly supported by the sources.
3. If the evidence suggests a likely cause, say "likely" or "probable cause" instead of stating certainty.
4. Format your output strictly in this exact enterprise template structure:

According to the [Document Name or Manual Title]:
- [Engineering fact 1]
- [Engineering fact 2, etc.]

Recommended Action:
[One-sentence direct recommended action, separated by a blank line]

5. Do not repeat facts or quote long passages.
6. Do not include sections for Confidence, Sources, or Related Assets in the text response, as they are already displayed in the UI layout (rendered in the dashboard cards).

CONTEXT SNIPPETS:
${contextText}

QUESTION:
${question}

ANSWER:`;

        try {
          console.log(`[Copilot] Attempting generation with gemini-2.5-flash...`);
          const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
          const result = await model.generateContent(prompt);
          answer = result.response.text().trim();
        } catch (err2_5: any) {
          console.warn(`[Copilot] gemini-2.5-flash call failed, trying gemini-1.5-flash fallback:`, err2_5?.message || err2_5);
          
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const result = await model.generateContent(prompt);
          answer = result.response.text().trim();
        }
      } catch (geminiErr: any) {
        console.error('[Copilot] Both Gemini models in RAG chain failed, falling back to local solver:', geminiErr?.message || geminiErr);
      }
    }

    // Local Solver Fallback (if no API key, or if API failed)
    if (!answer) {
      if (topMatches.length === 0) {
        answer = "I cannot answer this based on the ingested documentation. No relevant manual segments were found matching your query terms in the database.";
        confidence = 0.0;
      } else {
        // Compile matching snippets in a nice answer format
        answer = `Based on matched database documentation snippets:\n\n` + 
          topMatches.map((item, idx) => {
            const title = item.doc?.title || 'Unknown';
            return `From **[${title}]** (Match: ${(item.score * 100).toFixed(0)}%):\n"${item.chunk.chunkText}"`;
          }).join('\n\n') + 
          `\n\n*Note: Running in local fallback mode. Set GEMINI_API_KEY in your environment for contextual natural language answers.*`;
      }
    }

    // Grounding check override: if answer states it cannot answer or no context matches, set confidence to 0.0
    const lowerAnswer = answer.toLowerCase();
    if (
      topMatches.length === 0 ||
      lowerAnswer.includes('cannot answer') || 
      lowerAnswer.includes('do not contain') ||
      lowerAnswer.includes('does not contain') ||
      lowerAnswer.includes('no information') ||
      lowerAnswer.includes('i am sorry') ||
      lowerAnswer.includes('sorry')
    ) {
      confidence = 0.0;
    }

    // 6. Map Citations (Deduplicated by document title)
    const uniqueCitationsMap = new Map<string, any>();
    topMatches.forEach(item => {
      const docTitle = item.doc?.title || 'Unknown Document';
      if (!uniqueCitationsMap.has(docTitle)) {
        const excerpt = item.chunk.chunkText;
        const lines = excerpt.split(/\r?\n/);
        
        // Find the specific line that contains the section number and uppercase headline
        const headerLine = lines.find(line => /^\s*\d+\.\s*[A-Z0-9\s\-:]{4,}/.test(line));
        const sectionName = headerLine ? headerLine.trim() : 'General Content';

        uniqueCitationsMap.set(docTitle, {
          docTitle,
          fileUrl: item.doc?.fileUrl || '',
          excerpt,
          sectionName
        });
      }
    });
    
    let citations = Array.from(uniqueCitationsMap.values());

    // 7. Find Related Assets (Scan text for tags)
    const allAssets = await assetRepository.findAll(req.user?.orgId);
    let relatedAssets = allAssets.filter(asset => {
      const tag = asset.equipmentTag.toLowerCase();
      const name = asset.assetName.toLowerCase();
      return question.toLowerCase().includes(tag) || 
             answer.toLowerCase().includes(tag) ||
             question.toLowerCase().includes(name) ||
             answer.toLowerCase().includes(name);
    });

    // 8. Find Related Documents
    let relatedDocuments = topMatches
      .map(item => ({
        id: item.doc?.id || '',
        title: item.doc?.title || 'Unknown',
        fileUrl: item.doc?.fileUrl || ''
      }))
      .filter((v, i, self) => self.findIndex(t => t.id === v.id) === i);

    // If confidence is 0.0 (grounding refusal), clear all citations and assets shortcuts
    if (confidence === 0.0) {
      citations = [];
      relatedAssets = [];
      relatedDocuments = [];
    }

    // 9. Persist Query to History
    const queryLog = await queryRepository.create({
      userId: req.user?.id || 'SYSTEM',
      question,
      answer,
      confidence,
      orgId: req.user?.orgId
    });

    // 10. Write activity log audit
    await activityLogRepository.create({
      userId: req.user?.id || 'SYSTEM',
      action: 'ASK_COPILOT',
      targetId: queryLog.id,
      metadata: { 
        hasApiKey,
        confidence,
        citationsCount: citations.length,
        relatedAssetsCount: relatedAssets.length
      },
      orgId: req.user?.orgId
    }).catch(err => console.error('Failed to log ask activity:', err));

    return res.status(200).json({
      query: question,
      answer,
      confidence,
      citations,
      relatedAssets,
      relatedDocuments
    });

  } catch (error) {
    console.error('Copilot ask error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

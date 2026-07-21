import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../middleware/auth';
import { documentRepository, documentChunkRepository, activityLogRepository, assetRepository } from '../utils/db';
import { parseDocument } from '../services/parserService';
import { chunkText, getEmbedding } from '../services/embeddingService';
import { uploadFileToSupabase, DOCS_BUCKET } from '../services/supabaseService';

/**
 * Handle document uploads (restricted to Admins)
 */
export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, filename, mimetype, path: filePath } = req.file;

    // Check for duplicate document in workspace catalog
    const existingDocs = await documentRepository.findAll(req.user?.orgId);
    const duplicateDoc = existingDocs.find(
      d => d.title.toLowerCase().trim() === originalname.toLowerCase().trim()
    );

    if (duplicateDoc) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(409).json({
        error: `Duplicate Document Warning: "${originalname}" already exists in your workspace catalog.`
      });
    }

    // 1. Upload file to Supabase Storage bucket
    const fileUrl = await uploadFileToSupabase({
      filePath,
      fileName: originalname,
      mimeType: mimetype,
      bucket: DOCS_BUCKET
    });

    // 2. Create database record with Supabase public URL
    const doc = await documentRepository.create({
      title: originalname,
      fileUrl,
      fileType: mimetype,
      uploadedBy: req.user?.email || 'unknown',
      orgId: req.user?.orgId
    });

    // 2. Return 202 Accepted (processing started in background)
    res.status(202).json({
      message: 'File uploaded successfully, parsing started in background.',
      document: doc
    });

    // 3. Trigger background parsing (OCR -> Chunking -> Embeddings)
    // Run asynchronously to avoid blocking the main request thread
    (async () => {
      try {
        console.log(`[Ingestion] Starting background parse for Document: ${doc.id} (${originalname})`);
        await documentRepository.updateStatus(doc.id, 'processing');

        // Extract raw text (OCR if scanned)
        const extractedText = await parseDocument(filePath, mimetype);

        // Slice text into context blocks
        const textChunks = chunkText(extractedText);
        console.log(`[Ingestion] Sliced document ${doc.id} into ${textChunks.length} chunks. Generating embeddings...`);

        // Generate embeddings and store each chunk
        for (let i = 0; i < textChunks.length; i++) {
          const chunkStr = textChunks[i];
          const vector = await getEmbedding(chunkStr);
          
          await documentChunkRepository.create({
            documentId: doc.id,
            chunkText: chunkStr,
            embedding: vector,
            pageNumber: 1, // Defaults to 1 for MVP uploads
            orgId: req.user?.orgId
          });
        }

        // Set status to ready
        await documentRepository.updateStatus(doc.id, 'ready', extractedText);
        console.log(`[Ingestion] Document ${doc.id} chunking and embedding generation complete.`);

        // Auto-extract equipment tags (e.g., P-101, T-202, V-301) and create missing assets
        const tagRegex = /\b([A-Z]{1,3}-\d{2,4}[A-Z]?)\b/g;
        const detectedMatches = extractedText.match(tagRegex) || [];
        const uniqueTags = Array.from(new Set(detectedMatches.map(t => t.toUpperCase())));

        if (uniqueTags.length > 0) {
          const existingAssets = await assetRepository.findAll(req.user?.orgId);
          const existingTagsSet = new Set(existingAssets.map((a: any) => a.equipmentTag.toUpperCase().trim()));

          for (const tag of uniqueTags) {
            if (!existingTagsSet.has(tag)) {
              console.log(`[Ingestion] Auto-creating extracted asset tag: ${tag}`);
              const prefix = tag.charAt(0);
              let dept = 'Operations';
              let assetTypeName = 'Industrial Equipment';

              if (prefix === 'P') { dept = 'Operations'; assetTypeName = 'Pumping Unit'; }
              else if (prefix === 'T') { dept = 'Maintenance'; assetTypeName = 'Storage Tank'; }
              else if (prefix === 'V') { dept = 'Safety & Compliance'; assetTypeName = 'Pressure Valve'; }
              else if (prefix === 'C') { dept = 'Refinery Unit'; assetTypeName = 'Compressor Machine'; }
              else if (prefix === 'E') { dept = 'Electrical & Power'; assetTypeName = 'Electrical Exchanger'; }

              const newExtractedAsset = await assetRepository.create({
                assetName: `${assetTypeName} ${tag}`,
                equipmentTag: tag,
                department: dept,
                status: 'Optimal',
                description: `Auto-extracted during OCR ingestion of "${originalname}"`,
                orgId: req.user?.orgId
              });

              existingTagsSet.add(tag);

              await activityLogRepository.create({
                userId: req.user?.id || 'SYSTEM',
                action: 'AUTO_EXTRACT_ASSET',
                targetId: newExtractedAsset.id,
                metadata: { equipmentTag: tag, sourceDocument: originalname },
                orgId: req.user?.orgId
              });
            }
          }
        }

        // Log upload activity
        await activityLogRepository.create({
          userId: req.user?.id || 'SYSTEM',
          action: 'UPLOAD_DOCUMENT',
          targetId: doc.id,
          metadata: { title: originalname, chunksCount: textChunks.length, extractedTags: uniqueTags },
          orgId: req.user?.orgId
        });
      } catch (err: any) {
        console.error(`[Ingestion] Background processing failed for ${doc.id}:`, err);
        await documentRepository.updateStatus(doc.id, 'failed');
      }
    })();

  } catch (error) {
    console.error('Upload document error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all ingested documents (accessible by Admin & Employee)
 */
export const getAllDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const documents = await documentRepository.findAll(req.user?.orgId);
    return res.status(200).json({ documents });
  } catch (error) {
    console.error('Get documents error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete document and its associated file (restricted to Admins)
 */
export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Fetch document metadata
    const doc = await documentRepository.findById(id, req.user?.orgId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // 2. Delete physical file from disk
    const filename = path.basename(doc.fileUrl);
    const filePath = path.join(__dirname, '../../uploads', filename);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath).catch(err => {
        console.error(`[Cleanup] Failed to delete file: ${filePath}`, err);
      });
    }

    // 3. Delete document chunks from vector repository
    await documentChunkRepository.deleteByDocumentId(id);
    console.log(`[Cleanup] Dropped vector chunks associated with document: ${id}`);

    // 4. Delete document record
    await documentRepository.delete(id);

    // 5. Log deletion audit log
    await activityLogRepository.create({
      userId: req.user?.id || 'SYSTEM',
      action: 'DELETE_DOCUMENT',
      targetId: id,
      metadata: { title: doc.title },
      orgId: req.user?.orgId
    }).catch(err => console.error('Failed to log delete activity:', err));

    return res.status(200).json({ message: 'Document and associated chunks deleted successfully.' });
  } catch (error) {
    console.error('Delete document error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

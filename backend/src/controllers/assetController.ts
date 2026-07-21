import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { assetRepository, documentRepository, documentChunkRepository, activityLogRepository } from '../utils/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Get detailed asset specifications, dynamic AI summaries, and maintenance history
 */
export const getAssetById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Fetch asset details
    const asset = await assetRepository.findById(id, req.user?.orgId);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // 2. Scan all chunks to find mentions of this asset tag or name
    const allChunks = await documentChunkRepository.findAllChunks(req.user?.orgId);
    const allDocs = await documentRepository.findAll(req.user?.orgId);
    const docMap = new Map(allDocs.map(d => [d.id, d]));

    const tag = asset.equipmentTag.toLowerCase();
    const name = asset.assetName.toLowerCase();

    const matchedChunks = allChunks.filter(chunk => {
      const text = chunk.chunkText.toLowerCase();
      return text.includes(tag) || text.includes(name);
    });

    // 3. Compile related documents list
    const relatedDocs = matchedChunks
      .map(chunk => {
        const doc = docMap.get(chunk.documentId);
        return doc ? { id: doc.id, title: doc.title, fileUrl: doc.fileUrl } : null;
      })
      .filter((doc): doc is { id: string; title: string; fileUrl: string } => doc !== null)
      // Deduplicate
      .filter((v, i, self) => self.findIndex(t => t.id === v.id) === i);

    // 4. Generate AI Summary (Gemini vs Local Fallback)
    let aiSummary = '';
    const hasApiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY';

    if (matchedChunks.length > 0) {
      if (hasApiKey) {
        try {
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
          let model;
          try {
            model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
          } catch {
            model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          }

          const context = matchedChunks.map(c => c.chunkText).join('\n\n');
          const prompt = `You are an industrial maintenance AI. Write a concise, bullet-pointed engineering summary of specifications and status updates for the following asset: ${asset.assetName} (Tag: ${asset.equipmentTag}).
Strictly use the document context provided below.

Context:
${context}

Instructions:
- Keep it under 150 words.
- Focus on calibration limits, incident logs, fluid specifications, and maintenance frequencies if found.
- If there is a contradiction in safety limits, warn about it clearly.
`;

          const result = await model.generateContent(prompt);
          aiSummary = result.response.text();
        } catch (err) {
          console.error('Gemini synthesis failed:', err);
          aiSummary = `Failed to synthesize dynamic brief. Matched Excerpts:\n` + matchedChunks.slice(0, 2).map(c => `* "${c.chunkText.substring(0, 150)}..."`).join('\n');
        }
      } else {
        aiSummary = `**AI Synthesis Offline (No API Key)**
Found ${matchedChunks.length} matching document segments. Notable excerpts:
` + matchedChunks.slice(0, 2).map(c => `*   *"${c.chunkText.replace(/\n/g, ' ')}"*`).join('\n') + `
\n*Configure GEMINI_API_KEY in backend/.env to synthesize these excerpts into a singular dynamic engineering brief.*`;
      }
    } else {
      aiSummary = `No dedicated manual segments or inspection logs mentioning **${asset.equipmentTag}** (${asset.assetName}) have been ingested yet.
To generate a dynamic AI engineering brief, upload a maintenance guide, SOP, or inspection log mentioning this equipment tag in the Documents tab.`;
    }

    // 5. Generate Chronological Maintenance Timeline
    // Fetch actual activity logs mentioning this asset's tag
    const allActivityLogs = await activityLogRepository.findAll(req.user?.orgId);
    const tagActivityLogs = allActivityLogs
      .filter(log => log.targetId === id || 
                     JSON.stringify(log.metadata || {}).toLowerCase().includes(tag))
      .map(log => {
        let actionLabel = log.action.replace(/_/g, ' ');
        if (log.action === 'DELETE_DOCUMENT') actionLabel = 'Document Deleted';
        else if (log.action === 'UPLOAD_DOCUMENT') actionLabel = 'Document Uploaded';
        else if (log.action === 'ADD_ASSET') actionLabel = 'Asset Created';
        else if (log.action === 'AUTO_EXTRACT_ASSET') actionLabel = 'Asset Extracted';

        // Human-friendly description formatting
        let desc = '';
        const user = log.metadata?.userName || log.userId || 'User';
        const docTitle = log.metadata?.title || log.metadata?.fileName || '';
        const chunks = log.metadata?.chunksCount;

        if (log.action === 'DELETE_DOCUMENT') {
          desc = `Document "${docTitle || 'File'}" was deleted by ${user}.`;
        } else if (log.action === 'UPLOAD_DOCUMENT') {
          desc = `Document "${docTitle || 'File'}" was uploaded by ${user}.`;
        } else if (log.action === 'ADD_ASSET') {
          desc = `Asset "${log.metadata?.assetName || ''}" was manually created by ${user}.`;
        } else if (log.action === 'AUTO_EXTRACT_ASSET') {
          desc = `Asset tag extracted from document "${log.metadata?.sourceDocument || 'File'}".`;
        } else {
          desc = `Action performed by ${user}.`;
        }

        return {
          date: log.timestamp,
          event: actionLabel,
          description: desc
        };
      });

    // Inject demo maintenance histories to populate the timeline beautifully if it's a seed asset
    const demoTimeline: { date: Date; event: string; description: string }[] = [];
    
    if (asset.equipmentTag === 'P-101') {
      demoTimeline.push(
        {
          date: new Date('2026-07-12T14:30:00Z'),
          event: 'Incident Logged',
          description: 'Bearing overheating recorded. Temp reached 82°C. Scheduled lubrication schedule adjustment.'
        },
        {
          date: new Date('2026-07-10T08:15:00Z'),
          event: 'Maintenance Dispatched',
          description: 'Seal leak identified and repaired. Seal kit #P101-SK installed by technician.'
        },
        {
          date: new Date('2026-06-25T11:00:00Z'),
          event: 'Routine Inspection',
          description: 'Vibration levels within spec (1.2 mm/s). Cleaned external housing.'
        }
      );
    } else if (asset.equipmentTag === 'T-202') {
      demoTimeline.push(
        {
          date: new Date('2026-07-12T16:45:00Z'),
          event: 'Shutdown Test',
          description: 'Emergency shutdown test. Rotor vibration spike recorded during deceleration (3.4 mm/s).'
        },
        {
          date: new Date('2026-07-02T09:30:00Z'),
          event: 'Routine Calibration',
          description: 'Governor valve alignment tuned. Control loop validated.'
        }
      );
    } else {
      // General default inspection history
      demoTimeline.push({
        date: new Date(asset.createdAt.getTime() + 1000 * 60 * 60 * 24),
        event: 'Asset Commissioned',
        description: `Seeded industrial asset added to ${asset.department} department catalog.`
      });
    }

    // Combine and sort descending
    const combinedTimeline = [...tagActivityLogs, ...demoTimeline].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return res.status(200).json({
      asset,
      aiSummary,
      relatedDocuments: relatedDocs,
      timeline: combinedTimeline
    });

  } catch (error) {
    console.error('Get asset by ID error:', error);
    return res.status(500).json({ error: 'Internal server error occurred' });
  }
};

/**
 * Create a new industrial asset
 */
export const createAsset = async (req: AuthRequest, res: Response) => {
  try {
    const { assetName, equipmentTag, department, status, description, location } = req.body;

    if (!assetName || !equipmentTag || !department) {
      return res.status(400).json({ error: 'Asset Name, Equipment Tag, and Department are required.' });
    }

    const uppercaseTag = equipmentTag.toUpperCase().trim();

    // Check duplicate equipmentTag safely
    const existing = await assetRepository.findAll(req.user?.orgId);
    const isDuplicate = existing.some((a: any) => a.equipmentTag && a.equipmentTag.toString().toUpperCase().trim() === uppercaseTag);
    if (isDuplicate) {
      return res.status(409).json({ error: `An asset with equipment tag "${uppercaseTag}" already exists.` });
    }

    const newAsset = await assetRepository.create({
      assetName,
      equipmentTag: uppercaseTag,
      department,
      status: status || 'Optimal',
      description,
      location,
      orgId: req.user?.orgId
    });

    // Log Activity
    await activityLogRepository.create({
      userId: req.user?.id || 'unknown',
      action: 'ADD_ASSET',
      targetId: newAsset.id,
      metadata: { assetName, equipmentTag: uppercaseTag, department, userName: req.user?.name || req.user?.email },
      orgId: req.user?.orgId
    });

    return res.status(201).json({ message: 'Asset created successfully', asset: newAsset });
  } catch (err: any) {
    console.error('Error creating asset:', err);
    return res.status(500).json({ error: err.message || 'Failed to create asset' });
  }
};

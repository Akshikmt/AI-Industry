import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { 
  assetRepository, 
  documentRepository, 
  documentChunkRepository, 
  activityLogRepository,
  userRepository
} from '../utils/db';

/**
 * Compile industrial knowledge graph nodes and directional links
 */
export const getKnowledgeGraph = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Retrieve all catalog entities
    const assets = await assetRepository.findAll(req.user?.orgId);
    const documents = await documentRepository.findAll(req.user?.orgId);
    const chunks = await documentChunkRepository.findAllChunks(req.user?.orgId);
    const logs = await activityLogRepository.findAll(req.user?.orgId);
    const realUsers = req.user?.orgId ? await userRepository.findByOrgId(req.user.orgId) : [];

    const nodes: any[] = [];
    const links: any[] = [];
    const nodeIds = new Set<string>();

    // Helper to safely add nodes without duplicates
    const addNode = (id: string, label: string, type: 'department' | 'user' | 'asset' | 'document' | 'log', val = 1) => {
      if (!nodeIds.has(id)) {
        nodes.push({ id, label, type, val });
        nodeIds.add(id);
      }
    };

    // Helper to safely add links
    const addLink = (source: string, target: string, label: string) => {
      // Only link if both nodes exist
      if (nodeIds.has(source) && nodeIds.has(target)) {
        // Prevent exact duplicate links
        const exists = links.some(l => l.source === source && l.target === target && l.label === label);
        if (!exists) {
          links.push({ source, target, label });
        }
      }
    };

    // 2. Insert Department Nodes (Root Hubs)
    const departments = ['Operations', 'Maintenance', 'Safety'];
    departments.forEach(dept => {
      addNode(dept.toLowerCase(), dept, 'department', 3);
    });

    // 3. Insert User Nodes (Real database users only)
    const usersMap = new Map<string, { email: string; name: string; role: string }>();

    // Add real registered workspace users
    realUsers.forEach((u: any) => {
      if (u.email) {
        const lower = u.email.toLowerCase();
        usersMap.set(lower, {
          email: lower,
          name: u.name || lower.split('@')[0],
          role: u.role === 'admin' ? 'Admin' : 'Operator'
        });
      }
    });

    // Add current session user if missing
    if (req.user?.email && !usersMap.has(req.user.email.toLowerCase())) {
      const lower = req.user.email.toLowerCase();
      usersMap.set(lower, {
        email: lower,
        name: req.user.name || lower.split('@')[0],
        role: req.user.role === 'admin' ? 'Admin' : 'Operator'
      });
    }

    // Add users from document uploaders
    documents.forEach(d => {
      if (d.uploadedBy) {
        const lower = d.uploadedBy.toLowerCase();
        if (!usersMap.has(lower)) {
          usersMap.set(lower, {
            email: lower,
            name: lower.split('@')[0],
            role: lower.includes('admin') ? 'Admin' : 'Operator'
          });
        }
      }
    });

    usersMap.forEach((userInfo, email) => {
      const displayName = userInfo.name.charAt(0).toUpperCase() + userInfo.name.slice(1);
      addNode(email, `${displayName} (${userInfo.role})`, 'user', 1.8);
      
      // Link user to their department
      const dept = userInfo.role === 'Admin' ? 'maintenance' : 'operations';
      addLink(email, dept, 'member_of');
    });

    // 4. Insert Asset Nodes
    assets.forEach((asset, idx) => {
      addNode(asset.id, `${asset.assetName} (${asset.equipmentTag})`, 'asset', 2.5);
      
      // Link asset to its department
      addLink(asset.id, asset.department.toLowerCase(), 'belongs_to');

      // Link asset to assigned user/operator so assets remain connected even if department layer is hidden
      const userList = Array.from(usersMap.keys());
      if (userList.length > 0) {
        const assignedUser = userList[idx % userList.length];
        addLink(asset.id, assignedUser, 'assigned_to');
      }
    });

    // 5. Insert Document Nodes
    documents.forEach(doc => {
      addNode(doc.id, doc.title, 'document', 2);
      
      // Link document to its uploader user node
      const uploader = doc.uploadedBy.toLowerCase();
      addLink(doc.id, uploader, 'uploaded_by');
    });

    // 6. Scan text chunks to link Documents to Assets dynamically
    // Only link if the document node is currently active and exists in catalog
    const documentIdsSet = new Set(documents.map(d => d.id));
    chunks.forEach(chunk => {
      if (!documentIdsSet.has(chunk.documentId)) return;

      const text = chunk.chunkText.toLowerCase();
      
      assets.forEach(asset => {
        const tag = asset.equipmentTag.toLowerCase();
        const name = asset.assetName.toLowerCase();
        
        if (text.includes(tag) || text.includes(name)) {
          addLink(chunk.documentId, asset.id, 'mentions');
        }
      });
    });

    // 7. Insert Log/Timeline Event Nodes
    // Add logs that contain warning/incidents as nodes and link to assets
    const incidentLogs = logs.filter(
      l => l.action === 'UPLOAD_DOCUMENT' || l.action === 'DELETE_DOCUMENT' || l.action === 'ASK_COPILOT'
    );
    
    // Limit to recent 10 logs to avoid over-cluttering the graph view
    incidentLogs.slice(0, 10).forEach(log => {
      const logNodeId = `log-${log.id}`;
      const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      addNode(logNodeId, `${log.action.replace('_', ' ')} (${timeStr})`, 'log', 1.2);
      
      // Link log to its initiator user
      const userKey = log.userId.toLowerCase();
      addLink(logNodeId, userKey, 'triggered_by');

      // Link log to target document/query if matching
      if (log.targetId) {
        addLink(logNodeId, log.targetId, 'concerns');
      }
    });

    console.log(`[Graph] Knowledge graph compiled. Nodes: ${nodes.length}, Links: ${links.length}`);

    return res.status(200).json({ nodes, links });

  } catch (error) {
    console.error('Compile Knowledge Graph error:', error);
    return res.status(500).json({ error: 'Internal server error occurred' });
  }
};

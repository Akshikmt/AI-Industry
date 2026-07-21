import fs from 'fs';
import path from 'path';
import { IDocumentChunkRepository, DocumentChunk } from './types';

const DB_FILE = path.join(__dirname, '../../db.json');

const readDB = async (): Promise<{ users: any[]; assets: any[]; logs: any[]; documents: any[]; chunks: any[] }> => {
  const data = await fs.promises.readFile(DB_FILE, 'utf-8');
  const parsed = JSON.parse(data);
  if (!parsed.chunks) {
    parsed.chunks = [];
  }
  return parsed;
};

const writeDB = async (data: { users: any[]; assets: any[]; logs: any[]; documents: any[]; chunks: any[] }) => {
  await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2));
};

export class JsonDocumentChunkRepository implements IDocumentChunkRepository {
  async create(chunk: Omit<DocumentChunk, 'id' | 'createdAt'> & { orgId?: string }): Promise<DocumentChunk> {
    const db = await readDB();
    const newChunk: DocumentChunk = {
      id: Math.random().toString(36).substr(2, 9),
      ...chunk,
      createdAt: new Date()
    };
    db.chunks.push(newChunk);
    await writeDB(db);
    return newChunk;
  }

  async findByDocumentId(documentId: string): Promise<DocumentChunk[]> {
    const db = await readDB();
    return db.chunks
      .filter(c => c.documentId === documentId)
      .map(c => ({ ...c, createdAt: new Date(c.createdAt) }));
  }

  async deleteByDocumentId(documentId: string): Promise<boolean> {
    const db = await readDB();
    const filtered = db.chunks.filter(c => c.documentId !== documentId);
    if (filtered.length === db.chunks.length) return false;
    db.chunks = filtered;
    await writeDB(db);
    return true;
  }

  async findAllChunks(orgId?: string): Promise<DocumentChunk[]> {
    const db = await readDB();
    const list = orgId ? db.chunks.filter(c => c.orgId === orgId) : db.chunks;
    return list.map(c => ({ ...c, createdAt: new Date(c.createdAt) }));
  }
}

import fs from 'fs';
import path from 'path';
import { IDocumentRepository, Document } from './types';

const DB_FILE = path.join(__dirname, '../../db.json');

const readDB = async (): Promise<{ users: any[]; assets: any[]; logs: any[]; documents: any[] }> => {
  const data = await fs.promises.readFile(DB_FILE, 'utf-8');
  const parsed = JSON.parse(data);
  if (!parsed.documents) {
    parsed.documents = [];
  }
  return parsed;
};

const writeDB = async (data: { users: any[]; assets: any[]; logs: any[]; documents: any[] }) => {
  await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2));
};

export class JsonDocumentRepository implements IDocumentRepository {
  async create(doc: Omit<Document, 'id' | 'status' | 'createdAt' | 'extractedText'> & { orgId?: string }): Promise<Document> {
    const db = await readDB();
    const newDoc: Document = {
      id: Math.random().toString(36).substr(2, 9),
      ...doc,
      status: 'pending',
      createdAt: new Date()
    };
    db.documents.push(newDoc);
    await writeDB(db);
    return newDoc;
  }

  async findAll(orgId?: string): Promise<Document[]> {
    const db = await readDB();
    const filtered = orgId ? db.documents.filter(d => d.orgId === orgId) : db.documents;
    
    // Sort descending by date
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return sorted.map(d => ({ ...d, createdAt: new Date(d.createdAt) }));
  }

  async findById(id: string, orgId?: string): Promise<Document | null> {
    const db = await readDB();
    const d = db.documents.find(doc => doc.id === id && (!orgId || doc.orgId === orgId));
    return d ? { ...d, createdAt: new Date(d.createdAt) } : null;
  }

  async updateStatus(id: string, status: Document['status'], extractedText?: string): Promise<Document | null> {
    const db = await readDB();
    const idx = db.documents.findIndex(doc => doc.id === id);
    if (idx === -1) return null;
    
    db.documents[idx].status = status;
    if (extractedText !== undefined) {
      db.documents[idx].extractedText = extractedText;
    }
    
    await writeDB(db);
    return { ...db.documents[idx], createdAt: new Date(db.documents[idx].createdAt) };
  }

  async delete(id: string): Promise<boolean> {
    const db = await readDB();
    const filtered = db.documents.filter(doc => doc.id !== id);
    if (filtered.length === db.documents.length) return false;
    db.documents = filtered;
    await writeDB(db);
    return true;
  }
}

import fs from 'fs';
import path from 'path';
import { IQueryRepository, Query } from './types';

const DB_FILE = path.join(__dirname, '../../db.json');

const readDB = async (): Promise<{ users: any[]; assets: any[]; logs: any[]; documents: any[]; chunks: any[]; queries: any[] }> => {
  const data = await fs.promises.readFile(DB_FILE, 'utf-8');
  const parsed = JSON.parse(data);
  if (!parsed.queries) {
    parsed.queries = [];
  }
  return parsed;
};

const writeDB = async (data: { users: any[]; assets: any[]; logs: any[]; documents: any[]; chunks: any[]; queries: any[] }) => {
  await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2));
};

export class JsonQueryRepository implements IQueryRepository {
  async create(query: Omit<Query, 'id' | 'createdAt'> & { orgId?: string }): Promise<Query> {
    const db = await readDB();
    const newQuery: Query = {
      id: Math.random().toString(36).substr(2, 9),
      ...query,
      createdAt: new Date()
    };
    db.queries.push(newQuery);
    await writeDB(db);
    return newQuery;
  }

  async findByUserId(userId: string, orgId?: string): Promise<Query[]> {
    const db = await readDB();
    
    // Sort descending by date
    const sorted = [...db.queries]
      .filter(q => q.userId === userId && (!orgId || q.orgId === orgId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
    return sorted.map(q => ({ ...q, createdAt: new Date(q.createdAt) }));
  }
}

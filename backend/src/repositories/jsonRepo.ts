import fs from 'fs';
import path from 'path';
import { 
  IUserRepository, 
  IAssetRepository, 
  IActivityLogRepository, 
  IOrganizationRepository,
  User, 
  Asset, 
  ActivityLog,
  Organization
} from './types';

const DB_FILE = path.join(__dirname, '../../db.json');

const initDB = () => {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], assets: [], logs: [], organizations: [] }, null, 2));
  }
};

const readDB = async (): Promise<{ users: any[]; assets: any[]; logs: any[]; organizations: any[] }> => {
  initDB();
  const data = await fs.promises.readFile(DB_FILE, 'utf-8');
  const parsed = JSON.parse(data);
  if (!parsed.organizations) {
    parsed.organizations = [];
  }
  return parsed;
};

const writeDB = async (data: { users: any[]; assets: any[]; logs: any[]; organizations: any[] }) => {
  await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2));
};

export class JsonUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const db = await readDB();
    const u = db.users.find(user => user.email.toLowerCase() === email.toLowerCase());
    return u ? { ...u, createdAt: new Date(u.createdAt) } : null;
  }

  async findById(id: string): Promise<User | null> {
    const db = await readDB();
    const u = db.users.find(user => user.id === id);
    if (!u) return null;
    const { password, ...rest } = u; // strip password
    return { ...rest, createdAt: new Date(u.createdAt) } as User;
  }

  async findByOrgId(orgId: string): Promise<User[]> {
    const db = await readDB();
    const list = db.users.filter(u => u.orgId === orgId);
    return list.map(u => ({ ...u, createdAt: new Date(u.createdAt) }));
  }

  async create(user: Omit<User, 'id' | 'createdAt'> & { password?: string }): Promise<User> {
    const db = await readDB();
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      ...user,
      createdAt: new Date()
    };
    db.users.push(newUser);
    await writeDB(db);
    return newUser;
  }

  async count(): Promise<number> {
    const db = await readDB();
    return db.users.length;
  }

  async update(id: string, user: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    const db = await readDB();
    const idx = db.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    db.users[idx] = { ...db.users[idx], ...user };
    await writeDB(db);
    return { ...db.users[idx], createdAt: new Date(db.users[idx].createdAt) };
  }

  async delete(id: string): Promise<boolean> {
    const db = await readDB();
    const originalLen = db.users.length;
    db.users = db.users.filter(u => u.id !== id);
    await writeDB(db);
    return db.users.length < originalLen;
  }
}

export class JsonAssetRepository implements IAssetRepository {
  async findAll(orgId?: string): Promise<Asset[]> {
    const db = await readDB();
    const list = orgId ? db.assets.filter(a => a.orgId === orgId) : db.assets;
    return list.map(a => ({ ...a, createdAt: new Date(a.createdAt) }));
  }

  async findById(id: string, orgId?: string): Promise<Asset | null> {
    const db = await readDB();
    const a = db.assets.find(asset => asset.id === id && (!orgId || asset.orgId === orgId));
    return a ? { ...a, createdAt: new Date(a.createdAt) } : null;
  }

  async create(asset: Omit<Asset, 'id' | 'createdAt'>): Promise<Asset> {
    const db = await readDB();
    const newAsset: Asset = {
      id: Math.random().toString(36).substr(2, 9),
      ...asset,
      createdAt: new Date()
    };
    db.assets.push(newAsset);
    await writeDB(db);
    return newAsset;
  }

  async count(): Promise<number> {
    const db = await readDB();
    return db.assets.length;
  }
}

export class JsonActivityLogRepository implements IActivityLogRepository {
  async create(log: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<ActivityLog> {
    const db = await readDB();
    const newLog: ActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      ...log,
      timestamp: new Date()
    };
    db.logs.push(newLog);
    await writeDB(db);
    return newLog;
  }

  async findAll(orgId?: string): Promise<ActivityLog[]> {
    const db = await readDB();
    const usersMap = new Map(db.users.map(u => [u.id, u.email]));
    
    const filtered = orgId ? db.logs.filter(l => l.orgId === orgId) : db.logs;
    
    // Sort logs descending
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return sorted.map(l => ({
      id: l.id,
      userId: usersMap.get(l.userId) || l.userId, // Map ID to Email if found, else ID
      action: l.action,
      targetId: l.targetId,
      metadata: l.metadata,
      timestamp: new Date(l.timestamp),
      orgId: l.orgId
    }));
  }
}

export class JsonOrganizationRepository implements IOrganizationRepository {
  async create(org: Omit<Organization, 'id' | 'createdAt'>): Promise<Organization> {
    const db = await readDB();
    const newOrg: Organization = {
      id: Math.random().toString(36).substr(2, 9),
      ...org,
      createdAt: new Date()
    };
    db.organizations.push(newOrg);
    await writeDB(db);
    return newOrg;
  }

  async findById(id: string): Promise<Organization | null> {
    const db = await readDB();
    const o = db.organizations.find(org => org.id === id);
    return o ? { ...o, createdAt: new Date(o.createdAt) } : null;
  }

  async update(id: string, org: Partial<Omit<Organization, 'id' | 'createdAt'>>): Promise<Organization | null> {
    const db = await readDB();
    const idx = db.organizations.findIndex(o => o.id === id);
    if (idx === -1) return null;
    const updatedOrg = {
      ...db.organizations[idx],
      ...org
    };
    db.organizations[idx] = updatedOrg;
    await writeDB(db);
    return { ...updatedOrg, createdAt: new Date(updatedOrg.createdAt) };
  }
}

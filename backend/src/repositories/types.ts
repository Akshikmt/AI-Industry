export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'employee';
  createdAt: Date;
  orgId?: string;
  dob?: string;
  phoneNumber?: string;
  designation?: string;
  department?: string;
  profilePhoto?: string;
  notes?: string;
  addressLine1?: string;
  addressLine2?: string;
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
  hasLoggedIn?: boolean;
  status?: 'Active' | 'Inactive' | 'Pending';
  employeeId?: string;
  officeLocation?: string;
  reportingManager?: string;
}

export interface Asset {
  id: string;
  assetName: string;
  equipmentTag: string;
  department: string;
  status?: string;
  description?: string;
  location?: string;
  createdAt: Date;
  orgId?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  targetId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  orgId?: string;
}

export interface Document {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string;
  uploadedBy: string; // email of the user who uploaded
  status: 'pending' | 'processing' | 'ready' | 'failed';
  extractedText?: string;
  createdAt: Date;
  orgId?: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkText: string;
  embedding: number[];
  pageNumber: number;
  createdAt: Date;
  orgId?: string;
}

export interface Query {
  id: string;
  userId: string;
  question: string;
  answer: string;
  confidence: number;
  createdAt: Date;
  orgId?: string;
}

export interface Organization {
  id: string;
  name: string;
  industryType?: string;
  companySize?: string;
  addressLine1?: string;
  addressLine2?: string;
  zipCode?: string;
  country?: string;
  state?: string;
  city?: string;
  logo?: string;
  createdAt: Date;
}

export interface IOrganizationRepository {
  create(org: Omit<Organization, 'id' | 'createdAt'>): Promise<Organization>;
  findById(id: string): Promise<Organization | null>;
  update(id: string, org: Partial<Omit<Organization, 'id' | 'createdAt'>>): Promise<Organization | null>;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByOrgId(orgId: string): Promise<User[]>;
  create(user: Omit<User, 'id' | 'createdAt'> & { password?: string }): Promise<User>;
  count(): Promise<number>;
  update(id: string, user: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}

export interface IAssetRepository {
  findAll(orgId?: string): Promise<Asset[]>;
  findById(id: string, orgId?: string): Promise<Asset | null>;
  create(asset: Omit<Asset, 'id' | 'createdAt'>): Promise<Asset>;
  count(): Promise<number>;
}

export interface IActivityLogRepository {
  create(log: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<ActivityLog>;
  findAll(orgId?: string): Promise<ActivityLog[]>;
}

export interface IDocumentRepository {
  create(doc: Omit<Document, 'id' | 'status' | 'createdAt' | 'extractedText'>): Promise<Document>;
  findAll(orgId?: string): Promise<Document[]>;
  findById(id: string, orgId?: string): Promise<Document | null>;
  updateStatus(id: string, status: Document['status'], extractedText?: string): Promise<Document | null>;
  delete(id: string): Promise<boolean>;
}

export interface IDocumentChunkRepository {
  create(chunk: Omit<DocumentChunk, 'id' | 'createdAt'>): Promise<DocumentChunk>;
  findByDocumentId(documentId: string): Promise<DocumentChunk[]>;
  deleteByDocumentId(documentId: string): Promise<boolean>;
  findAllChunks(orgId?: string): Promise<DocumentChunk[]>;
}

export interface IQueryRepository {
  create(query: Omit<Query, 'id' | 'createdAt'>): Promise<Query>;
  findByUserId(userId: string, orgId?: string): Promise<Query[]>;
}

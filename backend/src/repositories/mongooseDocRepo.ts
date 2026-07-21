import { IDocumentRepository, Document } from './types';
import DocumentModel from '../models/Document';

export class MongooseDocumentRepository implements IDocumentRepository {
  async create(doc: Omit<Document, 'id' | 'status' | 'createdAt' | 'extractedText'> & { orgId?: string }): Promise<Document> {
    const d = await DocumentModel.create({
      ...doc,
      status: 'pending'
    });
    return {
      id: d._id.toString(),
      title: d.title,
      fileUrl: d.fileUrl,
      fileType: d.fileType,
      uploadedBy: d.uploadedBy,
      status: d.status,
      createdAt: d.createdAt,
      orgId: d.orgId
    };
  }

  async findAll(orgId?: string): Promise<Document[]> {
    const list = await DocumentModel.find(orgId ? { orgId } : {}).sort({ createdAt: -1 });
    return list.map(d => ({
      id: d._id.toString(),
      title: d.title,
      fileUrl: d.fileUrl,
      fileType: d.fileType,
      uploadedBy: d.uploadedBy,
      status: d.status,
      extractedText: d.extractedText,
      createdAt: d.createdAt,
      orgId: d.orgId
    }));
  }

  async findById(id: string, orgId?: string): Promise<Document | null> {
    const d = await DocumentModel.findOne({ _id: id, ...(orgId ? { orgId } : {}) });
    if (!d) return null;
    return {
      id: d._id.toString(),
      title: d.title,
      fileUrl: d.fileUrl,
      fileType: d.fileType,
      uploadedBy: d.uploadedBy,
      status: d.status,
      extractedText: d.extractedText,
      createdAt: d.createdAt,
      orgId: d.orgId
    };
  }

  async updateStatus(id: string, status: Document['status'], extractedText?: string): Promise<Document | null> {
    const update: any = { status };
    if (extractedText !== undefined) {
      update.extractedText = extractedText;
    }
    const d = await DocumentModel.findByIdAndUpdate(id, update, { new: true });
    if (!d) return null;
    return {
      id: d._id.toString(),
      title: d.title,
      fileUrl: d.fileUrl,
      fileType: d.fileType,
      uploadedBy: d.uploadedBy,
      status: d.status,
      extractedText: d.extractedText,
      createdAt: d.createdAt,
      orgId: d.orgId
    };
  }

  async delete(id: string): Promise<boolean> {
    const result = await DocumentModel.findByIdAndDelete(id);
    return result !== null;
  }
}

import { IDocumentChunkRepository, DocumentChunk } from './types';
import DocumentChunkModel from '../models/DocumentChunk';
import mongoose from 'mongoose';

export class MongooseDocumentChunkRepository implements IDocumentChunkRepository {
  async create(chunk: Omit<DocumentChunk, 'id' | 'createdAt'> & { orgId?: string }): Promise<DocumentChunk> {
    const c = await DocumentChunkModel.create({
      documentId: new mongoose.Types.ObjectId(chunk.documentId),
      chunkText: chunk.chunkText,
      embedding: chunk.embedding,
      pageNumber: chunk.pageNumber,
      orgId: chunk.orgId
    });
    return {
      id: c._id.toString(),
      documentId: c.documentId.toString(),
      chunkText: c.chunkText,
      embedding: c.embedding,
      pageNumber: c.pageNumber,
      createdAt: c.createdAt,
      orgId: c.orgId
    };
  }

  async findByDocumentId(documentId: string): Promise<DocumentChunk[]> {
    const list = await DocumentChunkModel.find({ documentId: new mongoose.Types.ObjectId(documentId) });
    return list.map(c => ({
      id: c._id.toString(),
      documentId: c.documentId.toString(),
      chunkText: c.chunkText,
      embedding: c.embedding,
      pageNumber: c.pageNumber,
      createdAt: c.createdAt,
      orgId: c.orgId
    }));
  }

  async deleteByDocumentId(documentId: string): Promise<boolean> {
    const result = await DocumentChunkModel.deleteMany({ documentId: new mongoose.Types.ObjectId(documentId) });
    return result.acknowledged;
  }

  async findAllChunks(orgId?: string): Promise<DocumentChunk[]> {
    const list = await DocumentChunkModel.find(orgId ? { orgId } : {});
    return list.map(c => ({
      id: c._id.toString(),
      documentId: c.documentId.toString(),
      chunkText: c.chunkText,
      embedding: c.embedding,
      pageNumber: c.pageNumber,
      createdAt: c.createdAt,
      orgId: c.orgId
    }));
  }
}

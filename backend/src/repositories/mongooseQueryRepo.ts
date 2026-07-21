import { IQueryRepository, Query } from './types';
import QueryModel from '../models/Query';

export class MongooseQueryRepository implements IQueryRepository {
  async create(query: Omit<Query, 'id' | 'createdAt'> & { orgId?: string }): Promise<Query> {
    const q = await QueryModel.create({
      userId: query.userId,
      question: query.question,
      answer: query.answer,
      confidence: query.confidence,
      orgId: query.orgId
    });
    return {
      id: q._id.toString(),
      userId: q.userId,
      question: q.question,
      answer: q.answer,
      confidence: q.confidence,
      createdAt: q.createdAt,
      orgId: q.orgId
    };
  }

  async findByUserId(userId: string, orgId?: string): Promise<Query[]> {
    const list = await QueryModel.find({ userId, ...(orgId ? { orgId } : {}) }).sort({ createdAt: -1 });
    return list.map(q => ({
      id: q._id.toString(),
      userId: q.userId,
      question: q.question,
      answer: q.answer,
      confidence: q.confidence,
      createdAt: q.createdAt,
      orgId: q.orgId
    }));
  }
}

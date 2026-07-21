import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IQuery extends MongooseDocument {
  userId: string;
  question: string;
  answer: string;
  confidence: number;
  createdAt: Date;
  orgId?: string;
}

const QuerySchema: Schema = new Schema({
  userId: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  confidence: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  orgId: { type: String }
});

export default mongoose.model<IQuery>('Query', QuerySchema);

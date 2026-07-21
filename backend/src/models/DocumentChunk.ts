import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IDocumentChunk extends MongooseDocument {
  documentId: mongoose.Types.ObjectId;
  chunkText: string;
  embedding: number[];
  pageNumber: number;
  createdAt: Date;
  orgId?: string;
}

const DocumentChunkSchema: Schema = new Schema({
  documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true },
  chunkText: { type: String, required: true },
  embedding: { type: [Number], required: true }, // Vector embedding array (768 dimensions for Gemini)
  pageNumber: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  orgId: { type: String }
});

export default mongoose.model<IDocumentChunk>('DocumentChunk', DocumentChunkSchema);

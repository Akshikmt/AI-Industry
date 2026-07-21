import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IDocument extends MongooseDocument {
  title: string;
  fileUrl: string;
  fileType: string;
  uploadedBy: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  extractedText?: string;
  createdAt: Date;
  orgId?: string;
}

const DocumentSchema: Schema = new Schema({
  title: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'ready', 'failed'], 
    default: 'pending',
    required: true 
  },
  extractedText: { type: String },
  createdAt: { type: Date, default: Date.now },
  orgId: { type: String }
});

export default mongoose.model<IDocument>('Document', DocumentSchema);

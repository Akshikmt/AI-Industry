import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: string; // e.g. "LOGIN", "UPLOAD_DOCUMENT", "ASK_COPILOT", "DELETE_DOCUMENT"
  targetId?: string; // Optional target ID (document ID, asset ID)
  metadata?: Record<string, any>;
  timestamp: Date;
  orgId?: string;
}

const ActivityLogSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetId: { type: String },
  metadata: { type: Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now },
  orgId: { type: String }
});

export default mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);

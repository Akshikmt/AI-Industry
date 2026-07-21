import mongoose, { Schema, Document } from 'mongoose';

export interface IAsset extends Document {
  assetName: string;
  equipmentTag: string; // e.g. P-101, T-202
  department: string; // e.g. Maintenance, Operations, Safety
  status?: string;
  description?: string;
  location?: string;
  createdAt: Date;
  orgId?: string;
}

const AssetSchema: Schema = new Schema({
  assetName: { type: String, required: true },
  equipmentTag: { type: String, required: true, uppercase: true, trim: true },
  department: { type: String, required: true },
  status: { type: String, default: 'Optimal' },
  description: { type: String },
  location: { type: String },
  createdAt: { type: Date, default: Date.now },
  orgId: { type: String }
});

export default mongoose.model<IAsset>('Asset', AssetSchema);

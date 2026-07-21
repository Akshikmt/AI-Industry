import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
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

const OrganizationSchema: Schema = new Schema({
  name: { type: String, required: true },
  industryType: { type: String },
  companySize: { type: String },
  addressLine1: { type: String },
  addressLine2: { type: String },
  zipCode: { type: String },
  country: { type: String },
  state: { type: String },
  city: { type: String },
  logo: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'registration' });

export default mongoose.model<IOrganization>('Organization', OrganizationSchema);

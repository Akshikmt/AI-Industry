import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Optional because we might exclude it in queries
  role: 'admin' | 'employee';
  createdAt: Date;
  orgId?: string;
  dob?: Date;
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

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'employee'], default: 'employee', required: true },
  createdAt: { type: Date, default: Date.now },
  orgId: { type: String },
  dob: { type: Date },
  phoneNumber: { type: String },
  designation: { type: String },
  department: { type: String },
  profilePhoto: { type: String },
  notes: { type: String },
  addressLine1: { type: String },
  addressLine2: { type: String },
  country: { type: String },
  state: { type: String },
  city: { type: String },
  zipCode: { type: String },
  hasLoggedIn: { type: Boolean, default: false },
  status: { type: String, enum: ['Active', 'Inactive', 'Pending'], default: 'Active' },
  employeeId: { type: String },
  officeLocation: { type: String },
  reportingManager: { type: String }
});

// Remove password when converting to JSON
UserSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});

export default mongoose.model<IUser>('User', UserSchema);

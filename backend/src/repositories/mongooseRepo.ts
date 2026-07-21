import { 
  IUserRepository, 
  IAssetRepository, 
  IActivityLogRepository, 
  IOrganizationRepository,
  User, 
  Asset, 
  ActivityLog,
  Organization
} from './types';
import UserModel from '../models/User';
import AssetModel from '../models/Asset';
import LogModel from '../models/ActivityLog';
import OrganizationModel from '../models/Organization';

const mapUser = (u: any): User => ({
  id: u._id ? u._id.toString() : u.id,
  name: u.name,
  email: u.email,
  password: u.password,
  role: u.role,
  createdAt: u.createdAt,
  orgId: u.orgId,
  dob: u.dob ? (u.dob.toISOString ? u.dob.toISOString() : u.dob) : undefined,
  phoneNumber: u.phoneNumber,
  designation: u.designation,
  department: u.department,
  profilePhoto: u.profilePhoto,
  notes: u.notes,
  addressLine1: u.addressLine1,
  addressLine2: u.addressLine2,
  country: u.country,
  state: u.state,
  city: u.city,
  zipCode: u.zipCode,
  hasLoggedIn: u.hasLoggedIn,
  status: u.status || 'Active',
  employeeId: u.employeeId,
  officeLocation: u.officeLocation,
  reportingManager: u.reportingManager
});

export class MongooseUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const u = await UserModel.findOne({ email });
    if (!u) return null;
    return mapUser(u);
  }
  async findById(id: string): Promise<User | null> {
    const u = await UserModel.findById(id);
    if (!u) return null;
    return mapUser(u);
  }
  async findByOrgId(orgId: string): Promise<User[]> {
    const list = await UserModel.find({ orgId });
    return list.map(mapUser);
  }
  async create(user: any): Promise<User> {
    const u = await UserModel.create(user);
    return mapUser(u);
  }
  async count(): Promise<number> {
    return await UserModel.countDocuments();
  }
  async update(id: string, user: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    const u = await UserModel.findByIdAndUpdate(id, user, { new: true });
    if (!u) return null;
    return mapUser(u);
  }
  async delete(id: string): Promise<boolean> {
    const res = await UserModel.findByIdAndDelete(id);
    return !!res;
  }
}

export class MongooseAssetRepository implements IAssetRepository {
  async findAll(orgId?: string): Promise<Asset[]> {
    const list = await AssetModel.find(orgId ? { orgId } : {});
    return list.map(a => ({
      id: a._id.toString(),
      assetName: a.assetName,
      equipmentTag: a.equipmentTag,
      department: a.department,
      status: a.status || 'Optimal',
      description: a.description,
      location: a.location,
      createdAt: a.createdAt,
      orgId: a.orgId
    }));
  }
  async findById(id: string, orgId?: string): Promise<Asset | null> {
    const a = await AssetModel.findOne({ _id: id, ...(orgId ? { orgId } : {}) });
    if (!a) return null;
    return {
      id: a._id.toString(),
      assetName: a.assetName,
      equipmentTag: a.equipmentTag,
      department: a.department,
      status: a.status || 'Optimal',
      description: a.description,
      location: a.location,
      createdAt: a.createdAt,
      orgId: a.orgId
    };
  }
  async create(asset: any): Promise<Asset> {
    const a = await AssetModel.create(asset);
    return {
      id: a._id.toString(),
      assetName: a.assetName,
      equipmentTag: a.equipmentTag,
      department: a.department,
      status: a.status || 'Optimal',
      description: a.description,
      location: a.location,
      createdAt: a.createdAt,
      orgId: a.orgId
    };
  }
  async count(): Promise<number> {
    return await AssetModel.countDocuments();
  }
}

export class MongooseActivityLogRepository implements IActivityLogRepository {
  async create(log: any): Promise<ActivityLog> {
    const l = await LogModel.create(log);
    return { id: l._id.toString(), userId: l.userId.toString(), action: l.action, targetId: l.targetId, metadata: l.metadata, timestamp: l.timestamp, orgId: l.orgId };
  }
  async findAll(orgId?: string): Promise<ActivityLog[]> {
    const list = await LogModel.find(orgId ? { orgId } : {}).populate('userId', 'email').sort({ timestamp: -1 });
    return list.map(l => ({
      id: l._id.toString(),
      userId: l.userId && (l.userId as any).email ? (l.userId as any).email : l.userId?.toString() || 'SYSTEM',
      action: l.action,
      targetId: l.targetId,
      metadata: l.metadata,
      timestamp: l.timestamp,
      orgId: l.orgId
    }));
  }
}

export class MongooseOrganizationRepository implements IOrganizationRepository {
  async create(org: any): Promise<Organization> {
    const o = await OrganizationModel.create(org);
    return {
      id: o._id.toString(),
      name: o.name,
      industryType: o.industryType,
      companySize: o.companySize,
      addressLine1: o.addressLine1,
      addressLine2: o.addressLine2,
      zipCode: o.zipCode,
      country: o.country,
      state: o.state,
      city: o.city,
      logo: o.logo,
      createdAt: o.createdAt
    };
  }

  async findById(id: string): Promise<Organization | null> {
    const o = await OrganizationModel.findById(id);
    if (!o) return null;
    return {
      id: o._id.toString(),
      name: o.name,
      industryType: o.industryType,
      companySize: o.companySize,
      addressLine1: o.addressLine1,
      addressLine2: o.addressLine2,
      zipCode: o.zipCode,
      country: o.country,
      state: o.state,
      city: o.city,
      logo: o.logo,
      createdAt: o.createdAt
    };
  }

  async update(id: string, org: any): Promise<Organization | null> {
    const o = await OrganizationModel.findByIdAndUpdate(id, { $set: org }, { new: true });
    if (!o) return null;
    return {
      id: o._id.toString(),
      name: o.name,
      industryType: o.industryType,
      companySize: o.companySize,
      addressLine1: o.addressLine1,
      addressLine2: o.addressLine2,
      zipCode: o.zipCode,
      country: o.country,
      state: o.state,
      city: o.city,
      logo: o.logo,
      createdAt: o.createdAt
    };
  }
}

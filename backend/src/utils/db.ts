import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { 
  IUserRepository, 
  IAssetRepository, 
  IActivityLogRepository, 
  IDocumentRepository,
  IDocumentChunkRepository,
  IQueryRepository,
  IOrganizationRepository
} from '../repositories/types';
import { MongooseUserRepository, MongooseAssetRepository, MongooseActivityLogRepository, MongooseOrganizationRepository } from '../repositories/mongooseRepo';
import { MongooseDocumentRepository } from '../repositories/mongooseDocRepo';
import { MongooseDocumentChunkRepository } from '../repositories/mongooseChunkRepo';
import { MongooseQueryRepository } from '../repositories/mongooseQueryRepo';
import { JsonUserRepository, JsonAssetRepository, JsonActivityLogRepository, JsonOrganizationRepository } from '../repositories/jsonRepo';
import { JsonDocumentRepository } from '../repositories/jsonDocRepo';
import { JsonDocumentChunkRepository } from '../repositories/jsonChunkRepo';
import { JsonQueryRepository } from '../repositories/jsonQueryRepo';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/samiq';

export let userRepository: IUserRepository;
export let assetRepository: IAssetRepository;
export let activityLogRepository: IActivityLogRepository;
export let documentRepository: IDocumentRepository;
export let documentChunkRepository: IDocumentChunkRepository;
export let queryRepository: IQueryRepository;
export let organizationRepository: IOrganizationRepository;
export let isUsingMockDB = false;

export const connectDB = async (): Promise<void> => {
  try {
    console.log('Attempting connection to MongoDB at:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 2000, // Time out connection attempts after 2 seconds
      dbName: 'industry'
    });
    console.log('MongoDB connected successfully.');
    
    userRepository = new MongooseUserRepository();
    assetRepository = new MongooseAssetRepository();
    activityLogRepository = new MongooseActivityLogRepository();
    documentRepository = new MongooseDocumentRepository();
    documentChunkRepository = new MongooseDocumentChunkRepository();
    queryRepository = new MongooseQueryRepository();
    organizationRepository = new MongooseOrganizationRepository();
    isUsingMockDB = false;
  } catch (error) {
    console.warn('\n[WARNING] Could not connect to MongoDB server.');
    console.error('Connection error details:', error);
    console.warn('Falling back to local file-based JSON database (backend/db.json) for development.');
    console.warn('This ensures the application runs perfectly out-of-the-box.\n');
    
    userRepository = new JsonUserRepository();
    assetRepository = new JsonAssetRepository();
    activityLogRepository = new JsonActivityLogRepository();
    documentRepository = new JsonDocumentRepository();
    documentChunkRepository = new JsonDocumentChunkRepository();
    queryRepository = new JsonQueryRepository();
    organizationRepository = new JsonOrganizationRepository();
    isUsingMockDB = true;
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (!isUsingMockDB) {
    try {
      await mongoose.disconnect();
      console.log('MongoDB disconnected successfully.');
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
    }
  }
};

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { connectDB, userRepository, assetRepository, activityLogRepository, organizationRepository } from './utils/db';
import { isSupabaseConfigured } from './services/supabaseService';
import authRoutes from './routes/authRoutes';
import documentRoutes from './routes/documentRoutes';
import searchRoutes from './routes/searchRoutes';
import copilotRoutes from './routes/copilotRoutes';
import graphRoutes from './routes/graphRoutes';
import insightsRoutes from './routes/insightsRoutes';
import { getAssetById, createAsset } from './controllers/assetController';
import bcrypt from 'bcryptjs';
import { authenticateToken, AuthRequest } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with support for frontend address
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve uploads directory statically so files can be downloaded
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Auto-seed function using repositories
const autoSeedIfEmpty = async () => {
  try {
    const userCount = await userRepository.count();
    let defaultOrgId = '';

    if (userCount === 0) {
      console.log('Database empty. Auto-seeding default organization and accounts...');
      const defaultOrg = await organizationRepository.create({
        name: 'SamiQ Default Organization',
        industryType: 'Manufacturing',
        companySize: '51–200',
        addressLine1: '100 Industrial Way',
        addressLine2: 'Suite A',
        zipCode: '94016',
        country: 'US',
        state: 'CA',
        city: 'San Francisco'
      });
      defaultOrgId = defaultOrg.id;

      const adminPasswordHashed = await bcrypt.hash('Admin123!', 10);
      const employeePasswordHashed = await bcrypt.hash('Employee123!', 10);

      await userRepository.create({
        name: 'Industrial Administrator',
        email: 'admin@samiq.ai',
        password: adminPasswordHashed,
        role: 'admin',
        orgId: defaultOrgId
      });
      
      await userRepository.create({
        name: 'Operations Engineer',
        email: 'employee@samiq.ai',
        password: employeePasswordHashed,
        role: 'employee',
        orgId: defaultOrgId
      });
      console.log('Seeded users: admin@samiq.ai and employee@samiq.ai under organization:', defaultOrgId);
    } else {
      const firstUser = await userRepository.findByEmail('admin@samiq.ai');
      if (firstUser) {
        defaultOrgId = firstUser.orgId || '';
      }
    }

    const assetCount = await assetRepository.count();
    if (assetCount === 0 && defaultOrgId) {
      console.log('No assets found. Seeding sample assets under organization:', defaultOrgId);
      await assetRepository.create({
        assetName: 'Centrifugal Water Pump',
        equipmentTag: 'P-101',
        department: 'Operations',
        orgId: defaultOrgId
      });
      await assetRepository.create({
        assetName: 'High Pressure Steam Turbine',
        equipmentTag: 'T-202',
        department: 'Maintenance',
        orgId: defaultOrgId
      });
      await assetRepository.create({
        assetName: 'Reciprocating Air Compressor',
        equipmentTag: 'C-303',
        department: 'Safety',
        orgId: defaultOrgId
      });
      await assetRepository.create({
        assetName: 'Shell and Tube Heat Exchanger',
        equipmentTag: 'E-404',
        department: 'Operations',
        orgId: defaultOrgId
      });
      await assetRepository.create({
        assetName: 'Emergency Shutdown Control Valve',
        equipmentTag: 'V-505',
        department: 'Safety',
        orgId: defaultOrgId
      });
      console.log('Seeded default industrial assets.');
    }
  } catch (err) {
    console.error('Failed to auto-seed database:', err);
  }
};

// Base health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'healthy', service: 'SamiQ API' });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Document management routes
app.use('/api/documents', documentRoutes);

// Semantic search routes
app.use('/api/search', searchRoutes);

// AI Copilot routes
app.use('/api/copilot', copilotRoutes);

// Knowledge graph routes
app.use('/api/graph', graphRoutes);

// Insights alerts routes
app.use('/api/insights', insightsRoutes);

// Activity logs endpoint (protected)
app.get('/api/activity', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const logs = await activityLogRepository.findAll(req.user?.orgId);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// Assets list endpoint (protected)
app.get('/api/assets', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const assets = await assetRepository.findAll(req.user?.orgId);
    res.json({ assets });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assets catalog' });
  }
});

// Single Asset detail endpoint (protected)
app.get('/api/assets/:id', authenticateToken, getAssetById);

// Create Asset endpoint (protected)
app.post('/api/assets', authenticateToken, createAsset);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error occurred' });
});

const startServer = async () => {
  // Connect to DB (automatically decides between Mongo and JSON file fallback)
  await connectDB();
  
  // Seed database if empty
  await autoSeedIfEmpty();

  // Listen
  app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
    console.log(`Supabase Storage status: ${isSupabaseConfigured() ? 'Active & Ready (Service Role)' : 'Disabled/Fallback'}`);
  });
};

startServer();

// Trigger env variables reload

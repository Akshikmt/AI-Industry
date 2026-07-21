import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from './utils/db';
import User from './models/User';
import Asset from './models/Asset';

const seedDatabase = async () => {
  console.log('Starting database seeding...');
  await connectDB();

  try {
    // 1. Clear Existing Data
    console.log('Clearing existing collections...');
    await User.deleteMany({});
    await Asset.deleteMany({});
    console.log('Collections cleared.');

    // 2. Hash Passwords
    const adminPasswordHashed = await bcrypt.hash('Admin123!', 10);
    const employeePasswordHashed = await bcrypt.hash('Employee123!', 10);

    // 3. Insert Users
    console.log('Inserting default users...');
    const users = await User.create([
      {
        name: 'Industrial Administrator',
        email: 'admin@samiq.ai',
        password: adminPasswordHashed,
        role: 'admin'
      },
      {
        name: 'Operations Engineer',
        email: 'employee@samiq.ai',
        password: employeePasswordHashed,
        role: 'employee'
      }
    ]);
    console.log(`Seeded ${users.length} users successfully.`);

    // 4. Insert Assets
    console.log('Inserting sample assets...');
    const assets = await Asset.create([
      {
        assetName: 'Centrifugal Water Pump',
        equipmentTag: 'P-101',
        department: 'Operations'
      },
      {
        assetName: 'High Pressure Steam Turbine',
        equipmentTag: 'T-202',
        department: 'Maintenance'
      },
      {
        assetName: 'Reciprocating Air Compressor',
        equipmentTag: 'C-303',
        department: 'Safety'
      },
      {
        assetName: 'Shell and Tube Heat Exchanger',
        equipmentTag: 'E-404',
        department: 'Operations'
      },
      {
        assetName: 'Emergency Shutdown Control Valve',
        equipmentTag: 'V-505',
        department: 'Safety'
      }
    ]);
    console.log(`Seeded ${assets.length} assets successfully.`);

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await disconnectDB();
  }
};

seedDatabase();

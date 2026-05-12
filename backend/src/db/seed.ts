import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from './client';
import { AdminUser, PortalConfig } from './models';

dotenv.config();

async function seed() {
  await connectDB();
  try {
    // Seed admin user
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const email = process.env.ADMIN_EMAIL || 'admin@satyalok.in';
    const passwordHash = await bcrypt.hash(password, 12);

    await AdminUser.findOneAndUpdate(
      { username },
      { username, passwordHash, email },
      { upsert: true, new: true }
    );
    console.log(`Admin user "${username}" seeded`);

    // Seed default portal configuration
    const existing = await PortalConfig.findOne();
    if (!existing) {
      const openingDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const closingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await PortalConfig.create({ openingDate, closingDate, manualStatus: 'AUTO' });
      console.log('Default portal configuration seeded');
    }

    console.log('Seed completed successfully');
  } finally {
    await disconnectDB();
  }
}

seed().catch(console.error);

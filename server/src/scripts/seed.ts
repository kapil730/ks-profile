import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { initialProjects } from '../data/initialProjects.js';

dotenv.config();

const seedDatabase = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI || mongoURI.trim() === '') {
    console.error('❌ MONGODB_URI is not defined or is empty in .env.');
    console.log('Please configure MONGODB_URI in your server/.env file before running seed.');
    process.exit(1);
  }

  try {
    console.log('⏳ Connecting to MongoDB for seeding...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB.');

    // 1. Seed Admin User
    const adminUsername = process.env.ADMIN_USERNAME || 'kapiladmin';
    const adminEmail = process.env.ADMIN_EMAIL || 'kapil.shah@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'KapilDev@2026';

    const existingAdmin = await User.findOne({
      $or: [{ username: adminUsername.toLowerCase() }, { email: adminEmail.toLowerCase() }],
    });

    if (existingAdmin) {
      console.log(`ℹ️  Admin user "${existingAdmin.username}" already exists.`);
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      await User.create({
        username: adminUsername.toLowerCase(),
        email: adminEmail.toLowerCase(),
        password: hashedPassword,
        role: 'admin',
      });
      console.log(`✅ Created admin user: "${adminUsername}"`);
      console.log(`🔑 Initial admin credentials configured securely.`);
    }

    // 2. Seed Projects
    console.log('⏳ Seeding projects...');
    for (const proj of initialProjects) {
      const exists = await Project.findOne({ slug: proj.slug });
      if (!exists) {
        await Project.create(proj);
        console.log(`  + Seeded project: ${proj.title}`);
      } else {
        console.log(`  = Project already exists: ${proj.title}`);
      }
    }

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();

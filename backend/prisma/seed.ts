import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Type definitions for environment variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ADMIN_EMAIL: string;
      ADMIN_PASSWORD: string;
      NODE_ENV: 'development' | 'production' | 'test';
      DATABASE_URL: string;
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
    }
  }
}

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const displayName = 'Admin User';

  // First, create the admin user
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN', // Ensure role is set to ADMIN
      isActive: true,
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      displayName,
      role: 'ADMIN', 
      isActive: true,
    },
  });

  console.log('Created admin user:', { email: adminUser.email });

  // Create default branch if not exists
  const defaultBranch = await prisma.branch.upsert({
    where: { id: '00000000-0000-0000-0000-000000000000' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Head Office',
      location: 'Main City',
      description: 'Main branch office',
    },
  });

  console.log('Created default branch:', defaultBranch);

  // Create default team if not exists
  const defaultTeam = await prisma.team.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Management',
      description: 'Management team',
      branchId: defaultBranch.id,
      leaderId: adminUser.id, 
    },
  });

  console.log('Created default team:', defaultTeam);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
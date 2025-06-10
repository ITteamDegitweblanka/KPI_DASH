import { PrismaClient, Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create a default admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: await hash('admin123', 10),
      firstName: 'Admin',
      lastName: 'User',
      displayName: 'Admin',
      role: 'SUPER_ADMIN',
    },
  });

  console.log('Database seeded successfully!');
  console.log(`Admin user created with email: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
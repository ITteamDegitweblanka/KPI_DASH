import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const models = Object.getOwnPropertyNames(prisma)
    .filter(prop => !prop.startsWith('$') && !prop.startsWith('_'));
  
  console.log('Available models:', models);
  
  // Check specific models
  const modelChecks = {
    userSettings: 'userSettings' in prisma,
    UserSettings: 'UserSettings' in prisma,
    settings: 'settings' in prisma,
    Setting: 'Setting' in prisma,
  };
  
  console.log('\nModel existence check:');
  console.table(modelChecks);
  
  await prisma.$disconnect();
}

main().catch(console.error);

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkModels() {
  // @ts-ignore - Accessing internal property
  const modelNames = Object.keys(prisma).filter(key => 
    !key.startsWith('$') && 
    !key.startsWith('_') && 
    typeof prisma[key]?.findMany === 'function'
  );
  
  console.log('Available Prisma models:', modelNames);
  
  // Check UserSettings model specifically
  if ('userSettings' in prisma) {
    console.log('userSettings model exists');
  } else if ('UserSettings' in prisma) {
    console.log('UserSettings model exists');
  } else {
    console.log('Neither userSettings nor UserSettings model found');
  }
  
  await prisma.$disconnect();
}

checkModels().catch(console.error);

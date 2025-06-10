import { PrismaClient } from '@prisma/client';

// Add Prisma types to NodeJS global type
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Type for Prisma query event
interface QueryEvent {
  query: string;
  params: string;
  duration: number;
}

// Create a singleton instance of PrismaClient
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  prisma = global.prisma;
}

// Simple logger for development
const logger = {
  log: (...args: any[]) => process.env.NODE_ENV === 'development' && console.log(...args),
  error: (...args: any[]) => process.env.NODE_ENV === 'development' && console.error(...args),
  warn: (...args: any[]) => process.env.NODE_ENV === 'development' && console.warn(...args)
};

// Log all queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: QueryEvent) => {
    logger.log('Query:', e.query);
    logger.log('Params:', e.params);
    logger.log('Duration:', e.duration, 'ms');
  });

  prisma.$on('error' as never, (e: any) => {
    logger.error('Prisma Error:', e.message);
  });

  prisma.$on('warn' as never, (e: any) => {
    logger.warn('Prisma Warning:', e.message);
  });
}

// Handle Prisma errors with proper typing
prisma.$use(async (params: any, next: any) => {
  try {
    return await next(params);
  } catch (error) {
    console.error('Prisma error:', error);
    throw error;
  }
});

// Handle process termination to close the Prisma client
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  logger.error('Uncaught Exception:', error);
  await prisma.$disconnect();
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason) => {
  logger.error('Unhandled Rejection:', reason);
  await prisma.$disconnect();
  process.exit(1);
});

export { prisma };
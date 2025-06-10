"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const logger_1 = require("./logger");
const client_1 = require("@prisma/client");
// Create a singleton instance of PrismaClient
let prisma;
if (process.env.NODE_ENV === 'production') {
    exports.prisma = prisma = new client_1.PrismaClient({
        log: [
            { level: 'query', emit: 'event' },
            { level: 'error', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
        ],
    });
}
else {
    if (!global.prisma) {
        global.prisma = new client_1.PrismaClient({
            log: [
                { level: 'query', emit: 'event' },
                { level: 'error', emit: 'stdout' },
                { level: 'warn', emit: 'stdout' },
            ],
        });
    }
    exports.prisma = prisma = global.prisma;
}
// Log all queries in development
if (process.env.NODE_ENV === 'development') {
    prisma.$on('query', (e) => {
        logger_1.logger.debug(`Query: ${e.query}`);
        logger_1.logger.debug(`Params: ${e.params}`);
        logger_1.logger.debug(`Duration: ${e.duration}ms`);
    });
    prisma.$on('error', (e) => {
        logger_1.logger.error(`Prisma Error: ${e.message}`);
    });
    prisma.$on('warn', (e) => {
        logger_1.logger.warn(`Prisma Warning: ${e.message}`);
    });
}
// Handle process termination to close the Prisma client
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    await prisma.$disconnect();
    process.exit(1);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason) => {
    logger_1.logger.error('Unhandled Rejection:', reason);
    await prisma.$disconnect();
    process.exit(1);
});

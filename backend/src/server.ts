import 'module-alias/register';
import 'reflect-metadata';
import http from 'http';
import { AddressInfo } from 'net';
import { App } from './app';
import { logger } from './utils/logger';
import { config } from './config';
import cors from 'cors';
import dotenv from 'dotenv';


dotenv.config();
const { port } = config.app;

// Initialize the Express application
const appInstance = new App();
const app = appInstance.express;

app.use(cors({
  origin: config.cors.origin,  // This is correct
  credentials: true
}));
const server = http.createServer(app);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection:', reason);
  // Consider whether to crash the process or log and continue
  // process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  // Consider whether to crash the process or log and continue
  // process.exit(1);
});

// Start the server
const startServer = async (): Promise<void> => {
  try {
    // If you need to run any pre-start checks or migrations, do it here
    
    server.listen(port, () => {
      const address = server.address() as AddressInfo;
      logger.info(`Server running on port ${address.port} in ${config.app.env} mode`);
      logger.info(`API Documentation available at http://localhost:${address.port}/api-docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
const shutdown = (signal: string) => {
  logger.info(`${signal} received: closing HTTP server`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    // Close database connections, etc.
    process.exit(0);
  });
  
  // Force close server after 5 seconds
  setTimeout(() => {
    logger.error('Forcing server shutdown');
    process.exit(1);
  }, 5000);
};

// Handle termination signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start the application
startServer();

export { server };

// This file is the entry point of the application. It sets up the HTTP server,
// handles uncaught exceptions and unhandled rejections, and manages graceful shutdown.
// The actual Express application is initialized in app.ts.
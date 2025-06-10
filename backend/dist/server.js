"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
require("module-alias/register");
require("reflect-metadata");
const http_1 = __importDefault(require("http"));
const app_1 = require("./app");
const logger_1 = require("./utils/logger");
const config_1 = require("./config");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const { port } = config_1.config.app;
// Initialize the Express application
const appInstance = new app_1.App();
const app = appInstance.express;
app.use((0, cors_1.default)({
    origin: config_1.config.cors.origin, // This is correct
    credentials: true
}));
const server = http_1.default.createServer(app);
exports.server = server;
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
    logger_1.logger.error('Unhandled Rejection:', reason);
    // Consider whether to crash the process or log and continue
    // process.exit(1);
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    // Consider whether to crash the process or log and continue
    // process.exit(1);
});
// Start the server
const startServer = async () => {
    try {
        // If you need to run any pre-start checks or migrations, do it here
        server.listen(port, () => {
            const address = server.address();
            logger_1.logger.info(`Server running on port ${address.port} in ${config_1.config.app.env} mode`);
            logger_1.logger.info(`API Documentation available at http://localhost:${address.port}/api-docs`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
// Handle graceful shutdown
const shutdown = (signal) => {
    logger_1.logger.info(`${signal} received: closing HTTP server`);
    server.close(() => {
        logger_1.logger.info('HTTP server closed');
        // Close database connections, etc.
        process.exit(0);
    });
    // Force close server after 5 seconds
    setTimeout(() => {
        logger_1.logger.error('Forcing server shutdown');
        process.exit(1);
    }, 5000);
};
// Handle termination signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
// Start the application
startServer();
// This file is the entry point of the application. It sets up the HTTP server,
// handles uncaught exceptions and unhandled rejections, and manages graceful shutdown.
// The actual Express application is initialized in app.ts.

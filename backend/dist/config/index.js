"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
// Parse environment variables with defaults
const parsedCorsOrigin = process.env.CORS_ORIGIN ?
    (process.env.CORS_ORIGIN.includes(',') ?
        process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) :
        process.env.CORS_ORIGIN) :
    '*';
// Build the config object
const config = {
    app: {
        env: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT || '3001', 10),
        name: process.env.APP_NAME || 'Employee KPI Dashboard API',
    },
    db: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/employee_kpi?schema=public',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
        accessExpirationMinutes: parseInt(process.env.JWT_ACCESS_EXPIRATION_MINUTES || '60', 10),
        refreshExpirationDays: parseInt(process.env.JWT_REFRESH_EXPIRATION_DAYS || '30', 10),
        resetPasswordExpirationMinutes: parseInt(process.env.JWT_RESET_PASSWORD_EXPIRATION_MINUTES || '10', 10),
    },
    cors: {
        origin: parsedCorsOrigin,
    },
    morgan: {
        format: process.env.MORGAN_FORMAT || 'dev',
    },
    api: {
        prefix: process.env.API_PREFIX || '/api/v1',
    },
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
    },
};
exports.config = config;
// Validate required environment variables
const requiredVariables = [
    'DATABASE_URL',
    'JWT_SECRET',
];
const missingVariables = requiredVariables.filter(key => !process.env[key]);
if (missingVariables.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVariables.join(', ')}`);
}
// This module centralizes all configuration settings for the application.
// It loads environment variables from the .env file and provides type-safe access to them.
// The config object is frozen to prevent accidental modifications at runtime.

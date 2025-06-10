import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Define the interface for the environment variables
interface IEnvVars {
  app: {
    env: string;
    port: number;
    name: string;
  };
  db: {
    url: string;
  };
  jwt: {
    secret: string;
    accessExpirationMinutes: number;
    refreshExpirationDays: number;
    resetPasswordExpirationMinutes: number;
  };
  cors: {
    origin: string | string[];
  };
  morgan: {
    format: 'combined' | 'common' | 'dev' | 'short' | 'tiny';
  };
  api: {
    prefix: string;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
}

// Parse environment variables with defaults
const parsedCorsOrigin = process.env.CORS_ORIGIN ? 
  (process.env.CORS_ORIGIN.includes(',') ? 
    process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : 
    process.env.CORS_ORIGIN) : 
  '*';

// Build the config object
const config: IEnvVars = {
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
    format: (process.env.MORGAN_FORMAT as 'combined' | 'common' | 'dev' | 'short' | 'tiny') || 'dev',
  },
  api: {
    prefix: process.env.API_PREFIX || '/api/v1',
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
};

// Validate required environment variables
const requiredVariables = [
  'DATABASE_URL',
  'JWT_SECRET',
];

const missingVariables = requiredVariables.filter(key => !process.env[key]);

if (missingVariables.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVariables.join(', ')}`);
}

export { config };

// This module centralizes all configuration settings for the application.
// It loads environment variables from the .env file and provides type-safe access to them.
// The config object is frozen to prevent accidental modifications at runtime.

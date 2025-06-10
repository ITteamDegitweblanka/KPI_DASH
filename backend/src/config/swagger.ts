import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './';

const API_VERSION = '1.0.0'; // Hardcoded version number

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Employee KPI Dashboard API',
      version: API_VERSION,
      description: 'API documentation for the Employee KPI Dashboard',
    },
    servers: [
      {
        url: `http://localhost:${config.app.port}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerSpec };
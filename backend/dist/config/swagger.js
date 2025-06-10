"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const _1 = require("./");
const API_VERSION = '1.0.0'; // Hardcoded version number
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Employee KPI Dashboard API',
            version: API_VERSION,
            description: 'API documentation for the Employee KPI Dashboard',
        },
        servers: [
            {
                url: `http://localhost:${_1.config.app.port}`,
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
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
exports.swaggerSpec = swaggerSpec;

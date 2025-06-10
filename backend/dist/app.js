"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const express_1 = __importStar(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const http_status_codes_1 = require("http-status-codes");
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const error_middleware_1 = require("./middleware/error.middleware");
const rate_limit_middleware_1 = require("./middleware/rate-limit.middleware");
const api_error_1 = require("./utils/api-error");
const routes_1 = require("./routes");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./config/swagger");
class App {
    constructor() {
        this.express = (0, express_1.default)();
        // Initialize middlewares
        this.initializeMiddlewares();
        // Initialize routes
        this.initializeRoutes();
        // Initialize error handling
        this.initializeErrorHandling();
        // Handle 404 Not Found
        this.initializeNotFoundHandler();
    }
    initializeMiddlewares() {
        // Enable CORS
        this.express.use((0, cors_1.default)({
            origin: function (origin, callback) {
                // Allow requests with no origin (like mobile apps or curl requests)
                if (!origin)
                    return callback(null, true);
                // Allow all origins in development
                if (config_1.config.app.env === 'development') {
                    return callback(null, true);
                }
                // In production, use the configured allowed origins
                if (config_1.config.cors.origin.includes(origin)) {
                    return callback(null, true);
                }
                return callback(new Error('Not allowed by CORS'));
            },
            credentials: true,
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            optionsSuccessStatus: 200 // Some legacy browsers choke on 204
        }));
        // Handle preflight requests
        this.express.options('*', (0, cors_1.default)());
        // Security headers
        this.express.use((0, helmet_1.default)());
        // Request logging
        this.express.use((0, morgan_1.default)(config_1.config.morgan.format, { stream: logger_1.stream }));
        // Parse JSON request body
        this.express.use(express_1.default.json());
        // Parse URL-encoded request body
        this.express.use(express_1.default.urlencoded({ extended: true }));
        // Gzip compression
        this.express.use((0, compression_1.default)());
        // Rate limiting for API routes in production
        if (config_1.config.app.env === 'production') {
            this.express.use((req, res, next) => {
                rate_limit_middleware_1.apiLimiter(req, res, next);
            });
        }
    }
    initializeRoutes() {
        // Root endpoint for friendly API message
        this.express.get('/', (_req, res) => {
            res.status(http_status_codes_1.StatusCodes.OK).json({
                status: 'ok',
                message: 'API is running',
                timestamp: new Date().toISOString(),
                env: config_1.config.app.env,
            });
        });
        // Health check endpoint
        this.express.get('/health', (_req, res) => {
            res.status(http_status_codes_1.StatusCodes.OK).json({
                status: 'ok',
                message: 'Server is running',
                timestamp: new Date().toISOString(),
                env: config_1.config.app.env,
            });
        });
        // Swagger API documentation
        const swaggerUiOptions = {
            explorer: true,
        };
        // Create a separate router for Swagger UI
        const swaggerRouter = (0, express_1.Router)();
        // Serve Swagger UI files
        swaggerRouter.use(swagger_ui_express_1.default.serve);
        // Setup Swagger UI handler
        const swaggerUiHandler = swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, swaggerUiOptions);
        // Apply the handler with proper typing
        swaggerRouter.get('/', (req, res, next) => {
            return swaggerUiHandler(req, res, next);
        });
        // Mount the Swagger router
        this.express.use('/api-docs', swaggerRouter);
        // API routes with rate limiting in production
        if (config_1.config.app.env === 'production') {
            // Create a router for API routes with rate limiting
            const apiRoutes = (0, express_1.Router)();
            // Apply rate limiter to all API routes
            apiRoutes.use((req, res, next) => {
                rate_limit_middleware_1.apiLimiter(req, res, next);
            });
            // Mount the API router with rate limiting
            apiRoutes.use(routes_1.apiRouter);
            this.express.use(config_1.config.api.prefix, apiRoutes);
        }
        else {
            this.express.use(config_1.config.api.prefix, routes_1.apiRouter);
        }
    }
    initializeErrorHandling() {
        // Error handling middleware
        this.express.use((err, req, res, next) => {
            (0, error_middleware_1.errorHandler)(err, req, res, next);
        });
    }
    initializeNotFoundHandler() {
        // Handle 404 Not Found
        this.express.use((req, res, next) => {
            next(new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, `Not Found - ${req.originalUrl}`));
        });
    }
}
exports.App = App;

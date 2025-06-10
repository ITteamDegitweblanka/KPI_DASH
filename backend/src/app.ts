import express, { Application, NextFunction, Request, Response, RequestHandler, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { StatusCodes } from 'http-status-codes';
import { config } from './config';
import { logger, stream } from './utils/logger';
import { errorHandler } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rate-limit.middleware';
import { ApiError } from './utils/api-error';
import { apiRouter } from './routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { UserRole } from './types';

// Extend the Request type to include any custom properties
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        teamId?: string | null;
      };
    }
  }
}

class App {
  public express: Application;

  constructor() {
    this.express = express();
    
    // Initialize middlewares
    this.initializeMiddlewares();
    
    // Initialize routes
    this.initializeRoutes();
    
    // Initialize error handling
    this.initializeErrorHandling();
    
    // Handle 404 Not Found
    this.initializeNotFoundHandler();
  }

  private initializeMiddlewares(): void {
    // Enable CORS
    this.express.use(cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow all origins in development
        if (config.app.env === 'development') {
          return callback(null, true);
        }
        
        // In production, use the configured allowed origins
        if (config.cors.origin.includes(origin)) {
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
    this.express.options('*', cors());

    // Security headers
    this.express.use(helmet());

    // Request logging
    this.express.use(morgan(config.morgan.format, { stream }));

    // Parse JSON request body
    this.express.use(express.json());

    // Parse URL-encoded request body
    this.express.use(express.urlencoded({ extended: true }));

    // Gzip compression
    this.express.use(compression());

    // Rate limiting for API routes in production
    if (config.app.env === 'production') {
      this.express.use((req: Request, res: Response, next: NextFunction) => {
        (apiLimiter as any)(req, res, next);
      });
    }
  }

  private initializeRoutes(): void {
    // Root endpoint for friendly API message
    this.express.get('/', (_req: Request, res: Response) => {
      res.status(StatusCodes.OK).json({
        status: 'ok',
        message: 'API is running',
        timestamp: new Date().toISOString(),
        env: config.app.env,
      });
    });

    // Health check endpoint
    this.express.get('/health', (_req: Request, res: Response) => {
      res.status(StatusCodes.OK).json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        env: config.app.env,
      });
    });

    // Swagger API documentation
    const swaggerUiOptions = {
      explorer: true,
    };
    
    // Create a separate router for Swagger UI
    const swaggerRouter = Router();
    
    // Serve Swagger UI files
    swaggerRouter.use(swaggerUi.serve);
    
    // Setup Swagger UI handler
    const swaggerUiHandler = swaggerUi.setup(swaggerSpec, swaggerUiOptions);
    
    // Apply the handler with proper typing
    swaggerRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
      return (swaggerUiHandler as any)(req, res, next);
    });
    
    // Mount the Swagger router
    this.express.use('/api-docs', swaggerRouter);

    // API routes with rate limiting in production
    if (config.app.env === 'production') {
      // Create a router for API routes with rate limiting
      const apiRoutes = Router();
      
      // Apply rate limiter to all API routes
      apiRoutes.use((req: Request, res: Response, next: NextFunction) => {
        (apiLimiter as any)(req, res, next);
      });
      
      // Mount the API router with rate limiting
      apiRoutes.use(apiRouter);
      this.express.use(config.api.prefix, apiRoutes);
    } else {
      this.express.use(config.api.prefix, apiRouter);
    }
  }

  private initializeErrorHandling(): void {
    // Error handling middleware
    this.express.use((
      err: any,
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      errorHandler(err, req, res, next);
    });
  }
  
  private initializeNotFoundHandler(): void {
    // Handle 404 Not Found
    this.express.use((req: Request, res: Response, next: NextFunction) => {
      next(new ApiError(StatusCodes.NOT_FOUND, `Not Found - ${req.originalUrl}`));
    });
  }
}

export { App };
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.stream = exports.logger = void 0;
const winston_1 = __importStar(require("winston"));
// Define log format
const logFormat = winston_1.format.printf((info) => {
    const { level, message, timestamp, ...meta } = info;
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
        log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return log;
});
// Create logger instance
const logger = winston_1.default.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston_1.format.combine(winston_1.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.format.errors({ stack: true }), winston_1.format.splat(), winston_1.format.json(), logFormat),
    defaultMeta: { service: 'employee-kpi-backend' },
    transports: [
        // Write all logs with level `error` and below to `error.log`
        new winston_1.transports.File({ filename: 'logs/error.log', level: 'error' }),
        // Write all logs to `combined.log`
        new winston_1.transports.File({ filename: 'logs/combined.log' }),
    ],
    exceptionHandlers: [
        new winston_1.transports.File({ filename: 'logs/exceptions.log' })
    ]
});
exports.logger = logger;
// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston_1.transports.Console({
        format: winston_1.format.combine(winston_1.format.colorize(), logFormat)
    }));
}
// Create a stream for morgan to use
const stream = {
    write: (message) => {
        logger.info(message.trim());
    },
};
exports.stream = stream;

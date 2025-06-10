import winston, { format, transports } from 'winston';
import { TransformableInfo } from 'logform';

// Define log format
const logFormat = format.printf((info: TransformableInfo) => {
  const { level, message, timestamp, ...meta } = info;
  let log = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(meta).length > 0) {
    log += ` ${JSON.stringify(meta, null, 2)}`;
  }
  
  return log;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
    logFormat
  ),
  defaultMeta: { service: 'employee-kpi-backend' },
  transports: [
    // Write all logs with level `error` and below to `error.log`
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs to `combined.log`
    new transports.File({ filename: 'logs/combined.log' }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: 'logs/exceptions.log' })
  ]
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      logFormat
    )
  }));
}

// Create a stream for morgan to use
const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export { logger, stream };
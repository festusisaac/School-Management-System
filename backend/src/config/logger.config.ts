import * as winston from 'winston';
import * as path from 'path';

const isDevelopment = process.env.NODE_ENV !== 'production';
const logDir = process.env.LOG_DIR || 'logs';

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(
    (info) =>
      `${info.timestamp} [${info.level}] ${info.message}${
        info.error ? ': ' + info.error : ''
      }`,
  ),
);

const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      format,
    ),
  }),
  // All logs
  new winston.transports.File({
    filename: path.join(logDir, 'all.log'),
    maxsize: 10485760, // 10MB
    maxFiles: 10,
    format,
  }),
  // Error logs only
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    maxsize: 10485760,
    maxFiles: 10,
    format,
  }),
];

// Remove file transports in development
if (isDevelopment) {
  transports.pop(); // Remove error logs file
  transports.pop(); // Remove all logs file
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  format,
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
    }),
  ],
});

import pino, { Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import { LOG_LEVEL, NODE_ENV } from './env.js';

// Define options for pino-pretty in development
const pinoPrettyTransport = {
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:HH:MM:ss',
      ignore: 'pid,hostname,req,res,responseTime',
    },
  },
};

// Create the logger instance
// In production, it will output JSON
// In development, it will use pino-pretty
export const logger: Logger = pino({
  level: LOG_LEVEL,
  ...(NODE_ENV !== 'production' && pinoPrettyTransport),
});

export const httpLogger = pinoHttp({
  logger: logger,

  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },

  // Optional: A clean success message
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} - ${res.statusCode}`;
  },
});


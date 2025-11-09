import pino, { Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import { LOG_LEVEL, NODE_ENV } from './env.js';

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

  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} - ${res.statusCode}`;
  },
});

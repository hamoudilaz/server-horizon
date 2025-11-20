import pino, { Logger, TransportTargetOptions } from 'pino';
import { pinoHttp } from 'pino-http';
import { LOG_LEVEL, NODE_ENV, LOKI_HOST, APP_NAME } from './env.js';

const transports: TransportTargetOptions[] = [];

if (NODE_ENV !== 'production') {
  transports.push({
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:HH:MM:ss',
      ignore: 'pid,hostname,req,res,responseTime',
    },
  });
}

if (LOKI_HOST) {
  transports.push({
    target: 'pino-loki',
    options: {
      batching: true,
      interval: 5,
      host: LOKI_HOST,
      labels: { app: APP_NAME, env: NODE_ENV },
    },
  });
}

export const logger: Logger = pino({
  level: LOG_LEVEL,
  transport: { targets: transports },
});

export const httpLogger = pinoHttp({
  logger,
  serializers: {
    req: (req) => ({ method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} - ${res.statusCode}`,
});

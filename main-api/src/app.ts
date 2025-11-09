// src/app.ts
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import apiRouter from './api/index.js';
import { errorHandler } from './core/middlewares/errorHandler.js';
import { redisStore } from './config/redis.js';
import { NODE_ENV, SESSION_SECRET, FRONTEND_URL_CORS, logger } from '@horizon/shared';
import { httpLogger } from '@horizon/shared/logger.js';

if (!SESSION_SECRET) {
  throw new Error('Missing SESSION_SECRET');
}

const app: Express = express();

const COOKIE_OPTIONS = {
  domain: NODE_ENV === 'production' ? '.horizonlabs.se' : undefined,
  path: '/',
  secure: NODE_ENV === 'production',
  httpOnly: true,
  sameSite: NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
  maxAge: 86400000,
};

// --- Middleware Setup ---
app.set('trust proxy', 1);
app.use(helmet());
app.use(
  cors({
    origin: FRONTEND_URL_CORS,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
  })
);

app.use(httpLogger);
app.use(express.json());
app.use(cookieParser());

app.use(
  rateLimit({
    windowMs: 10000,
    max: 1533,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP ${req.ip}`);
      res.status(429).json({
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'You are being rate limited. Please try again later.',
      });
    },
  })
);

app.use(
  session({
    name: 'sessionId',
    secret: SESSION_SECRET,
    saveUninitialized: false,
    cookie: COOKIE_OPTIONS,
    rolling: false,
    resave: false,
    store: redisStore,
  })
);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to root!' });
});

console.log('placeholder for CI test');
// --- Routes ---
app.use('/api', apiRouter);

// --- Error Handling ---
app.use(errorHandler);

export default app;

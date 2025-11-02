// src/app.ts
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import apiRouter from './api/index.js'; // Your main router
import { errorHandler } from './core/middleware/errorHandler.js';

dotenv.config();

if (!process.env.SESSION_SECRET) {
  throw new Error('Missing SESSION_SECRET');
}

const app: Express = express();

const COOKIE_OPTIONS = {
  domain: process.env.NODE_ENV === 'production' ? '.horizonlabs.se' : undefined,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
  maxAge: 86400000,
};

// --- Middleware Setup ---
app.set('trust proxy', 1);
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL_CORS,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
  })
);
app.use(express.json());
app.use(cookieParser());

app.use(
  rateLimit({
    windowMs: 10000,
    max: 1533,
    handler: (req, res) => {
      console.log(`Rate limit exceeded for IP ${req.ip}`);
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
    secret: process.env.SESSION_SECRET!,
    saveUninitialized: false,
    cookie: COOKIE_OPTIONS,
    rolling: false,
    resave: false,
  })
);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to root!' });
});

// --- Routes ---
app.use('/api', apiRouter);

// --- Error Handling ---
app.use(errorHandler);

export default app;

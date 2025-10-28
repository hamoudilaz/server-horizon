import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import { setupWebSocket } from './helpers/constants.js';
import registerRoutes from './routes/route.js';
import dotenv from 'dotenv';
dotenv.config();

const COOKIE_OPTIONS = {
  name: 'sessionId',
  domain: process.env.NODE_ENV === 'production' ? '.horizonlabs.se' : undefined,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
  maxAge: 86400000,
};

const app = Fastify({ logger: false, trustProxy: true });

if (!process.env.SESSION_SECRET) throw new Error('Missing SESSION_SECRET');

await app.register(rateLimit, {
  max: 1533,
  timeWindow: 10000,
  ban: 20,
  keyGenerator: (req) => req.ip,
  skipOnError: false,
  onExceeded: (request) => {
    console.log(`Banning IP ${request.ip} for 20 seconds due to spam.`);
  },
  errorResponseBuilder: () => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: 'You are being rate limited for spamming requests. Please try again after 20 seconds.',
  }),
});

app.register(fastifyCookie);

app.register(fastifySession, {
  secret: process.env.SESSION_SECRET!,
  saveUninitialized: false,
  cookie: COOKIE_OPTIONS,
  rolling: false,
});

app.register(helmet);

app.register(cors, {
  origin: process.env.FRONTEND_URL_CORS,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
});

registerRoutes(app);

const start = async () => {
  const port = 3000;
  try {
    await app.listen({ port, host: '0.0.0.0' });

    setupWebSocket(app.server);

    console.log(`🚀 HTTP + WebSocket running on port ${port}`);
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
};

start();

export default app;

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

const app = Fastify({ logger: false, trustProxy: true });
if (!process.env.SESSION_SECRET) throw new Error('Missing SESSION_SECRET');

await app.register(rateLimit, {
  max: 10,
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
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 86400000, // 1 day
  },
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

    const httpServer = app.server;
    setupWebSocket(httpServer);

    console.log(`🚀 HTTP + WebSocket running on port ${port}`);
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  start();
}

export default app;

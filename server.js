import app from './routes/route.js';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import fastifyCookie from '@fastify/cookie';
import { setupWebSocket } from './helpers/constants.js';

dotenv.config();

app.register(fastifyCookie);

app.register(cors, {
    origin: process.env.FRONTEND_URL_CORS,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS']
});


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
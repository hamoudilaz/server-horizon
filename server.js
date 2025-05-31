import fastify from './routes/route.js';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import fastifyCookie from '@fastify/cookie';
import { setupWebSocket } from './helpers/websocket.js';

dotenv.config();

fastify.register(fastifyCookie);

fastify.register(cors, {
    origin: process.env.FRONTEND_URL_CORS,
    credentials: true
});


const startServer = async () => {
    const port = 3000;
    try {
        await fastify.listen({ port, host: '0.0.0.0' });

        const httpServer = fastify.server;
        setupWebSocket(httpServer);

        console.log(`🚀 HTTP + WebSocket running on port ${port}`);
    } catch (err) {
        console.error('Startup error:', err);
        process.exit(1);
    }
};

startServer();
